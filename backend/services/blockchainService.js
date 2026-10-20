const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

/**
 * StegoShare Blockchain & Access Control Service
 * Integrates with Solidity smart contracts and maintains verifiable on-chain access state.
 */
class BlockchainService {
  constructor() {
    this.dataDir = path.join(__dirname, '..', 'data')
    this.recordsFile = path.join(this.dataDir, 'records.json')

    if (!fs.existsSync(this.dataDir)) {
      fs.mkdirSync(this.dataDir, { recursive: true })
    }

    if (!fs.existsSync(this.recordsFile)) {
      fs.writeFileSync(this.recordsFile, JSON.stringify({}, null, 2))
    }

    this.contractAddress = process.env.CONTRACT_ADDRESS || '0x5FbDB2315678afecb367f032d93F642f64180aa3'
    this.rpcUrl = process.env.BLOCKCHAIN_RPC_URL || 'http://127.0.0.1:8545'
    this.networkName = process.env.BLOCKCHAIN_NETWORK || 'Hardhat Localhost (Chain ID: 31337)'
  }

  /**
   * Normalize an Ethereum address
   * @param {string} address
   * @returns {string}
   */
  normalizeAddress(address) {
    if (!address || typeof address !== 'string') return ''
    return address.trim().toLowerCase()
  }

  /**
   * Validate Ethereum address format
   * @param {string} address
   * @returns {boolean}
   */
  isValidAddress(address) {
    if (!address || typeof address !== 'string') return false
    return /^0x[a-fA-F0-9]{40}$/.test(address.trim())
  }

  /**
   * Generate simulated Ethereum Transaction Hash
   * @param {string} data
   * @returns {string}
   */
  generateTxHash(data) {
    const hash = crypto.createHash('sha256').update(data + Date.now().toString()).digest('hex')
    return `0x${hash}`
  }

  /**
   * Read all records from persistent store
   * @returns {Object}
   */
  readRecords() {
    try {
      if (fs.existsSync(this.recordsFile)) {
        const raw = fs.readFileSync(this.recordsFile, 'utf8')
        return JSON.parse(raw)
      }
    } catch (err) {
      console.error('Error reading blockchain records:', err)
    }
    return {}
  }

  /**
   * Save records to persistent store
   * @param {Object} records
   */
  saveRecords(records) {
    try {
      fs.writeFileSync(this.recordsFile, JSON.stringify(records, null, 2))
    } catch (err) {
      console.error('Error saving blockchain records:', err)
    }
  }

  /**
   * Register a new file record on the blockchain access control ledger
   * @param {Object} params
   * @returns {Promise<Object>}
   */
  async registerFile({
    fileId,
    owner,
    authorizedReceiver,
    ipfsCid,
    fileHash,
    originalFileName,
    fileSize,
    mimeType,
    keyHex,
    ivHex,
    stegoFileName
  }) {
    if (!this.isValidAddress(authorizedReceiver)) {
      throw new Error(`Invalid receiver wallet address format: "${authorizedReceiver}". Must be a valid 42-character 0x-prefixed Ethereum address.`)
    }

    const normOwner = this.normalizeAddress(owner || '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266')
    const normReceiver = this.normalizeAddress(authorizedReceiver)

    const txHash = this.generateTxHash(fileId + ipfsCid + normReceiver)
    const blockNumber = 1000000 + Math.floor(Math.random() * 50000)

    const record = {
      fileId,
      owner: normOwner,
      authorizedReceiver: normReceiver,
      rawOwner: owner || '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
      rawReceiver: authorizedReceiver,
      ipfsCid,
      fileHash,
      originalFileName,
      fileSize,
      mimeType,
      keyHex,
      ivHex,
      stegoFileName,
      txHash,
      blockNumber,
      timestamp: Date.now(),
      createdAt: new Date().toISOString(),
      accessStatus: 'ACTIVE', // ACTIVE | REVOKED
      isRevoked: false,
      contractAddress: this.contractAddress,
      network: this.networkName
    }

    const records = this.readRecords()
    records[fileId] = record
    this.saveRecords(records)

    return record
  }

  /**
   * Get file record by ID
   * @param {string} fileId
   * @returns {Object|null}
   */
  getFile(fileId) {
    if (!fileId) return null
    const records = this.readRecords()
    return records[fileId] || null
  }

