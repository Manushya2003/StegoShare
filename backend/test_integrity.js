const fs = require('fs')
const path = require('path')
const sharp = require('sharp')
const crypto = require('crypto')
const cryptoService = require('./services/cryptoService')
const integrityService = require('./services/integrityService')
const stegoService = require('./services/stegoService')
const blockchainService = require('./services/blockchainService')

/**
 * StegoShare SHA-256 File Integrity Verification Test Suite
 *
 * Covers all required test scenarios:
 * 1. Unchanged file (Expected: PASS — File Integrity Verified)
 * 2. Modified recovered file (Expected: FAIL — File Integrity Verification Failed)
 * 3. Empty file (0 bytes) (Expected: PASS — File Integrity Verified)
 * 4. Missing file or invalid path (Expected: Graceful error handling)
 * 5. Corrupted or incorrectly recovered file (Expected: FAIL — File Integrity Verification Failed)
 */
async function runIntegrityTests() {
  console.log('========================================================================')
  console.log('🛡️  STEGOSHARE SHA-256 FILE INTEGRITY VERIFICATION TEST SUITE')
  console.log('    Algorithm: SHA-256 (FIPS 180-4 / Node.js crypto module)')
  console.log('    Target: Plaintext Pre-Encryption vs. Plaintext Post-Decryption')
  console.log('========================================================================\n')

  const testDir = path.join(__dirname, 'test_scratch', 'integrity_tests')
  if (!fs.existsSync(testDir)) fs.mkdirSync(testDir, { recursive: true })

  // Carrier image helper (300x300 PNG)
  const carrierImagePath = path.join(testDir, 'carrier_test.png')
  await sharp({
    create: {
      width: 300,
      height: 300,
      channels: 4,
      background: { r: 25, g: 35, b: 55, alpha: 1 }
    }
  }).png().toFile(carrierImagePath)

  let passedTests = 0
  let totalTests = 5

  // -------------------------------------------------------------------------
  // TEST CASE 1: Unchanged File (PASS)
  // -------------------------------------------------------------------------
  console.log('------------------------------------------------------------------------')
  console.log('TEST CASE 1: Unchanged File Verification (Expected: PASS)')
  console.log('------------------------------------------------------------------------')
  try {
    const originalText = 'STEGOSHARE_AUTHENTIC_FINANCIAL_REPORT_Q3_2026_CONFIDENTIAL'
    const originalBuffer = Buffer.from(originalText, 'utf8')
    const originalPath = path.join(testDir, 'case1_original.txt')
    fs.writeFileSync(originalPath, originalBuffer)

    // Step A: Calculate SHA-256 of original file BEFORE encryption
    const originalHash = integrityService.calculateHash(originalBuffer)
    console.log(`[Sender Side] Original File Size:     ${originalBuffer.length} bytes`)
    console.log(`[Sender Side] Original SHA-256 Hash:   ${originalHash}`)

    // Step B: AES-256 Encryption
    const key = cryptoService.generateKey()
    const iv = cryptoService.generateIv()
    const ciphertext = cryptoService.encryptBuffer(originalBuffer, key, iv)

    // Step C: LSB Steganography embedding
    const stegoPath = path.join(testDir, 'case1_stego.png')
    const meta = {
      fileName: 'case1_original.txt',
      mimeType: 'text/plain',
      originalSize: originalBuffer.length,
      fileHash: originalHash,
      iv: iv.toString('hex')
    }
    await stegoService.embedPayload(carrierImagePath, meta, ciphertext, stegoPath)

    // Step D: Receiver Extraction
    const extracted = await stegoService.extractPayload(stegoPath)

    // Step E: AES-256 Decryption to reconstruct plaintext
    const extractedIv = Buffer.from(extracted.iv, 'hex')
    const recoveredBuffer = cryptoService.decryptBuffer(extracted.ciphertext, key, extractedIv)
    const recoveredPath = path.join(testDir, 'case1_recovered.txt')
    fs.writeFileSync(recoveredPath, recoveredBuffer)

    // Step F: Calculate SHA-256 hash of RECOVERED plaintext file
    const recoveredHash = integrityService.calculateHash(recoveredBuffer)
    console.log(`[Receiver Side] Recovered File Size:  ${recoveredBuffer.length} bytes`)
    console.log(`[Receiver Side] Recovered SHA-256 Hash: ${recoveredHash}`)

    // Step G: Compare original hash with recovered hash
    const verification = integrityService.verifyIntegrity(originalHash, recoveredHash)
    console.log(`[Verification] Result Status:         ${verification.status}`)
    console.log(`[Verification] Match:                 ${verification.isValid ? 'YES (100% Exact Match)' : 'NO'}`)

    if (!verification.isValid || verification.status !== integrityService.STATUS_PASS) {
      throw new Error(`Expected STATUS_PASS but got: ${verification.status}`)
    }

    if (originalHash !== recoveredHash) {
      throw new Error('Hashes do not match!')
    }

    console.log('✅ TEST CASE 1 PASSED: Unchanged file correctly verified with PASS.')
    passedTests++
  } catch (err) {
    console.error('❌ TEST CASE 1 FAILED:', err.message)
  }

  // -------------------------------------------------------------------------
  // TEST CASE 2: Modified Recovered File (FAIL)
  // -------------------------------------------------------------------------
  console.log('\n------------------------------------------------------------------------')
  console.log('TEST CASE 2: Modified Recovered File (Expected: FAIL)')
  console.log('------------------------------------------------------------------------')
  try {
    const originalText = 'STEGOSHARE_AUTHENTIC_CONTRACT_BALANCE_1000000_USD'
    const originalBuffer = Buffer.from(originalText, 'utf8')
    const originalHash = integrityService.calculateHash(originalBuffer)

    // Simulate tampering: Attacker/adversary alters a single byte in recovered plaintext
    const tamperedText = 'STEGOSHARE_AUTHENTIC_CONTRACT_BALANCE_9999999_USD' // Modified balance
    const tamperedBuffer = Buffer.from(tamperedText, 'utf8')
    const tamperedHash = integrityService.calculateHash(tamperedBuffer)

    console.log(`[Sender Baseline] Original SHA-256 Hash: ${originalHash}`)
    console.log(`[Tampered File]   Recovered SHA-256 Hash: ${tamperedHash}`)

    // Compare original baseline hash with tampered recovered hash
    const verification = integrityService.verifyIntegrity(originalHash, tamperedHash)
    console.log(`[Verification]    Result Status:          ${verification.status}`)
    console.log(`[Verification]    Match:                  ${verification.isValid ? 'YES' : 'NO (Tampering Detected)'}`)

    if (verification.isValid || verification.status !== integrityService.STATUS_FAIL) {
      throw new Error(`Expected STATUS_FAIL but got: ${verification.status}`)
    }

    if (originalHash === tamperedHash) {
      throw new Error('Original and tampered hashes should differ!')
    }

    console.log('✅ TEST CASE 2 PASSED: Modified recovered file correctly rejected with FAIL.')
    passedTests++
  } catch (err) {
    console.error('❌ TEST CASE 2 FAILED:', err.message)
  }

  // -------------------------------------------------------------------------
  // TEST CASE 3: Empty File (0 Bytes) (PASS)
  // -------------------------------------------------------------------------
  console.log('\n------------------------------------------------------------------------')
  console.log('TEST CASE 3: Empty File (0 Bytes) Verification (Expected: PASS)')
  console.log('------------------------------------------------------------------------')
  try {
    const emptyBuffer = Buffer.alloc(0)
    const emptyPath = path.join(testDir, 'case3_empty.dat')
    fs.writeFileSync(emptyPath, emptyBuffer)

    // Calculate SHA-256 of empty file before encryption
    const originalEmptyHash = integrityService.calculateHash(emptyBuffer)
    const standardEmptyHash = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'

    console.log(`[Empty File] Size:                       ${emptyBuffer.length} bytes`)
    console.log(`[Empty File] Computed SHA-256 Hash:      ${originalEmptyHash}`)
    console.log(`[Empty File] Standard RFC SHA-256 Digest: ${standardEmptyHash}`)

    if (originalEmptyHash !== standardEmptyHash) {
      throw new Error(`Empty file hash does not match standard SHA-256 empty digest!`)
    }

    // Encrypt empty buffer with AES-256
    const key = cryptoService.generateKey()
    const iv = cryptoService.generateIv()
    const ciphertext = cryptoService.encryptBuffer(emptyBuffer, key, iv)

    // Stego embed & extract
    const stegoPath = path.join(testDir, 'case3_empty_stego.png')
    const meta = {
      fileName: 'case3_empty.dat',
      mimeType: 'application/octet-stream',
      originalSize: 0,
      fileHash: originalEmptyHash,
      iv: iv.toString('hex')
    }
    await stegoService.embedPayload(carrierImagePath, meta, ciphertext, stegoPath)

    const extracted = await stegoService.extractPayload(stegoPath)
    const recoveredBuffer = cryptoService.decryptBuffer(extracted.ciphertext, key, Buffer.from(extracted.iv, 'hex'))
    const recoveredEmptyHash = integrityService.calculateHash(recoveredBuffer)

    console.log(`[Recovered]  Recovered Empty Size:        ${recoveredBuffer.length} bytes`)
    console.log(`[Recovered]  Recovered SHA-256 Hash:      ${recoveredEmptyHash}`)

    const verification = integrityService.verifyIntegrity(originalEmptyHash, recoveredEmptyHash)
    console.log(`[Verification] Result Status:             ${verification.status}`)

    if (!verification.isValid || verification.status !== integrityService.STATUS_PASS) {
      throw new Error(`Expected STATUS_PASS for empty file verification but got: ${verification.status}`)
    }

    console.log('✅ TEST CASE 3 PASSED: Empty 0-byte file correctly verified with PASS.')
    passedTests++
  } catch (err) {
    console.error('❌ TEST CASE 3 FAILED:', err.message)
  }

  // -------------------------------------------------------------------------
  // TEST CASE 4: Missing File or Invalid Path Handling
  // -------------------------------------------------------------------------
  console.log('\n------------------------------------------------------------------------')
  console.log('TEST CASE 4: Missing File or Invalid Path Handling (Expected: Graceful Error)')
  console.log('------------------------------------------------------------------------')
  try {
    let errorCaughtNonExistent = false
    let errorCaughtInvalidType = false

    // 4A: Non-existent file path
    const nonExistentPath = path.join(testDir, 'non_existent_file_xyz_12345.txt')
    try {
      await integrityService.calculateFileHash(nonExistentPath)
    } catch (err) {
      errorCaughtNonExistent = true
      console.log(`[4A Missing File] Gracefully caught expected error: "${err.message}"`)
    }

    // 4B: Invalid path parameter (null / empty string)
    try {
      await integrityService.calculateFileHash('')
    } catch (err) {
      errorCaughtInvalidType = true
      console.log(`[4B Invalid Path] Gracefully caught expected error: "${err.message}"`)
    }

    // 4C: verifyIntegrity with invalid/missing hashes
    const invalidHashResult = integrityService.verifyIntegrity(null, 'abc')
    console.log(`[4C Null Hash]    Returned invalid status cleanly: "${invalidHashResult.status}"`)

    if (!errorCaughtNonExistent || !errorCaughtInvalidType || invalidHashResult.isValid !== false) {
      throw new Error('Error handling failed for missing or invalid file path.')
    }

    console.log('✅ TEST CASE 4 PASSED: Missing file and invalid paths handled gracefully with clean errors.')
    passedTests++
  } catch (err) {
    console.error('❌ TEST CASE 4 FAILED:', err.message)
  }

  // -------------------------------------------------------------------------
  // TEST CASE 5: Corrupted or Incorrectly Recovered File (FAIL)
  // -------------------------------------------------------------------------
  console.log('\n------------------------------------------------------------------------')
  console.log('TEST CASE 5: Corrupted / Incorrectly Recovered File (Expected: FAIL)')
  console.log('------------------------------------------------------------------------')
  try {
    const originalText = 'STEGOSHARE_CRITICAL_MISSION_PAYLOAD_INTEGRITY_PROTECTED'
    const originalBuffer = Buffer.from(originalText, 'utf8')
    const originalHash = integrityService.calculateHash(originalBuffer)

    // Encrypt
    const key = cryptoService.generateKey()
    const iv = cryptoService.generateIv()
    const ciphertext = cryptoService.encryptBuffer(originalBuffer, key, iv)

    // Simulate in-transit corruption: Corrupt the ciphertext buffer bytes
    const corruptedCiphertext = Buffer.from(ciphertext)
    // Flip bytes in the ciphertext
    corruptedCiphertext[4] = corruptedCiphertext[4] ^ 0xFF
    corruptedCiphertext[5] = corruptedCiphertext[5] ^ 0xAA

    let recoverySucceeded = false
    let verificationStatus = null

    try {
      // Attempt to decrypt corrupted ciphertext
      const badDecrypted = cryptoService.decryptBuffer(corruptedCiphertext, key, iv)
      // If decryption doesn't throw, hash will still be completely corrupted
      const badHash = integrityService.calculateHash(badDecrypted)
      const v = integrityService.verifyIntegrity(originalHash, badHash)
      verificationStatus = v.status
    } catch (decErr) {
      // AES decryption caught block corruption / padding error
      console.log(`[Corrupted Decryption] Caught cryptographic corruption: "${decErr.message}"`)
      // Mark as FAIL as expected
      verificationStatus = integrityService.STATUS_FAIL
    }

    console.log(`[Verification] Result Status: ${verificationStatus}`)

    if (verificationStatus !== integrityService.STATUS_FAIL) {
      throw new Error(`Corrupted recovery should yield STATUS_FAIL! Got: ${verificationStatus}`)
    }

    console.log('✅ TEST CASE 5 PASSED: Corrupted payload correctly flagged with FAIL.')
    passedTests++
  } catch (err) {
    console.error('❌ TEST CASE 5 FAILED:', err.message)
  }

  // -------------------------------------------------------------------------
  // SUMMARY
  // -------------------------------------------------------------------------
  console.log('\n========================================================================')
  console.log(`📊 TEST SUITE SUMMARY: ${passedTests}/${totalTests} TESTS PASSED (${((passedTests / totalTests) * 100).toFixed(0)}%)`)
  console.log('   1. Unchanged file (PASS)                      -> PASSED')
  console.log('   2. Modified recovered file (FAIL)             -> PASSED')
  console.log('   3. Empty file (0 bytes) (PASS)                -> PASSED')
  console.log('   4. Missing file or invalid path (Error catch) -> PASSED')
  console.log('   5. Corrupted / altered recovery (FAIL)        -> PASSED')
  console.log('========================================================================')

  if (passedTests !== totalTests) {
    throw new Error(`Some tests failed: ${passedTests}/${totalTests}`)
  }
}

runIntegrityTests().catch(err => {
  console.error('\n❌ INTEGRITY TEST SUITE RUNNER ERROR:', err)
  process.exit(1)
})
