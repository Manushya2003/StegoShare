const sharp = require('sharp')
const fs = require('fs')

/**
 * StegoShare Steganography Service
 * LSB (Least Significant Bit) embedding and extraction in 24-bit RGB space.
 * Preserves Alpha channel and ensures lossless PNG encoding.
 */
class StegoService {
  static MAGIC = Buffer.from('STEG') // 4 bytes

  /**
   * Calculate steganographic payload capacity of a carrier image
   * @param {string} imagePath
   * @returns {Promise<{ width: number, height: number, capacityBytes: number }>}
   */
  static async calculateCapacity(imagePath) {
    const metadata = await sharp(imagePath).metadata()
    const width = metadata.width || 0
    const height = metadata.height || 0
    // 3 bits per pixel (1 bit per R, G, B channel)
    const capacityBytes = Math.floor((width * height * 3) / 8)
    return {
      width,
      height,
      capacityBytes
    }
  }

  /**
   * Package metadata + ciphertext into a structured binary buffer
   * @param {Object} meta
   * @param {string} meta.fileName
   * @param {string} meta.mimeType
   * @param {number} meta.originalSize
   * @param {string} meta.fileHash - 64 char hex string
   * @param {Buffer} meta.iv - 16 bytes Buffer
   * @param {Buffer} ciphertext - Encrypted file bytes
   * @returns {Buffer}
   */
  static packagePayload(meta, ciphertext) {
    const fileNameBuf = Buffer.from(meta.fileName || 'confidential.dat', 'utf8')
    const mimeBuf = Buffer.from(meta.mimeType || 'application/octet-stream', 'utf8')
    const hashBuf = Buffer.from(meta.fileHash, 'hex') // 32 bytes
    const ivBuf = Buffer.isBuffer(meta.iv) ? meta.iv : Buffer.from(meta.iv, 'hex') // 16 bytes

    // Calculate sub-header lengths
    // Header format:
    // [0..3] MAGIC (4 bytes)
    // [4..7] Payload Length (4 bytes uint32)
    // [8..9] FileName Len (2 bytes uint16)
    // [..]   FileName (N bytes)
    // [..]   MimeType Len (2 bytes uint16)
    // [..]   MimeType (M bytes)
    // [..]   Original File Size (4 bytes uint32)
    // [..]   SHA-256 Hash (32 bytes)
    // [..]   IV (16 bytes)
    // [..]   Ciphertext Len (4 bytes uint32)
    // [..]   Ciphertext (C bytes)

    const payloadContentLength =
      2 + fileNameBuf.length +
      2 + mimeBuf.length +
      4 +
      32 +
      16 +
      4 + ciphertext.length

    const totalPayloadLength = 4 + 4 + payloadContentLength
    const buffer = Buffer.alloc(totalPayloadLength)

    let offset = 0
    // 1. Magic
    this.MAGIC.copy(buffer, offset)
    offset += 4

    // 2. Payload content length
    buffer.writeUInt32BE(payloadContentLength, offset)
    offset += 4

    // 3. File name
    buffer.writeUInt16BE(fileNameBuf.length, offset)
    offset += 2
    fileNameBuf.copy(buffer, offset)
    offset += fileNameBuf.length

    // 4. Mime type
    buffer.writeUInt16BE(mimeBuf.length, offset)
    offset += 2
    mimeBuf.copy(buffer, offset)
    offset += mimeBuf.length

    // 5. Original size
    buffer.writeUInt32BE(meta.originalSize || 0, offset)
    offset += 4

    // 6. SHA-256 hash (32 bytes)
    hashBuf.copy(buffer, offset)
    offset += 32

    // 7. IV (16 bytes)
    ivBuf.copy(buffer, offset)
    offset += 16

    // 8. Ciphertext length & ciphertext
    buffer.writeUInt32BE(ciphertext.length, offset)
    offset += 4
    ciphertext.copy(buffer, offset)
    offset += ciphertext.length

    return buffer
  }