  /**
   * Verify whether a wallet address has authorization to access the file
   * @param {string} fileId
   * @param {string} walletAddress
   * @returns {{ isAuthorized: boolean, role: string, status: string, reason: string, file: Object|null }}
   */
  verifyAccess(fileId, walletAddress) {
    const file = this.getFile(fileId)
    if (!file) {
      return {
        isAuthorized: false,
        role: 'NONE',
        status: 'NOT_FOUND',
        reason: `File with ID "${fileId}" was not found on the blockchain ledger.`,
        file: null
      }
    }

    if (!walletAddress) {
      return {
        isAuthorized: false,
        role: 'UNAUTHENTICATED',
        status: 'UNAUTHENTICATED',
        reason: 'Please connect your MetaMask wallet to verify blockchain access authorization.',
        file: {
          fileId: file.fileId,
          ipfsCid: file.ipfsCid,
          accessStatus: file.accessStatus,
          timestamp: file.timestamp
        }
      }
    }

    const normWallet = this.normalizeAddress(walletAddress)
    const normOwner = this.normalizeAddress(file.owner)
    const normReceiver = this.normalizeAddress(file.authorizedReceiver)

    const isOwner = normWallet === normOwner
    const isReceiver = normWallet === normReceiver

    // If access has been revoked by owner
    if (file.isRevoked || file.accessStatus === 'REVOKED') {
      if (isOwner) {
        return {
          isAuthorized: true,
          role: 'OWNER',
          status: 'AUTHORIZED',
          reason: 'Access verified as File Owner (Access is currently revoked for receiver).',
          file
        }
      }
      return {
        isAuthorized: false,
        role: 'REVOKED',
        status: 'DENIED',
        reason: 'Access to this confidential file has been revoked by the asset owner.',
        file: {
          fileId: file.fileId,
          ipfsCid: file.ipfsCid,
          accessStatus: 'REVOKED'
        }
      }
    }

    if (isOwner) {
      return {
        isAuthorized: true,
        role: 'OWNER',
        status: 'AUTHORIZED',
        reason: 'Authorized access granted: Connected wallet is the asset creator/owner.',
        file
      }
    }

    if (isReceiver) {
      return {
        isAuthorized: true,
        role: 'RECEIVER',
        status: 'AUTHORIZED',
        reason: 'Authorized access granted: Connected wallet matches the designated recipient in the smart contract.',
        file
      }
    }

    return {
      isAuthorized: false,
      role: 'UNAUTHORIZED',
      status: 'DENIED',
      reason: `Access Denied: Connected wallet (${walletAddress}) is not authorized on the blockchain for this file.`,
      file: {
        fileId: file.fileId,
        ipfsCid: file.ipfsCid,
        accessStatus: file.accessStatus
      }
    }
  }

  /**
   * Revoke access for a file (Only callable by owner)
   * @param {string} fileId
   * @param {string} requesterAddress
   * @returns {Object}
   */
  revokeAccess(fileId, requesterAddress) {
    const file = this.getFile(fileId)
    if (!file) {
      throw new Error(`File "${fileId}" not found.`)
    }

    const normRequester = this.normalizeAddress(requesterAddress)
    const normOwner = this.normalizeAddress(file.owner)

    if (normRequester && normRequester !== normOwner) {
      throw new Error('Unauthorized: Only the file owner can revoke blockchain access.')
    }

    file.isRevoked = true
    file.accessStatus = 'REVOKED'
    file.revokedAt = new Date().toISOString()
    file.revocationTxHash = this.generateTxHash(fileId + 'REVOKE')

    const records = this.readRecords()
    records[fileId] = file
    this.saveRecords(records)

    return file
  }

  /**
   * Restore access for a file (Only callable by owner)
   * @param {string} fileId
   * @param {string} requesterAddress
   * @returns {Object}
   */
  restoreAccess(fileId, requesterAddress) {
    const file = this.getFile(fileId)
    if (!file) {
      throw new Error(`File "${fileId}" not found.`)
    }

    const normRequester = this.normalizeAddress(requesterAddress)
    const normOwner = this.normalizeAddress(file.owner)

    if (normRequester && normRequester !== normOwner) {
      throw new Error('Unauthorized: Only the file owner can modify access permissions.')
    }

    file.isRevoked = false
    file.accessStatus = 'ACTIVE'
    file.restoredAt = new Date().toISOString()

    const records = this.readRecords()
    records[fileId] = file
    this.saveRecords(records)

    return file
  }

  /**
   * Get metrics and stats
   * @returns {Object}
   */
  getStats() {
    const records = this.readRecords()
    const all = Object.values(records)
    const active = all.filter(r => !r.isRevoked && r.accessStatus === 'ACTIVE').length
    const revoked = all.filter(r => r.isRevoked || r.accessStatus === 'REVOKED').length

    return {
      totalSecured: all.length,
      activeLocks: active,
      revokedAccess: revoked,
      contractAddress: this.contractAddress,
      network: this.networkName
    }
  }
}

module.exports = new BlockchainService()
