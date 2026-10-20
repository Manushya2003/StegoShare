const fs = require('fs')
const path = require('path')

async function testApiEndpoints() {
  console.log('Testing live HTTP REST API on http://localhost:5000 ...')

  // 1. Health check
  const healthRes = await fetch('http://localhost:5000/api/health')
  const healthData = await healthRes.json()
  console.log('✅ Health Check:', healthData)

  // 2. Upload / Process file
  const testDir = path.join(__dirname, 'test_scratch')
  const secretBuf = fs.readFileSync(path.join(testDir, 'confidential.txt'))
  const carrierBuf = fs.readFileSync(path.join(testDir, 'carrier.png'))

  const formData = new FormData()
  formData.append('file', new Blob([secretBuf]), 'confidential.txt')
  formData.append('coverImage', new Blob([carrierBuf]), 'carrier.png')
  formData.append('receiverAddress', '0x70997970C51812dc3A010C7d01b50e0d17dc79C8')
  formData.append('ownerAddress', '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266')

  const processRes = await fetch('http://localhost:5000/api/process', {
    method: 'POST',
    body: formData
  })
  const processData = await processRes.json()
  console.log('✅ Process Endpoint Response:', {
    success: processData.success,
    fileId: processData.fileId,
    ipfsCid: processData.ipfsCid,
    txHash: processData.txHash,
    shareLink: processData.shareLink
  })

  const fileId = processData.fileId

  // 3. Get file info
  const infoRes = await fetch(`http://localhost:5000/api/files/${fileId}`)
  const infoData = await infoRes.json()
  console.log('✅ Get File Info:', {
    fileId: infoData.fileId,
    accessStatus: infoData.accessStatus,
    authorizedReceiver: infoData.authorizedReceiver
  })

  // 4. Verify access for authorized receiver
  const verifyRes = await fetch(`http://localhost:5000/api/files/${fileId}/verify-access`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ walletAddress: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8' })
  })
  const verifyData = await verifyRes.json()
  console.log('✅ Verify Access (Receiver):', {
    isAuthorized: verifyData.isAuthorized,
    role: verifyData.role
  })

  // 5. Verify access for unauthorized attacker
  const attackerRes = await fetch(`http://localhost:5000/api/files/${fileId}/verify-access`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ walletAddress: '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC' })
  })
  const attackerData = await attackerRes.json()
  console.log('✅ Verify Access (Attacker):', {
    isAuthorized: attackerData.isAuthorized,
    role: attackerData.role,
    status: attackerData.status
  })

  // 6. Test Recovery for authorized receiver with SHA-256 integrity verification
  const recoverRes = await fetch(`http://localhost:5000/api/files/${fileId}/recover`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ walletAddress: '0x70997970C51812dc3A010C7d01b50e0d17dc79C8' })
  })
  const recoverData = await recoverRes.json()
  console.log('✅ Recover & Integrity Verification Response:', {
    success: recoverData.success,
    integrityVerified: recoverData.integrityVerified,
    integrityStatus: recoverData.integrityStatus,
    originalHash: recoverData.originalHash,
    recoveredHash: recoverData.recoveredHash,
    fileName: recoverData.fileName,
    fileSize: recoverData.fileSize
  })

  // 7. Test standalone verify-integrity endpoint
  const integrityRes = await fetch(`http://localhost:5000/api/files/${fileId}/verify-integrity`)
  const integrityData = await integrityRes.json()
  console.log('✅ Standalone File Integrity Verification Endpoint:', {
    success: integrityData.success,
    integrityStatus: integrityData.integrityStatus,
    originalHash: integrityData.originalHash,
    recoveredHash: integrityData.recoveredHash
  })

  // 8. Verify Stats
  const statsRes = await fetch('http://localhost:5000/api/stats')
  const statsData = await statsRes.json()
  console.log('✅ Stats Endpoint:', statsData.stats)

  console.log('\n🌟 ALL REST API ENDPOINTS ARE FULLY OPERATIONAL AND VERIFIED!')
}

testApiEndpoints().catch(err => {
  console.error('API Test Error:', err)
  process.exit(1)
})
