const crypto = require('crypto')
const fs = require('fs')

/**
 * StegoShare SHA-256 File Integrity Verification Service
 * Handles cryptographic hashing, tamper detection, and verification
 * against immutable smart contract / blockchain baseline hashes.
 */
class IntegrityService {
  static STATUS_PASS = 'PASS — File Integrity Verified'
  static STATUS_FAIL = 'FAIL — File Integrity Verification Failed'

  /**
   * Calculate SHA-256 hash of a buffer or string
   * Uses Node.js's built-in crypto module.
   * @param {Buffer|string} data
   * @returns {string} 64-character hexadecimal SHA-256 hash
   */
  static calculateHash(data) {
    if (data === undefined || data === null) {
      throw new Error('Cannot calculate SHA-256 hash: Data is null or undefined.')
    }
    const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data, 'utf8')
    const hash = crypto.createHash('sha256')
    hash.update(buffer)
    return hash.digest('hex')
  }

  /**
   * Calculate SHA-256 hash of a file on disk
   * Handles stream-based reading to support files of any size without memory exhaustion.
   * Validates file existence and readability.
   * @param {string} filePath - Absolute or relative path to file
   * @returns {Promise<string>} Hexadecimal SHA-256 hash
   */
  static calculateFileHash(filePath) {
    return new Promise((resolve, reject) => {
      if (!filePath || typeof filePath !== 'string') {
        return reject(new Error(`Invalid file path provided: "${filePath}". Expected a valid non-empty path string.`))
      }

      if (!fs.existsSync(filePath)) {
        return reject(new Error(`File not found at path: "${filePath}".`))
      }

      try {
        const hash = crypto.createHash('sha256')
        const stream = fs.createReadStream(filePath)

        stream.on('data', (chunk) => hash.update(chunk))
        stream.on('end', () => resolve(hash.digest('hex')))
        stream.on('error', (err) => reject(new Error(`Error reading file at "${filePath}": ${err.message}`)))
      } catch (err) {
        reject(new Error(`Failed to initialize file stream for "${filePath}": ${err.message}`))
      }
    })
  }

  /**
   * Compare original file hash with recovered file hash
   * @param {string} originalHash - Expected hash from secure/immutable root (Blockchain / Smart Contract)
   * @param {string} recoveredHash - Newly computed hash of recovered plaintext file
   * @returns {{
   *   isValid: boolean,
   *   status: string,
   *   originalHash: string,
   *   recoveredHash: string,
   *   algorithm: string,
   *   timestamp: string,
   *   match: boolean,
   *   reason?: string
   * }}
   */
  static verifyIntegrity(originalHash, recoveredHash) {
    const timestamp = new Date().toISOString()

    if (!originalHash || typeof originalHash !== 'string' || originalHash.trim().length === 0) {
      return {
        isValid: false,
        match: false,
        status: this.STATUS_FAIL,
        originalHash: originalHash || '',
        recoveredHash: recoveredHash || '',
        algorithm: 'SHA-256',
        timestamp,
        reason: 'Original reference hash is missing or invalid.'
      }
    }

    if (!recoveredHash || typeof recoveredHash !== 'string' || recoveredHash.trim().length === 0) {
      return {
        isValid: false,
        match: false,
        status: this.STATUS_FAIL,
        originalHash: originalHash.trim().toLowerCase(),
        recoveredHash: recoveredHash || '',
        algorithm: 'SHA-256',
        timestamp,
        reason: 'Recovered file hash is missing or calculation failed.'
      }
    }

    const normOriginal = originalHash.trim().toLowerCase()
    const normRecovered = recoveredHash.trim().toLowerCase()
    const isValid = normOriginal === normRecovered

    return {
      isValid,
      match: isValid,
      status: isValid ? this.STATUS_PASS : this.STATUS_FAIL,
      originalHash: normOriginal,
      recoveredHash: normRecovered,
      algorithm: 'SHA-256',
      timestamp,
      reason: isValid
        ? 'Integrity verified: Recovered file byte stream is 100% identical to original pre-encryption source.'
        : 'Integrity violation: Hash mismatch detected. Recovered data differs from original source (potential tampering, alteration, or corruption).'
    }
  }

  /**
   * Compare an original file on disk with a recovered file on disk
   * @param {string} originalFilePath
   * @param {string} recoveredFilePath
   * @returns {Promise<{
   *   isValid: boolean,
   *   status: string,
   *   originalHash: string,
   *   recoveredHash: string,
   *   algorithm: string,
   *   timestamp: string,
   *   match: boolean
   * }>}
   */
  static async verifyFiles(originalFilePath, recoveredFilePath) {
    const originalHash = await this.calculateFileHash(originalFilePath)
    const recoveredHash = await this.calculateFileHash(recoveredFilePath)
    return this.verifyIntegrity(originalHash, recoveredHash)
  }

  /**
   * Verify buffer content against an expected baseline hash
   * @param {Buffer|string} buffer
   * @param {string} expectedHash
   * @returns {{
   *   isValid: boolean,
   *   status: string,
   *   originalHash: string,
   *   recoveredHash: string,
   *   algorithm: string,
   *   timestamp: string,
   *   match: boolean
   * }}
   */
  static verifyBufferAgainstHash(buffer, expectedHash) {
    const recoveredHash = this.calculateHash(buffer)
    return this.verifyIntegrity(expectedHash, recoveredHash)
  }
}

module.exports = IntegrityService
