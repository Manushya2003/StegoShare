const path = require('path')
const fs = require('fs')
const crypto = require('crypto')
const cryptoService = require('../services/cryptoService')
const integrityService = require('../services/integrityService')
const stegoService = require('../services/stegoService')
const ipfsService = require('../services/ipfsService')
const blockchainService = require('../services/blockchainService')

const uploadsDir = path.join(__dirname, '..', 'uploads')
const encryptedDir = path.join(__dirname, '..', 'encrypted')
const stegoDir = path.join(__dirname, '..', 'stego')
const recoveredDir = path.join(__dirname, '..', 'recovered')

// Ensure directories exist
;[uploadsDir, encryptedDir, stegoDir, recoveredDir].forEach(dir => {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true })
})

/**
 * Controller for StegoShare secure file processing and recovery
 */
class FileController {
  /**
   * Process Confidential File:
   * AES-256 Encrypt -> SHA-256 Hash -> LSB Stego Embed -> IPFS Upload -> Blockchain Register
   */
  async processFile(req, res) {
    const logs = []
    const logStep = (step, detail) => {
      const entry = { step, detail, timestamp: new Date().toISOString() }
      logs.push(entry)
      console.log(`[StegoShare] ${step}: ${detail}`)
    }

    const secretFile = req.files?.file?.[0]
    const carrierImage = req.files?.coverImage?.[0] || req.files?.carrierImage?.[0]
    const rawReceiver = req.body?.receiverAddress
    const receiverAddress = typeof rawReceiver === 'string' ? rawReceiver.trim() : (rawReceiver?.address || '').trim()
    const rawOwner = req.body?.ownerAddress
    const ownerAddress = typeof rawOwner === 'string' ? rawOwner.trim() : (rawOwner?.address || '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266').trim()

    try {
      // 1. Validation
      if (!secretFile) {
        return res.status(400).json({
          success: false,
          message: 'Confidential file is required. Please select a file to share.'
        })
      }

      if (!carrierImage) {
        return res.status(400).json({
          success: false,
          message: 'Carrier image is required. Please select a PNG or JPG carrier image.'
        })
      }

      if (!receiverAddress || receiverAddress.includes('...') || !blockchainService.isValidAddress(receiverAddress)) {
        return res.status(400).json({
          success: false,
          message: 'Invalid authorized receiver wallet address. Must be a valid 42-character Ethereum address.'
        })
      }


      logStep('File Selected', `Confidential File "${secretFile.originalname}" (${(secretFile.size / 1024).toFixed(2)} KB)`)
      logStep('Carrier Image Selected', `Image "${carrierImage.originalname}" (${(carrierImage.size / 1024).toFixed(2)} KB)`)

      // Generate unique file ID
      const fileId = `stego-${crypto.randomBytes(8).toString('hex')}`

      // 2. AES-256 Encryption
      logStep('AES Encryption Started', 'Generating 256-bit cryptographic key and random IV')
      const aesKey = cryptoService.generateKey()
      const iv = cryptoService.generateIv()

      const secretBuffer = await fs.promises.readFile(secretFile.path)
      const fileHash = cryptoService.calculateHash(secretBuffer)
      logStep('File Hash Generated', `SHA-256 Integrity Hash: ${fileHash}`)

      const ciphertext = cryptoService.encryptBuffer(secretBuffer, aesKey, iv)
      logStep('AES Encryption Completed', `Encrypted ${secretBuffer.length} bytes to ${ciphertext.length} ciphertext bytes`)

      // Save encrypted file for archival
      const encryptedFileName = `${fileId}.enc`
      const encryptedFilePath = path.join(encryptedDir, encryptedFileName)
      await fs.promises.writeFile(encryptedFilePath, ciphertext)

      // 3. Steganography Embedding
      logStep('Preparing Steganography Payload', 'Packaging metadata header, SHA-256 hash, IV, and ciphertext')
      const stegoFileName = `${fileId}-stego.png`
      const stegoFilePath = path.join(stegoDir, stegoFileName)

      const payloadMetadata = {
        fileName: secretFile.originalname,
        mimeType: secretFile.mimetype || 'application/octet-stream',
        originalSize: secretFile.size,
        fileHash,
        iv: iv.toString('hex')
      }

      logStep('Embedding into Carrier Image', 'Writing bits into RGB channels using Least Significant Bit (LSB) encoding')
      const stegoResult = await stegoService.embedPayload(
        carrierImage.path,
        payloadMetadata,
        ciphertext,
        stegoFilePath
      )
      logStep('Stego Image Generated', `Lossless PNG created (${stegoResult.payloadSize} bytes embedded, capacity ${stegoResult.capacityBytes} bytes)`)

      // 4. IPFS Upload
      logStep('Uploading to IPFS', 'Pinning stego asset to decentralized storage network')
      const ipfsResult = await ipfsService.uploadFile(stegoFilePath, stegoFileName)
      logStep('IPFS CID Generated', `Decentralized CID: ${ipfsResult.cid}`)

      // 5. Blockchain Registration
      logStep('Recording Access Permission on Blockchain', `Granting access to authorized receiver: ${receiverAddress}`)
      const blockchainRecord = await blockchainService.registerFile({
        fileId,
        owner: ownerAddress,
        authorizedReceiver: receiverAddress,
        ipfsCid: ipfsResult.cid,
        fileHash,
        originalFileName: secretFile.originalname,
        fileSize: secretFile.size,
        mimeType: secretFile.mimetype || 'application/octet-stream',
        keyHex: aesKey.toString('hex'),
        ivHex: iv.toString('hex'),
        stegoFileName
      })
      logStep('Blockchain Access Granted', `Tx Hash: ${blockchainRecord.txHash} on ${blockchainRecord.network}`)

      // 6. Generate Secure Share Link
      const baseUrl = `${req.protocol}://${req.get('host')}`
      // Frontend client link
      const clientBase = req.headers.origin || 'http://localhost:5173'
      const shareLink = `${clientBase}/access/${fileId}`
      logStep('Secure Link Generated', `Shareable access URL: ${shareLink}`)

      // Clean up temporary uploads
      try {
        if (fs.existsSync(secretFile.path)) fs.unlinkSync(secretFile.path)
        if (fs.existsSync(carrierImage.path)) fs.unlinkSync(carrierImage.path)
      } catch (cleanupErr) {
        console.warn('Cleanup warning:', cleanupErr.message)
      }

      return res.status(200).json({
        success: true,
        message: 'File encrypted, hidden inside carrier image, pinned to IPFS, and secured on blockchain successfully!',
        fileId,
        ipfsCid: ipfsResult.cid,
        txHash: blockchainRecord.txHash,
        blockNumber: blockchainRecord.blockNumber,
        fileHash,
        shareLink,
        originalFileName: secretFile.originalname,
        fileSize: secretFile.size,
        mimeType: secretFile.mimetype,
        stegoFileName,
        ownerAddress: blockchainRecord.rawOwner,
        authorizedReceiver: blockchainRecord.rawReceiver,
        contractAddress: blockchainRecord.contractAddress,
        executionLogs: logs
      })

    } catch (error) {
      console.error('Process File Error:', error)
      logStep('Error Encountered', error.message)
      return res.status(500).json({
        success: false,
        message: error.message || 'Failed to process secure file',
        executionLogs: logs
      })
    }
  }

