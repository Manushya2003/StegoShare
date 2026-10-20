const fs = require('fs')
const path = require('path')
const sharp = require('sharp')
const cryptoService = require('./services/cryptoService')
const integrityService = require('./services/integrityService')
const stegoService = require('./services/stegoService')
const ipfsService = require('./services/ipfsService')
const blockchainService = require('./services/blockchainService')

async function runTests() {
  console.log('====================================================')
  console.log('🧪 Running StegoShare End-to-End Cryptographic Tests')
  console.log('====================================================')

  const testDir = path.join(__dirname, 'test_scratch')
  if (!fs.existsSync(testDir)) fs.mkdirSync(testDir, { recursive: true })

  // 1. Create secret confidential file
  const originalSecretText = 'CONFIDENTIAL_DATA_STEGOSHARE_TOP_SECRET_PROJECT_2026_BLOCKCHAIN_ACCESS_CONTROL'
  const secretBuffer = Buffer.from(originalSecretText, 'utf8')
  const secretFilePath = path.join(testDir, 'confidential.txt')
  fs.writeFileSync(secretFilePath, secretBuffer)
  console.log('✅ Step 1: Created test confidential file (', secretBuffer.length, 'bytes )')

  // 2. Create sample carrier image (300x300 PNG, capacity = 33.75 KB)
  const carrierImagePath = path.join(testDir, 'carrier.png')
  await sharp({
    create: {
      width: 300,
      height: 300,
      channels: 4,
      background: { r: 30, g: 45, b: 70, alpha: 1 }
    }
  }).png().toFile(carrierImagePath)
  console.log('✅ Step 2: Created test carrier image (300x300 PNG)')

  // 3. Test AES-256 Encryption & SHA-256 Hashing
  const key = cryptoService.generateKey()
  const iv = cryptoService.generateIv()
  const originalHash = cryptoService.calculateHash(secretBuffer)
  const ciphertext = cryptoService.encryptBuffer(secretBuffer, key, iv)
  console.log('✅ Step 3: AES-256 encrypted successfully. SHA-256:', originalHash)

  // 4. Test LSB Embedding into Carrier Image
  const stegoImagePath = path.join(testDir, 'stego_output.png')
  const meta = {
    fileName: 'confidential.txt',
    mimeType: 'text/plain',
    originalSize: secretBuffer.length,
    fileHash: originalHash,
    iv: iv.toString('hex')
  }

  const embedRes = await stegoService.embedPayload(carrierImagePath, meta, ciphertext, stegoImagePath)
  console.log('✅ Step 4: Stego payload embedded successfully. Embedded bytes:', embedRes.payloadSize)

  // 5. Test IPFS Pinning (Local gateway fallback)
  const ipfsRes = await ipfsService.uploadFile(stegoImagePath, 'test-stego.png')
  console.log('✅ Step 5: Pinned to IPFS. Generated CID:', ipfsRes.cid)

  // 6. Test Blockchain Access Control Registration & Verification
  const ownerAddress = '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266'
  const receiverAddress = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8'
  const attackerAddress = '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC'
  const fileId = 'stego-test-001'

  await blockchainService.registerFile({
    fileId,
    owner: ownerAddress,
    authorizedReceiver: receiverAddress,
    ipfsCid: ipfsRes.cid,
    fileHash: originalHash,
    originalFileName: 'confidential.txt',
    fileSize: secretBuffer.length,
    mimeType: 'text/plain',
    keyHex: key.toString('hex'),
    ivHex: iv.toString('hex'),
    stegoFileName: 'stego_output.png'
  })

  // Test Receiver Authorization
  const receiverAuth = blockchainService.verifyAccess(fileId, receiverAddress)
  if (!receiverAuth.isAuthorized || receiverAuth.role !== 'RECEIVER') {
    throw new Error('FAIL: Receiver was not authorized!')
  }
  console.log('✅ Step 6A: Authorized receiver verification passed (Role: RECEIVER)')

  // Test Owner Authorization
  const ownerAuth = blockchainService.verifyAccess(fileId, ownerAddress)
  if (!ownerAuth.isAuthorized || ownerAuth.role !== 'OWNER') {
    throw new Error('FAIL: Owner was not authorized!')
  }
  console.log('✅ Step 6B: Owner verification passed (Role: OWNER)')

  // Test Attacker Denial
  const attackerAuth = blockchainService.verifyAccess(fileId, attackerAddress)
  if (attackerAuth.isAuthorized || attackerAuth.status !== 'DENIED') {
    throw new Error('FAIL: Attacker was not denied!')
  }
  console.log('✅ Step 6C: Attacker access correctly DENIED on blockchain!')

  // 7. Test Extraction, Decryption & SHA-256 File Integrity Verification
  const extracted = await stegoService.extractPayload(stegoImagePath)
  const extractedIv = Buffer.from(extracted.iv, 'hex')
  const decrypted = cryptoService.decryptBuffer(extracted.ciphertext, key, extractedIv)
  
  // Calculate SHA-256 hash of the recovered plaintext file
  const decryptedHash = integrityService.calculateHash(decrypted)
  const verification = integrityService.verifyIntegrity(originalHash, decryptedHash)

  console.log('----------------------------------------------------')
  console.log(`🔐 SHA-256 File Integrity Verification:`)
  console.log(`   Original Hash (Pre-Encryption): ${originalHash}`)
  console.log(`   Recovered Hash (Post-Decryption): ${decryptedHash}`)
  console.log(`   Verification Status:             ${verification.status}`)
  console.log('----------------------------------------------------')

  if (!verification.isValid) {
    throw new Error(`FAIL: Decrypted SHA-256 hash does not match original! Status: ${verification.status}`)
  }

  if (decrypted.toString('utf8') !== originalSecretText) {
    throw new Error('FAIL: Decrypted text does not match original secret text!')
  }

  console.log('✅ Step 7: Stego extraction, AES-256 decryption, and SHA-256 Integrity Verification SUCCEEDED!')
  console.log('🎉 Decrypted contents:', decrypted.toString('utf8'))

  // 8. Test Revocation
  blockchainService.revokeAccess(fileId, ownerAddress)
  const revokedReceiverAuth = blockchainService.verifyAccess(fileId, receiverAddress)
  if (revokedReceiverAuth.isAuthorized) {
    throw new Error('FAIL: Receiver still authorized after revocation!')
  }
  console.log('✅ Step 8: Owner revocation successfully blocked receiver access!')

  console.log('====================================================')
  console.log('🌟 ALL 8 CRYPTOGRAPHIC PIPELINE TESTS PASSED 100%')
  console.log('====================================================')
}

runTests().catch(err => {
  console.error('❌ Test failed:', err)
  process.exit(1)
})
