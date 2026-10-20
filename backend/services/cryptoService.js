const crypto = require('crypto')
const fs = require('fs')

/**
 * StegoShare Cryptographic Service
 * AES-256-CBC file encryption/decryption and SHA-256 integrity verification.
 */
class CryptoService {
  /**
   * Generate secure random 256-bit (32 bytes) AES key
   * @returns {Buffer}
   */
  static generateKey() {
    return crypto.randomBytes(32)
  }

  /**
   * Generate secure random 128-bit (16 bytes) IV
   * @returns {Buffer}
   */
  static generateIv() {
    return crypto.randomBytes(16)
  }

  /**
   * Calculate SHA-256 hash of a buffer or string for integrity verification
   * @param {Buffer|string} data
   * @returns {string} Hexadecimal SHA-256 hash
   */
  static calculateHash(data) {
    const hash = crypto.createHash('sha256')
    hash.update(data)
    return hash.digest('hex')
  }

  /**
   * Calculate SHA-256 hash of a file on disk
   * @param {string} filePath
   * @returns {Promise<string>}
   */
  static calculateFileHash(filePath) {
    return new Promise((resolve, reject) => {
      const hash = crypto.createHash('sha256')
      const stream = fs.createReadStream(filePath)
      stream.on('data', (chunk) => hash.update(chunk))
      stream.on('end', () => resolve(hash.digest('hex')))
      stream.on('error', (err) => reject(err))
    })
  }

  /**
   * Encrypt a buffer with AES-256-CBC
   * @param {Buffer} buffer - Plaintext data
   * @param {Buffer} key - 32-byte key
   * @param {Buffer} iv - 16-byte initialization vector
   * @returns {Buffer} Encrypted ciphertext
   */
  static encryptBuffer(buffer, key, iv) {
    const cipher = crypto.createCipheriv('aes-256-cbc', key, iv)
    return Buffer.concat([cipher.update(buffer), cipher.final()])
  }

  /**
   * Decrypt a ciphertext buffer with AES-256-CBC
   * @param {Buffer} encryptedBuffer - Ciphertext data
   * @param {Buffer} key - 32-byte key
   * @param {Buffer} iv - 16-byte initialization vector
   * @returns {Buffer} Decrypted plaintext
   */
  static decryptBuffer(encryptedBuffer, key, iv) {
    const decipher = crypto.createDecipheriv('aes-256-cbc', key, iv)
    return Buffer.concat([decipher.update(encryptedBuffer), decipher.final()])
  }

  /**
   * Encrypt a file from disk
   * @param {string} inputPath
   * @param {string} outputPath
   * @param {Buffer} key
   * @param {Buffer} iv
   * @returns {Promise<{ fileHash: string, cipherSize: number }>}
   */
  static async encryptFile(inputPath, outputPath, key, iv) {
    const plaintext = await fs.promises.readFile(inputPath)
    const fileHash = this.calculateHash(plaintext)
    const ciphertext = this.encryptBuffer(plaintext, key, iv)
    await fs.promises.writeFile(outputPath, ciphertext)
    return {
      fileHash,
      cipherSize: ciphertext.length,
      plainSize: plaintext.length
    }
  }

  /**
   * Decrypt a file from disk and verify its integrity
   * @param {string} inputPath
   * @param {string} outputPath
   * @param {Buffer} key
   * @param {Buffer} iv
   * @param {string} expectedHash
   * @returns {Promise<{ isIntegrityValid: boolean, status: string, originalHash: string, recoveredHash: string, size: number }>}
   */
  static async decryptFile(inputPath, outputPath, key, iv, expectedHash) {
    const ciphertext = await fs.promises.readFile(inputPath)
    const plaintext = this.decryptBuffer(ciphertext, key, iv)
    const recoveredHash = this.calculateHash(plaintext)
    const isIntegrityValid = expectedHash
      ? (recoveredHash.toLowerCase() === expectedHash.toLowerCase())
      : false
    const status = isIntegrityValid
      ? 'PASS — File Integrity Verified'
      : 'FAIL — File Integrity Verification Failed'

    await fs.promises.writeFile(outputPath, plaintext)
    return {
      isIntegrityValid,
      status,
      originalHash: expectedHash || '',
      recoveredHash,
      size: plaintext.length
    }
  }

  /**
   * Verify file integrity by comparing original and recovered hashes
   * @param {string} originalHash
   * @param {string} recoveredHash
   * @returns {{ isValid: boolean, status: string, originalHash: string, recoveredHash: string }}
   */
  static verifyIntegrity(originalHash, recoveredHash) {
    const IntegrityService = require('./integrityService')
    return IntegrityService.verifyIntegrity(originalHash, recoveredHash)
  }
}

module.exports = CryptoService