  /**
   * Get public metadata for a shared file
   */
  getFileInfo(req, res) {
    const { fileId } = req.params
    const file = blockchainService.getFile(fileId)

    if (!file) {
      return res.status(404).json({
        success: false,
        message: `Secure file with ID "${fileId}" was not found.`
      })
    }

    return res.json({
      success: true,
      fileId: file.fileId,
      ipfsCid: file.ipfsCid,
      fileHash: file.fileHash,
      originalFileName: file.originalFileName,
      fileSize: file.fileSize,
      mimeType: file.mimeType,
      ownerAddress: file.rawOwner,
      authorizedReceiver: file.rawReceiver,
      txHash: file.txHash,
      blockNumber: file.blockNumber,
      timestamp: file.timestamp,
      createdAt: file.createdAt,
      accessStatus: file.accessStatus,
      isRevoked: file.isRevoked
    })
  }

  /**
   * Verify wallet authorization for a file
   */
  verifyAccess(req, res) {
    const { fileId } = req.params
    const rawWallet = req.body?.walletAddress
    const walletAddress = typeof rawWallet === 'string' ? rawWallet.trim() : (rawWallet?.address || '').trim()

    const verification = blockchainService.verifyAccess(fileId, walletAddress)
    return res.json({
      success: true,
      ...verification
    })
  }

