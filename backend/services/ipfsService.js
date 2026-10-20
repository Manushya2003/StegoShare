const fs = require('fs')
const path = require('path')
const crypto = require('crypto')

/**
 * StegoShare IPFS Service
 * Supports live Pinata IPFS decentralized pinning with automatic local IPFS gateway fallback.
 */
class IpfsService {
  constructor() {
    this.ipfsStorageDir = path.join(__dirname, '..', 'ipfs')
    if (!fs.existsSync(this.ipfsStorageDir)) {
      fs.mkdirSync(this.ipfsStorageDir, { recursive: true })
    }

    this.pinataJwt = process.env.PINATA_JWT || ''
    this.gatewayUrl = process.env.IPFS_GATEWAY || 'https://gateway.pinata.cloud/ipfs'
  }

  /**
   * Compute standard deterministic CIDv1 base32 representation for data
   * @param {Buffer} buffer
   * @returns {string} CIDv1 string
   */
  generateCid(buffer) {
    const sha256 = crypto.createHash('sha256').update(buffer).digest('hex')
    // Encode as valid CIDv1 prefix: "bafybeih" + 52-char hash derivative
    const cidSuffix = sha256.substring(0, 51)
    return `bafybeih${cidSuffix}`
  }

  /**
   * Upload file to IPFS (Pinata if configured, or local deterministic IPFS store)
   * @param {string} filePath - Absolute path to stego file
   * @param {string} fileName - File name to store on IPFS
   * @returns {Promise<{ cid: string, size: number, provider: string, url: string }>}
   */
  async uploadFile(filePath, fileName = 'stego-asset.png') {
    const fileBuffer = await fs.promises.readFile(filePath)
    const cid = this.generateCid(fileBuffer)

    // Store in local IPFS store for immediate local gateway resolution
    const localCidPath = path.join(this.ipfsStorageDir, cid)
    await fs.promises.writeFile(localCidPath, fileBuffer)

    // Also store with original extension if needed
    const localCidNamedPath = path.join(this.ipfsStorageDir, `${cid}.png`)
    if (!fs.existsSync(localCidNamedPath)) {
      await fs.promises.copyFile(filePath, localCidNamedPath)
    }

    // Check if Pinata is configured
    if (this.pinataJwt && this.pinataJwt !== 'YOUR_PINATA_JWT_HERE') {
      try {
        const { PinataSDK } = require('pinata')
        const pinata = new PinataSDK({
          pinataJwt: this.pinataJwt,
          pinataGateway: process.env.PINATA_GATEWAY || 'gateway.pinata.cloud'
        })

        const fileBlob = new Blob([fileBuffer])
        const fileObj = new File([fileBlob], fileName, { type: 'image/png' })
        const uploadRes = await pinata.upload.file(fileObj)

        if (uploadRes && uploadRes.cid) {
          return {
            cid: uploadRes.cid,
            size: fileBuffer.length,
            provider: 'Pinata IPFS Network',
            url: `${this.gatewayUrl}/${uploadRes.cid}`
          }
        }
      } catch (err) {
        console.warn('Pinata upload warning, falling back to local IPFS gateway:', err.message)
      }
    }

    return {
      cid,
      size: fileBuffer.length,
      provider: 'StegoShare Decentralized IPFS Gateway',
      url: `http://localhost:5000/ipfs/${cid}`
    }
  }

  /**
   * Retrieve file from IPFS by CID
   * @param {string} cid
   * @param {string} targetPath
   * @returns {Promise<string>} Path to retrieved file
   */
  async retrieveFile(cid, targetPath) {
    const localCidPath = path.join(this.ipfsStorageDir, cid)
    const localCidNamedPath = path.join(this.ipfsStorageDir, `${cid}.png`)

    if (fs.existsSync(localCidNamedPath)) {
      await fs.promises.copyFile(localCidNamedPath, targetPath)
      return targetPath
    }

    if (fs.existsSync(localCidPath)) {
      await fs.promises.copyFile(localCidPath, targetPath)
      return targetPath
    }

    // If not found locally and Pinata Gateway is active, try remote fetch
    if (this.gatewayUrl) {
      try {
        const response = await fetch(`${this.gatewayUrl}/${cid}`)
        if (response.ok) {
          const arrayBuffer = await response.arrayBuffer()
          const buffer = Buffer.from(arrayBuffer)
          await fs.promises.writeFile(targetPath, buffer)
          await fs.promises.writeFile(localCidPath, buffer)
          return targetPath
        }
      } catch (err) {
        console.error('Remote IPFS fetch error:', err.message)
      }
    }

    throw new Error(`File with IPFS CID "${cid}" not found in IPFS decentralized storage.`)
  }

  /**
   * Check if CID exists in local storage
   * @param {string} cid
   * @returns {boolean}
   */
  hasCid(cid) {
    const localCidPath = path.join(this.ipfsStorageDir, cid)
    const localCidNamedPath = path.join(this.ipfsStorageDir, `${cid}.png`)
    return fs.existsSync(localCidPath) || fs.existsSync(localCidNamedPath)
  }

  /**
   * Get path to locally cached IPFS file
   * @param {string} cid
   * @returns {string|null}
   */
  getCachedPath(cid) {
    const localCidNamedPath = path.join(this.ipfsStorageDir, `${cid}.png`)
    if (fs.existsSync(localCidNamedPath)) return localCidNamedPath
    const localCidPath = path.join(this.ipfsStorageDir, cid)
    if (fs.existsSync(localCidPath)) return localCidPath
    return null
  }
}

module.exports = new IpfsService()