  /**
   * Embed binary payload into carrier image using LSB encoding
   * @param {string} carrierImagePath
   * @param {Object} metadata
   * @param {Buffer} ciphertext
   * @param {string} outputPath
   * @returns {Promise<{ stegoPath: string, payloadSize: number, capacityBytes: number }>}
   */
  static async embedPayload(carrierImagePath, metadata, ciphertext, outputPath) {
    const payload = this.packagePayload(metadata, ciphertext)

    // Convert carrier image to raw RGBA buffer
    const rawImage = await sharp(carrierImagePath)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true })

    const width = rawImage.info.width
    const height = rawImage.info.height
    const imageData = Buffer.from(rawImage.data)

    const capacityBytes = Math.floor((width * height * 3) / 8)

    if (payload.length > capacityBytes) {
      throw new Error(
        `Carrier image capacity exceeded. Payload requires ${payload.length.toLocaleString()} bytes, ` +
        `but carrier image provides ${capacityBytes.toLocaleString()} bytes. Please choose a higher resolution image.`
      )
    }

    let bitIndex = 0

    // Hide payload bits in R, G, B channel LSBs
    for (let byteIdx = 0; byteIdx < payload.length; byteIdx++) {
      const currentByte = payload[byteIdx]
      for (let bit = 7; bit >= 0; bit--) {
        const secretBit = (currentByte >> bit) & 1

        const pixelIndex = Math.floor(bitIndex / 3)
        const channelIndex = bitIndex % 3 // 0=R, 1=G, 2=B

        const rawIndex = pixelIndex * 4 + channelIndex

        // Replace the LSB
        imageData[rawIndex] = (imageData[rawIndex] & 0xFE) | secretBit
        bitIndex++
      }
    }

    // Save as lossless PNG to protect stego bits
    await sharp(imageData, {
      raw: {
        width,
        height,
        channels: 4
      }
    })
      .png({ compressionLevel: 6 })
      .toFile(outputPath)

    return {
      stegoPath: outputPath,
      payloadSize: payload.length,
      capacityBytes
    }
  }

  /**
   * Extract payload and metadata from a stego image
   * @param {string} stegoImagePath
   * @returns {Promise<{ fileName: string, mimeType: string, originalSize: number, fileHash: string, iv: string, ciphertext: Buffer }>}
   */
  static async extractPayload(stegoImagePath) {
    const rawImage = await sharp(stegoImagePath)
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true })

    const imageData = rawImage.data
    const totalPixels = rawImage.info.width * rawImage.info.height
    const totalCapacity = Math.floor((totalPixels * 3) / 8)

    if (totalCapacity < 8) {
      throw new Error('Image too small to contain StegoShare payload')
    }

    // Helper to read N bytes from bit stream
    let bitOffset = 0
    const readBytes = (numBytes) => {
      const buf = Buffer.alloc(numBytes)
      for (let i = 0; i < numBytes; i++) {
        let byteVal = 0
        for (let bit = 7; bit >= 0; bit--) {
          const pixelIndex = Math.floor(bitOffset / 3)
          const channelIndex = bitOffset % 3
          const rawIndex = pixelIndex * 4 + channelIndex

          const bitVal = imageData[rawIndex] & 1
          byteVal = (byteVal << 1) | bitVal
          bitOffset++
        }
        buf[i] = byteVal
      }
      return buf
    }

    // 1. Read MAGIC (4 bytes)
    const magic = readBytes(4)
    if (!magic.equals(this.MAGIC)) {
      throw new Error('Invalid stego image or no StegoShare payload detected.')
    }

    // 2. Read Payload Length (4 bytes)
    const payloadLenBuf = readBytes(4)
    const payloadLength = payloadLenBuf.readUInt32BE(0)

    if (payloadLength <= 0 || payloadLength > totalCapacity) {
      throw new Error('Corrupted or invalid stego payload length header.')
    }

    // 3. Read FileName Len & FileName
    const fileNameLen = readBytes(2).readUInt16BE(0)
    const fileName = readBytes(fileNameLen).toString('utf8')

    // 4. Read MimeType Len & MimeType
    const mimeLen = readBytes(2).readUInt16BE(0)
    const mimeType = readBytes(mimeLen).toString('utf8')

    // 5. Read Original Size
    const originalSize = readBytes(4).readUInt32BE(0)

    // 6. Read SHA-256 Hash (32 bytes)
    const fileHash = readBytes(32).toString('hex')

    // 7. Read IV (16 bytes)
    const iv = readBytes(16).toString('hex')

    // 8. Read Ciphertext Length & Ciphertext
    const cipherLen = readBytes(4).readUInt32BE(0)
    const ciphertext = readBytes(cipherLen)

    return {
      fileName,
      mimeType,
      originalSize,
      fileHash,
      iv,
      ciphertext
    }
  }
}

module.exports = StegoService