  /**
   * Authorize and recover the original confidential file:
   * Verify wallet -> Retrieve Stego from IPFS -> Extract LSB payload -> Verify SHA-256 hash -> Decrypt AES-256
   */
  async extractAndRecover(req, res) {
    const { fileId } = req.params
    const rawWallet = req.body?.walletAddress
    const walletAddress = typeof rawWallet === 'string' ? rawWallet.trim() : (rawWallet?.address || '').trim()

    try {
      // 1. Verify blockchain authorization
      const auth = blockchainService.verifyAccess(fileId, walletAddress)
      if (!auth.isAuthorized) {
        return res.status(403).json({
          success: false,
          isAuthorized: false,
          role: auth.role,
          message: auth.reason || 'Access Denied: Wallet is not authorized to decrypt this confidential file.'
        })
      }

      const fileRecord = auth.file
      if (!fileRecord) {
        return res.status(404).json({
          success: false,
          message: 'File record not found'
        })
      }

      // 2. Retrieve stego image from IPFS or local store
      const stegoFilePath = path.join(stegoDir, fileRecord.stegoFileName)
      let activeStegoPath = stegoFilePath

      if (!fs.existsSync(activeStegoPath)) {
        // Fetch from IPFS service
        activeStegoPath = await ipfsService.retrieveFile(fileRecord.ipfsCid, path.join(stegoDir, `${fileRecord.fileId}-retrieved.png`))
      }

      // 3. Extract hidden payload from stego image
      const extracted = await stegoService.extractPayload(activeStegoPath)

      // 4. Decrypt AES-256 ciphertext payload
      const keyBuf = Buffer.from(fileRecord.keyHex, 'hex')
      const ivBuf = Buffer.from(extracted.iv, 'hex')
      let decryptedBuffer

      try {
        decryptedBuffer = cryptoService.decryptBuffer(extracted.ciphertext, keyBuf, ivBuf)
      } catch (decErr) {
        console.error('[StegoShare] Decryption failed:', decErr.message)
        return res.status(422).json({
          success: false,
          integrityVerified: false,
          integrityStatus: integrityService.STATUS_FAIL,
          message: `${integrityService.STATUS_FAIL}: Decryption failed (${decErr.message}). Ciphertext may be corrupted or tampered.`,
          originalHash: fileRecord.fileHash,
          recoveredHash: null,
          match: false
        })
      }

      // 5. Calculate SHA-256 hash of the recovered plaintext file
      const recoveredHash = integrityService.calculateHash(decryptedBuffer)

      // 6. Compare original file hash (from immutable blockchain record) with recovered file hash
      const verificationResult = integrityService.verifyIntegrity(fileRecord.fileHash, recoveredHash)

      // Cross-verify with stego extracted hash (embedded in LSB carrier header)
      const stegoHashMatches = extracted.fileHash
        ? extracted.fileHash.toLowerCase() === recoveredHash.toLowerCase()
        : true

      const isIntegrityValid = verificationResult.isValid && stegoHashMatches
      const integrityStatus = isIntegrityValid ? integrityService.STATUS_PASS : integrityService.STATUS_FAIL

      // 7. Save recovered plaintext file to disk
      const recoveredFileName = `${fileId}-${extracted.fileName || fileRecord.originalFileName}`
      const recoveredFilePath = path.join(recoveredDir, recoveredFileName)
      await fs.promises.writeFile(recoveredFilePath, decryptedBuffer)

      // Double-verify saved file on disk matches memory hash
      try {
        const diskFileHash = await integrityService.calculateFileHash(recoveredFilePath)
        if (diskFileHash !== recoveredHash) {
          console.warn('[StegoShare] Warning: Disk file hash differs from memory buffer hash!')
        }
      } catch (diskErr) {
        console.warn('[StegoShare] Warning checking disk file hash:', diskErr.message)
      }

      // 8. Terminal output of verification result
      console.log('====================================================')
      console.log(`🔐 StegoShare File Integrity Verification`)
      console.log(`📋 File ID:         ${fileId}`)
      console.log(`📄 File Name:       ${extracted.fileName || fileRecord.originalFileName}`)
      console.log(`📦 Recovered Size:  ${decryptedBuffer.length} bytes`)
      console.log(`🔑 Original Hash:   ${fileRecord.fileHash}`)
      console.log(`🔍 Recovered Hash:  ${recoveredHash}`)
      console.log(`📊 Result Status:   ${integrityStatus}`)
      console.log('====================================================')

      const downloadUrl = `http://localhost:5000/api/files/${fileId}/download-recovered?wallet=${encodeURIComponent(walletAddress)}`

      if (!isIntegrityValid) {
        return res.status(422).json({
          success: false,
          integrityVerified: false,
          integrityStatus: integrityService.STATUS_FAIL,
          message: `${integrityService.STATUS_FAIL}: Recovered file hash does not match original baseline recorded on blockchain.`,
          fileId,
          originalHash: fileRecord.fileHash,
          recoveredHash,
          stegoExtractedHash: extracted.fileHash,
          match: false
        })
      }

      return res.json({
        success: true,
        integrityVerified: true,
        integrityStatus: integrityService.STATUS_PASS,
        message: `${integrityService.STATUS_PASS}: File recovered and SHA-256 hash verified successfully.`,
        fileId,
        fileName: extracted.fileName || fileRecord.originalFileName,
        fileSize: decryptedBuffer.length,
        mimeType: extracted.mimeType || fileRecord.mimeType,
        originalHash: fileRecord.fileHash,
        recoveredHash,
        fileHash: recoveredHash,
        stegoExtractedHash: extracted.fileHash,
        match: true,
        downloadUrl,
        recoveredFileName
      })

    } catch (error) {
      console.error('Recovery Error:', error)
      return res.status(500).json({
        success: false,
        integrityVerified: false,
        integrityStatus: integrityService.STATUS_FAIL,
        message: error.message || 'Decryption and recovery failed',
        originalHash: null,
        recoveredHash: null,
        match: false
      })
    }
  }

  /**
   * Standalone endpoint to verify integrity of a recovered file on disk against blockchain
   */
  async verifyFileIntegrity(req, res) {
    const { fileId } = req.params
    const fileRecord = blockchainService.getFile(fileId)

    if (!fileRecord) {
      return res.status(404).json({
        success: false,
        message: `File record "${fileId}" not found on blockchain registry.`
      })
    }

    const recoveredFileName = `${fileId}-${fileRecord.originalFileName}`
    const recoveredFilePath = path.join(recoveredDir, recoveredFileName)

    if (!fs.existsSync(recoveredFilePath)) {
      return res.status(404).json({
        success: false,
        integrityVerified: false,
        integrityStatus: integrityService.STATUS_FAIL,
        message: 'Recovered file does not exist on disk. Please perform file recovery first.',
        originalHash: fileRecord.fileHash,
        recoveredHash: null
      })
    }

    try {
      const recoveredHash = await integrityService.calculateFileHash(recoveredFilePath)
      const verification = integrityService.verifyIntegrity(fileRecord.fileHash, recoveredHash)

      console.log(`[StegoShare Standalone Verify] File ID: ${fileId} -> ${verification.status}`)

      return res.json({
        success: verification.isValid,
        integrityVerified: verification.isValid,
        integrityStatus: verification.status,
        originalHash: fileRecord.fileHash,
        recoveredHash,
        match: verification.isValid,
        algorithm: 'SHA-256',
        timestamp: verification.timestamp
      })
    } catch (err) {
      return res.status(500).json({
        success: false,
        integrityVerified: false,
        integrityStatus: integrityService.STATUS_FAIL,
        message: `Failed to calculate integrity on disk file: ${err.message}`
      })
    }
  }

  /**
   * Download the decrypted, recovered file
   */
  downloadRecoveredFile(req, res) {
    const { fileId } = req.params
    const rawWallet = req.query.wallet || req.body?.walletAddress
    const walletAddress = typeof rawWallet === 'string' ? rawWallet.trim() : (rawWallet?.address || '').trim()

    const auth = blockchainService.verifyAccess(fileId, walletAddress)
    if (!auth.isAuthorized) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized: You must connect an authorized wallet to download this file.'
      })
    }

    const fileRecord = auth.file
    const recoveredFileName = `${fileId}-${fileRecord.originalFileName}`
    const recoveredFilePath = path.join(recoveredDir, recoveredFileName)

    if (!fs.existsSync(recoveredFilePath)) {
      return res.status(404).json({
        success: false,
        message: 'Recovered file not ready. Please run the recovery process first.'
      })
    }

    res.setHeader('Content-Disposition', `attachment; filename="${fileRecord.originalFileName}"`)
    res.setHeader('Content-Type', fileRecord.mimeType || 'application/octet-stream')
    return res.sendFile(recoveredFilePath)
  }

  /**
   * Direct download of the generated stego PNG image
   */
  downloadStegoImage(req, res) {
    const { fileName, fileId } = req.params

    let targetFile = null
    if (fileName) {
      const directPath = path.join(stegoDir, fileName)
      if (fs.existsSync(directPath)) targetFile = directPath
    } else if (fileId) {
      const file = blockchainService.getFile(fileId)
      if (file && file.stegoFileName) {
        const directPath = path.join(stegoDir, file.stegoFileName)
        if (fs.existsSync(directPath)) targetFile = directPath
      }
    }

    if (!targetFile || !fs.existsSync(targetFile)) {
      return res.status(404).json({
        success: false,
        message: 'Stego image not found'
      })
    }

    res.setHeader('Content-Type', 'image/png')
    res.setHeader('Content-Disposition', `attachment; filename="${path.basename(targetFile)}"`)
    return res.sendFile(targetFile)
  }

  /**
   * Revoke access (Owner only)
   */
  revokeAccess(req, res) {
    const { fileId } = req.params
    const { ownerAddress } = req.body

    try {
      const record = blockchainService.revokeAccess(fileId, ownerAddress)
      return res.json({
        success: true,
        message: 'Access successfully revoked on the blockchain ledger.',
        record
      })
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: err.message
      })
    }
  }

  /**
   * Restore access (Owner only)
   */
  restoreAccess(req, res) {
    const { fileId } = req.params
    const { ownerAddress } = req.body

    try {
      const record = blockchainService.restoreAccess(fileId, ownerAddress)
      return res.json({
        success: true,
        message: 'Access successfully restored on the blockchain ledger.',
        record
      })
    } catch (err) {
      return res.status(400).json({
        success: false,
        message: err.message
      })
    }
  }

  /**
   * Get all files (Audit list)
   */
  getAllFiles(req, res) {
    const records = blockchainService.readRecords()
    const list = Object.values(records).map(r => ({
      fileId: r.fileId,
      originalFileName: r.originalFileName,
      fileSize: r.fileSize,
      ipfsCid: r.ipfsCid,
      fileHash: r.fileHash,
      owner: r.rawOwner,
      authorizedReceiver: r.rawReceiver,
      accessStatus: r.accessStatus,
      createdAt: r.createdAt
    }))
    return res.json({ success: true, files: list })
  }

  /**
   * Get security dashboard metrics
   */
  getStats(req, res) {
    const stats = blockchainService.getStats()
    return res.json({
      success: true,
      stats
    })
  }
}

module.exports = new FileController()
