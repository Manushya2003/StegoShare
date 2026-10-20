import React, { useState, useEffect } from 'react'
import { 
  Lock, ShieldCheck, ShieldAlert, KeyRound, Download, RefreshCw, 
  CheckCircle2, AlertOctagon, Eye, Database, FileText, Check, Copy, 
  ArrowDown, Loader2, Sparkles, UserCheck, ShieldX 
} from 'lucide-react'
import { api } from '../services/api'
import { Web3Service, DEMO_WALLETS } from '../services/web3'

export default function AccessPage({ wallet, setWallet, accessFileId, setAccessFileId, setActivePage }) {
  const [fileIdInput, setFileIdInput] = useState(accessFileId || '')
  const [fileMeta, setFileMeta] = useState(null)
  const [authStatus, setAuthStatus] = useState('UNAUTHENTICATED') // UNAUTHENTICATED | AUTHORIZED | DENIED | NOT_FOUND
  const [authRole, setAuthRole] = useState('')
  const [authReason, setAuthReason] = useState('')
  const [isLoadingMeta, setIsLoadingMeta] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)

  // Recovery Workflow States (Steps 1 to 5)
  // Step 1: IPFS Retrieved, Step 2: Payload Extracted, Step 3: Decrypted (Plaintext recovered), Step 4: SHA-256 Verified, Step 5: Ready to Download
  const [recoveryStep, setRecoveryStep] = useState(0)
  const [isRecovering, setIsRecovering] = useState(false)
  const [recoveryError, setRecoveryError] = useState('')
  const [recoveredResult, setRecoveredResult] = useState(null)
  const [copiedField, setCopiedField] = useState(null)

  // Owner Revocation
  const [isRevoking, setIsRevoking] = useState(false)
  const [revocationMsg, setRevocationMsg] = useState('')

  const handleCopyHash = async (text, fieldName) => {
    if (!text) return
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(fieldName)
      setTimeout(() => setCopiedField(null), 2000)
    } catch (err) {
      console.error(err)
    }
  }

  // Sync prop changes into input
  useEffect(() => {
    if (accessFileId) {
      setFileIdInput(accessFileId)
      fetchFileMetadata(accessFileId)
    }
  }, [accessFileId])

  // Re-verify authorization whenever connected wallet or fileMeta changes
  useEffect(() => {
    const activeFileId = (fileIdInput || accessFileId || fileMeta?.fileId || '').trim()
    if (fileMeta && activeFileId) {
      if (wallet?.address) {
        verifyWalletAccess(activeFileId, wallet.address, fileMeta)
      } else {
        setAuthStatus('UNAUTHENTICATED')
        setAuthRole('')
        setAuthReason('')
      }
    } else if (!wallet?.address) {
      setAuthStatus('UNAUTHENTICATED')
      setAuthRole('')
      setAuthReason('')
    }
  }, [wallet?.address, fileMeta?.fileId, fileMeta?.authorizedReceiver, fileMeta?.isRevoked, accessFileId])

  const fetchFileMetadata = async (targetFileId) => {
    if (!targetFileId) return
    setIsLoadingMeta(true)
    setRecoveryError('')
    setRecoveredResult(null)
    setRecoveryStep(0)

    try {
      const meta = await api.getFileInfo(targetFileId.trim())
      setFileMeta(meta)
      if (wallet?.address) {
        await verifyWalletAccess(targetFileId.trim(), wallet.address, meta)
      } else {
        setAuthStatus('UNAUTHENTICATED')
        setAuthRole('')
        setAuthReason('')
      }
    } catch (err) {
      setFileMeta(null)
      setAuthStatus('NOT_FOUND')
      setAuthReason(err.message || 'File ID not found on blockchain registry.')
    } finally {
      setIsLoadingMeta(false)
    }
  }

  const verifyWalletAccess = async (targetFileId, address, currentMeta = fileMeta) => {
    if (!address) {
      setAuthStatus('UNAUTHENTICATED')
      setAuthRole('')
      setAuthReason('')
      return
    }

    setIsVerifying(true)
    setRecoveryError('')

    const meta = currentMeta || fileMeta

    // 1. Perform immediate cryptographic address comparison if file metadata is loaded
    if (meta) {
      const ownerAddress = meta.ownerAddress || meta.owner
      const receiverAddress = meta.authorizedReceiver || meta.receiver

      if (Web3Service.isAddressEqual(address, ownerAddress)) {
        setAuthStatus('AUTHORIZED')
        setAuthRole('OWNER')
        setAuthReason('Authorized access granted: Connected wallet is the asset creator/owner.')
      } else if (Web3Service.isAddressEqual(address, receiverAddress)) {
        if (meta.isRevoked || meta.accessStatus === 'REVOKED') {
          setAuthStatus('DENIED')
          setAuthRole('REVOKED')
          setAuthReason('Access to this confidential file has been revoked by the asset owner.')
        } else {
          setAuthStatus('AUTHORIZED')
          setAuthRole('RECEIVER')
          setAuthReason('Authorized access granted: Connected wallet matches the designated recipient in the smart contract.')
        }
      } else {
        setAuthStatus('DENIED')
        setAuthRole('UNAUTHORIZED')
        setAuthReason(`Access Denied: Connected wallet (${address}) is not authorized on the blockchain for this file.`)
      }
    }

    // 2. Query backend/blockchain smart contract verification API
    try {
      if (targetFileId) {
        const res = await api.verifyAccess(targetFileId, address)
        if (res.isAuthorized) {
          setAuthStatus('AUTHORIZED')
          setAuthRole(res.role)
          setAuthReason(res.reason)
        } else {
          setAuthStatus('DENIED')
          setAuthRole(res.role || 'UNAUTHORIZED')
          setAuthReason(res.reason || `Access Denied: Connected wallet (${address}) is not authorized.`)
        }
      }
    } catch (err) {
      if (!meta) {
        setAuthStatus('DENIED')
        setAuthRole('UNAUTHORIZED')
        setAuthReason(err.message || 'Authorization check failed.')
      }
    } finally {
      setIsVerifying(false)
    }
  }

  const handleConnectMetaMask = async () => {
    try {
      const res = await Web3Service.connectMetaMask()
      const newWallet = {
        address: res.address,
        network: res.networkName,
        isMetaMask: true
      }
      setWallet(newWallet)
      const activeFileId = (fileIdInput || accessFileId || fileMeta?.fileId || '').trim()
      if (fileMeta && activeFileId) {
        verifyWalletAccess(activeFileId, res.address, fileMeta)
      }
    } catch (err) {
      alert(err.message)
    }
  }

  const handleSwitchToDemo = (roleKey) => {
    const demo = DEMO_WALLETS[roleKey]
    if (!demo) return
    const newWallet = {
      address: demo.address,
      name: demo.name,
      role: demo.role,
      network: 'Hardhat Localhost (31337)',
      isMetaMask: false
    }
    setWallet(newWallet)
    const activeFileId = (fileIdInput || accessFileId || fileMeta?.fileId || '').trim()
    if (fileMeta && activeFileId) {
      verifyWalletAccess(activeFileId, demo.address, fileMeta)
    }
  }

  // Multi-step Interactive Recovery Execution
  const handleExecuteStep1_Retrieve = async () => {
    if (authStatus !== 'AUTHORIZED') {
      setRecoveryError('Access Denied: Only authorized wallets can retrieve this file.')
      return
    }
    setIsRecovering(true)
    setRecoveryError('')
    setTimeout(() => {
      setRecoveryStep(1)
      setIsRecovering(false)
    }, 450)
  }

  const handleExecuteStep2_Extract = async () => {
    if (authStatus !== 'AUTHORIZED') {
      setRecoveryError('Access Denied: Only authorized wallets can extract hidden payloads.')
      return
    }
    setIsRecovering(true)
    setRecoveryError('')
    setTimeout(() => {
      setRecoveryStep(2)
      setIsRecovering(false)
    }, 550)
  }

  const handleExecuteStep3_Decrypt = async () => {
    if (authStatus !== 'AUTHORIZED') {
      setRecoveryError('Access Denied: Only authorized wallets can decrypt this confidential file.')
      return
    }
    setIsRecovering(true)
    setRecoveryError('')
    try {
      const res = await api.recoverFile(fileIdInput.trim(), wallet.address)
      setRecoveredResult(res)
      setRecoveryStep(3)
    } catch (err) {
      setRecoveryError(err.message || 'Failed to decrypt ciphertext.')
    } finally {
      setIsRecovering(false)
    }
  }

  const handleExecuteStep4_Verify = async () => {
    if (authStatus !== 'AUTHORIZED') {
      setRecoveryError('Access Denied: Only authorized wallets can verify hash integrity.')
      return
    }
    setIsRecovering(true)
    setRecoveryError('')
    try {
      let currentResult = recoveredResult
      if (!currentResult) {
        currentResult = await api.recoverFile(fileIdInput.trim(), wallet.address)
        setRecoveredResult(currentResult)
      }
      setRecoveryStep(4)
      if (currentResult.integrityVerified) {
        setTimeout(() => setRecoveryStep(5), 450)
      } else {
        setRecoveryError(currentResult.message || 'FAIL — File Integrity Verification Failed')
      }
    } catch (err) {
      setRecoveryError(err.message || 'Failed to verify file integrity.')
    } finally {
      setIsRecovering(false)
    }
  }

  // Trigger one-click full recovery
  const handleFullRecovery = async () => {
    if (authStatus !== 'AUTHORIZED') {
      setRecoveryError('Access Denied: Only authorized wallets can perform full recovery.')
      return
    }
    setIsRecovering(true)
    setRecoveryError('')
    try {
      setRecoveryStep(1)
      await new Promise(r => setTimeout(r, 350))
      setRecoveryStep(2)
      await new Promise(r => setTimeout(r, 350))
      setRecoveryStep(3)
      const res = await api.recoverFile(fileIdInput.trim(), wallet.address)
      setRecoveredResult(res)
      await new Promise(r => setTimeout(r, 350))
      setRecoveryStep(4)
      if (res.integrityVerified) {
        await new Promise(r => setTimeout(r, 400))
        setRecoveryStep(5)
      } else {
        setRecoveryError(res.message || 'FAIL — File Integrity Verification Failed: Hashes differ!')
      }
    } catch (err) {
      setRecoveryError(err.message || 'Failed to recover file.')
    } finally {
      setIsRecovering(false)
    }
  }

  const handleDownloadOriginalFile = () => {
    if (authStatus !== 'AUTHORIZED' || !wallet?.address || !fileIdInput) {
      setRecoveryError('Access Denied: Cannot download confidential file without authorized wallet.')
      return
    }
    const url = api.getRecoveredDownloadUrl(fileIdInput.trim(), wallet.address)
    window.open(url, '_blank')
  }

  const handleRevokeAccess = async () => {
    if (!wallet?.address) return
    setIsRevoking(true)
    try {
      await api.revokeAccess(fileIdInput.trim(), wallet.address)
      setRevocationMsg('Access successfully revoked on smart contract ledger!')
      await fetchFileMetadata(fileIdInput.trim())
    } catch (err) {
      alert(err.message)
    } finally {
      setIsRevoking(false)
    }
  }

  const handleRestoreAccess = async () => {
    if (!wallet?.address) return
    setIsRevoking(true)
    try {
      await api.restoreAccess(fileIdInput.trim(), wallet.address)
      setRevocationMsg('Access restored on smart contract ledger!')
      await fetchFileMetadata(fileIdInput.trim())
    } catch (err) {
      alert(err.message)
    } finally {
      setIsRevoking(false)
    }
  }


  return (
    <div className="access-page-container">
      {/* Top Header */}
      <div className="page-header-row">
        <div>
          <div className="badge badge-purple mb-2">
            <KeyRound size={12} />
            <span>Zero-Trust Access Control</span>
          </div>
          <h1 className="page-title">Secure Access Portal</h1>
          <p className="page-subtitle">
            Connect your MetaMask wallet to verify blockchain authorization and decrypt the confidential asset.
          </p>
        </div>

        {/* Access State Badges */}
        <div className="access-states-group">
          <div className={`state-pill ${authStatus === 'UNAUTHENTICATED' ? 'state-active state-unauth' : ''}`}>
            <span className="pulse-dot pulse-dot-cyan"></span>
            <span>Unauthenticated</span>
          </div>
          <div className={`state-pill ${authStatus === 'AUTHORIZED' ? 'state-active state-authorized' : ''}`}>
            <span className="pulse-dot pulse-dot-emerald"></span>
            <span>Authorized</span>
          </div>
          <div className={`state-pill ${authStatus === 'DENIED' ? 'state-active state-denied' : ''}`}>
            <span className="pulse-dot pulse-dot-rose"></span>
            <span>Denied</span>
          </div>
        </div>
      </div>

      {/* File ID Search Bar */}
      <div className="search-file-bar glass-card">
        <div className="search-input-wrapper">
          <FileText size={18} className="text-cyan" />
          <input 
            type="text" 
            placeholder="Enter or paste File ID (e.g., stego-8f3a9e...)"
            value={fileIdInput}
            onChange={(e) => setFileIdInput(e.target.value)}
            className="mono search-input"
          />
        </div>
        <button 
          className="btn-cyan search-btn"
          onClick={() => fetchFileMetadata(fileIdInput)}
          disabled={isLoadingMeta || !fileIdInput}
        >
          {isLoadingMeta ? <Loader2 size={16} className="spin-icon" /> : <RefreshCw size={16} />}
          <span>Fetch File Metadata</span>
        </button>
      </div>

      {/* Main Verification & Recovery Area */}
      {!wallet ? (
        /* Unauthenticated State: Connect Wallet CTA Card */
        <div className="auth-required-card glass-card">
          <div className="auth-icon-glow">
            <Lock size={44} className="text-cyan" />
          </div>
          <h2 className="auth-card-title">Authentication Required</h2>
          <p className="auth-card-desc">
            This protected file requires cryptographic Ethereum wallet verification. 
            Connect your MetaMask wallet to verify your identity against the smart contract.
          </p>

          <button className="btn-primary auth-connect-btn" onClick={handleConnectMetaMask}>
            <KeyRound size={18} />
            <span>Connect MetaMask Wallet</span>
          </button>

          <div className="demo-switch-pills-row mt-4">
            <span className="demo-switch-label">Or Quick Test As:</span>
            <button className="demo-role-pill" onClick={() => handleSwitchToDemo('RECEIVER')}>
              Authorized Receiver (0x7099...79C8)
            </button>
            <button className="demo-role-pill" onClick={() => handleSwitchToDemo('OWNER')}>
              File Owner (0xf39F...2266)
            </button>
            <button className="demo-role-pill text-rose" onClick={() => handleSwitchToDemo('ATTACKER')}>
              Unauthorized Attacker (0x3C44...93BC)
            </button>
          </div>
        </div>
      ) : !fileMeta ? (
        /* File Not Loaded / Not Found State */
        <div className="file-not-found-card glass-card">
          <AlertOctagon size={40} className="text-amber mb-2" />
          <h3>{authStatus === 'NOT_FOUND' ? 'File Record Not Found' : 'Enter a File ID to Access'}</h3>
          <p className="text-secondary">{authReason || 'Provide a valid StegoShare File ID above to begin verification.'}</p>
        </div>
      ) : authStatus === 'DENIED' ? (
        /* Access Denied State */
        <div className="access-denied-card glass-card">
          <div className="denied-icon-glow">
            <ShieldX size={44} className="text-rose" />
          </div>
          <div className="badge badge-rose mb-2">
            <span>ACCESS DENIED</span>
          </div>
          <h2 className="denied-title">Unauthorized Wallet Address</h2>
          <p className="denied-desc">
            {authReason || 'This wallet address is not authorized on the smart contract to decrypt this confidential file.'}
          </p>

          <div className="denied-details-box">
            <div className="denied-detail-row">
              <span className="denied-key">Connected Wallet:</span>
              <span className="mono text-rose">{wallet.address}</span>
            </div>
            <div className="denied-detail-row">
              <span className="denied-key">Authorized Receiver:</span>
              <span className="mono text-muted">{fileMeta.authorizedReceiver}</span>
            </div>
            <div className="denied-detail-row">
              <span className="denied-key">Access Status:</span>
              <span className="badge badge-rose">{fileMeta.accessStatus || 'BLOCKED'}</span>
            </div>
          </div>

          <div className="denied-switch-row mt-4">
            <span className="text-secondary text-sm">Switch to the authorized recipient address to unlock:</span>
            <button className="btn-secondary btn-sm" onClick={() => handleSwitchToDemo('RECEIVER')}>
              Switch to Receiver Account (0x7099...79C8)
            </button>
          </div>
        </div>
      ) : (
        /* Access Authorized State */
        <div className="authorized-portal-grid">
          {/* Top Authorized Banner */}
          <div className="authorized-banner-card glass-card">
            <div className="auth-banner-header">
              <div className="auth-status-badge-row">
                <div className="badge badge-emerald">
                  <CheckCircle2 size={14} />
                  <span>ACCESS AUTHORIZED</span>
                </div>
                <span className="badge badge-purple">{authRole || 'Authorized Receiver'}</span>
              </div>
              <h2 className="auth-portal-title">Decryption & File Recovery Portal</h2>
              <p className="auth-portal-desc">
                Your wallet credentials match the smart contract access permissions. 
                Execute the steganographic extraction and AES-256 decryption pipeline below.
              </p>
            </div>

            <div className="auth-meta-grid">
              <div className="auth-meta-item">
                <span className="auth-meta-label">Connected Wallet:</span>
                <span className="mono auth-meta-val text-cyan">{wallet.address}</span>
              </div>
              <div className="auth-meta-item">
                <span className="auth-meta-label">File ID:</span>
                <span className="mono auth-meta-val">{fileMeta.fileId}</span>
              </div>
              <div className="auth-meta-item">
                <span className="auth-meta-label">IPFS CID:</span>
                <span className="mono auth-meta-val text-blue">{fileMeta.ipfsCid}</span>
              </div>
              <div className="auth-meta-item">
                <span className="auth-meta-label">Registered SHA-256:</span>
                <span className="mono auth-meta-val text-emerald">{fileMeta.fileHash.substring(0, 16)}...</span>
              </div>
            </div>
          </div>

          {/* 5-Step Interactive Recovery Card */}
          <div className="recovery-flow-card glass-card">
            <div className="recovery-card-header">
              <Sparkles size={20} className="text-cyan" />
              <div>
                <h3 className="recovery-title">Steganography & Decryption Workflow</h3>
                <p className="recovery-subtitle">Execute step-by-step or run full automated recovery</p>
              </div>
              <button 
                className="btn-cyan full-recovery-btn"
                onClick={handleFullRecovery}
                disabled={isRecovering || recoveryStep >= 4}
              >
                {isRecovering ? <Loader2 size={16} className="spin-icon" /> : <Sparkles size={16} />}
                <span>Auto Recover All</span>
              </button>
            </div>

            {recoveryError && (
              <div className="alert-box alert-error mb-4">
                <AlertOctagon size={18} />
                <span>{recoveryError}</span>
              </div>
            )}

            {/* Interactive Step Timeline */}
            <div className="interactive-steps-container">

              {/* Step 1: Retrieve Stego Image */}
              <div className={`recovery-step-box ${recoveryStep >= 1 ? 'step-done' : 'step-current'}`}>
                <div className="recovery-step-indicator">
                  {recoveryStep >= 1 ? <Check size={14} className="text-emerald" /> : '1'}
                </div>
                <div className="recovery-step-body">
                  <div className="step-title-row">
                    <h4>Step 1: Retrieve Stego Image</h4>
                    {recoveryStep >= 1 && <span className="badge badge-emerald">Retrieved</span>}
                  </div>
                  <p className="step-desc">Fetch the carrier stego PNG image from decentralized IPFS storage.</p>
                </div>
                {recoveryStep === 0 && (
                  <button 
                    className="btn-secondary btn-sm step-action-btn"
                    onClick={handleExecuteStep1_Retrieve}
                    disabled={isRecovering}
                  >
                    Retrieve from IPFS
                  </button>
                )}
              </div>

              {/* Step 2: Extract Hidden Data */}
              <div className={`recovery-step-box ${recoveryStep >= 2 ? 'step-done' : recoveryStep === 1 ? 'step-current' : 'step-pending'}`}>
                <div className="recovery-step-indicator">
                  {recoveryStep >= 2 ? <Check size={14} className="text-emerald" /> : '2'}
                </div>
                <div className="recovery-step-body">
                  <div className="step-title-row">
                    <h4>Step 2: Extract Hidden Data</h4>
                    {recoveryStep >= 2 && <span className="badge badge-purple">Extracted</span>}
                  </div>
                  <p className="step-desc">Read 24-bit RGB pixel LSBs and reconstruct encrypted ciphertext + IV.</p>
                </div>
                {recoveryStep === 1 && (
                  <button 
                    className="btn-secondary btn-sm step-action-btn"
                    onClick={handleExecuteStep2_Extract}
                    disabled={isRecovering}
                  >
                    Extract Encrypted Payload
                  </button>
                )}
              </div>

              {/* Step 3: Decrypt File */}
              <div className={`recovery-step-box ${recoveryStep >= 3 ? 'step-done' : recoveryStep === 2 ? 'step-current' : 'step-pending'}`}>
                <div className="recovery-step-indicator">
                  {recoveryStep >= 3 ? <Check size={14} className="text-emerald" /> : '3'}
                </div>
                <div className="recovery-step-body">
                  <div className="step-title-row">
                    <h4>Step 3: Decrypt File</h4>
                    {recoveryStep >= 3 && <span className="badge badge-cyan">AES-256 Decrypted</span>}
                  </div>
                  <p className="step-desc">Decrypt ciphertext with verified AES-256 cryptographic key to reconstruct plaintext.</p>
                </div>
                {recoveryStep === 2 && (
                  <button 
                    className="btn-primary btn-sm step-action-btn"
                    onClick={handleExecuteStep3_Decrypt}
                    disabled={isRecovering}
                  >
                    Decrypt Ciphertext
                  </button>
                )}
              </div>

              {/* Step 4: Verify SHA-256 File Integrity */}
              <div className={`recovery-step-box ${recoveryStep >= 4 ? (recoveredResult?.integrityVerified ? 'step-done' : 'step-failed') : recoveryStep === 3 ? 'step-current' : 'step-pending'}`}>
                <div className="recovery-step-indicator">
                  {recoveryStep >= 4 ? (
                    recoveredResult?.integrityVerified ? <Check size={14} className="text-emerald" /> : <AlertOctagon size={14} className="text-rose" />
                  ) : '4'}
                </div>
                <div className="recovery-step-body">
                  <div className="step-title-row">
                    <h4>Step 4: Verify SHA-256 File Integrity</h4>
                    {recoveryStep >= 4 && (
                      <span className={`badge ${recoveredResult?.integrityVerified ? 'badge-emerald' : 'badge-rose'}`}>
                        {recoveredResult?.integrityVerified ? 'PASS — File Integrity Verified' : 'FAIL — File Integrity Verification Failed'}
                      </span>
                    )}
                  </div>
                  <p className="step-desc">Calculate SHA-256 checksum of recovered plaintext file and verify against immutable blockchain hash.</p>
                </div>
                {recoveryStep === 3 && (
                  <button 
                    className="btn-cyan btn-sm step-action-btn"
                    onClick={handleExecuteStep4_Verify}
                    disabled={isRecovering}
                  >
                    Verify SHA-256 Integrity
                  </button>
                )}
              </div>

              {/* Step 5: Download Verified File */}
              <div className={`recovery-step-box ${recoveryStep >= 5 ? 'step-completed-final' : 'step-pending'}`}>
                <div className="recovery-step-indicator">
                  {recoveryStep >= 5 ? <Check size={14} className="text-emerald" /> : '5'}
                </div>
                <div className="recovery-step-body">
                  <div className="step-title-row">
                    <h4>Step 5: Download Verified File</h4>
                    {recoveryStep >= 5 && <span className="badge badge-emerald">Ready for Download</span>}
                  </div>
                  <p className="step-desc">
                    {recoveredResult && recoveredResult.integrityVerified ? (
                      <span className="mono text-emerald">
                        Recovered & Verified: {recoveredResult.fileName} ({(recoveredResult.fileSize / 1024).toFixed(2)} KB)
                      </span>
                    ) : recoveredResult && !recoveredResult.integrityVerified ? (
                      <span className="mono text-rose">
                        Integrity verification failed. File download blocked to protect data authenticity.
                      </span>
                    ) : (
                      'Decrypted plaintext asset verified and ready for download.'
                    )}
                  </p>
                </div>
                {recoveryStep >= 4 && recoveredResult?.integrityVerified && (
                  <button 
                    className="btn-emerald btn-download-final"
                    onClick={handleDownloadOriginalFile}
                  >
                    <Download size={16} />
                    <span>Download Original File</span>
                  </button>
                )}
              </div>

            </div>

            {/* SHA-256 Cryptographic File Integrity Verification Card */}
            {recoveredResult && (
              <div className={`integrity-card glass-card mt-4 ${recoveredResult.integrityVerified ? 'integrity-pass-card' : 'integrity-fail-card'}`}>
                <div className="integrity-card-header">
                  <div className="integrity-status-left">
                    {recoveredResult.integrityVerified ? (
                      <div className="integrity-icon-glow pass">
                        <CheckCircle2 size={26} className="text-emerald" />
                      </div>
                    ) : (
                      <div className="integrity-icon-glow fail">
                        <AlertOctagon size={26} className="text-rose" />
                      </div>
                    )}
                    <div>
                      <div className="integrity-status-badge-row">
                        <span className={`integrity-status-pill ${recoveredResult.integrityVerified ? 'pill-pass' : 'pill-fail'}`}>
                          {recoveredResult.integrityStatus || (recoveredResult.integrityVerified ? 'PASS — File Integrity Verified' : 'FAIL — File Integrity Verification Failed')}
                        </span>
                        <span className="badge badge-cyan">SHA-256 Engine</span>
                      </div>
                      <p className="integrity-summary-text">
                        {recoveredResult.integrityVerified
                          ? 'Zero-trust verification complete: Recovered plaintext SHA-256 hash matches the immutable blockchain record identically.'
                          : 'Tamper alert: The recovered file SHA-256 hash does NOT match the original hash anchored on the blockchain.'}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="integrity-hashes-container">
                  {/* Original Hash (Blockchain Baseline) */}
                  <div className="hash-comparison-card">
                    <div className="hash-card-top">
                      <span className="hash-card-label">Original File SHA-256 (Anchored on Blockchain):</span>
                      <button 
                        className="hash-copy-btn"
                        onClick={() => handleCopyHash(recoveredResult.originalHash || fileMeta?.fileHash, 'orig')}
                        title="Copy Original Hash"
                      >
                        {copiedField === 'orig' ? <span className="text-emerald"><Check size={12} /> Copied!</span> : <Copy size={13} />}
                      </button>
                    </div>
                    <div className="hash-code-box">
                      <span className="mono text-cyan">{recoveredResult.originalHash || fileMeta?.fileHash}</span>
                    </div>
                  </div>

                  {/* Recovered Hash (Calculated After Decryption) */}
                  <div className="hash-comparison-card">
                    <div className="hash-card-top">
                      <span className="hash-card-label">Recovered File SHA-256 (Calculated After Decryption):</span>
                      <button 
                        className="hash-copy-btn"
                        onClick={() => handleCopyHash(recoveredResult.recoveredHash, 'rec')}
                        title="Copy Recovered Hash"
                      >
                        {copiedField === 'rec' ? <span className="text-emerald"><Check size={12} /> Copied!</span> : <Copy size={13} />}
                      </button>
                    </div>
                    <div className="hash-code-box">
                      <span className={`mono ${recoveredResult.integrityVerified ? 'text-emerald' : 'text-rose'}`}>
                        {recoveredResult.recoveredHash || 'Calculation Failed'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="integrity-meta-footer">
                  <div className="integrity-meta-item">
                    <span className="meta-key">Verification Status:</span>
                    <span className={`meta-val font-bold ${recoveredResult.integrityVerified ? 'text-emerald' : 'text-rose'}`}>
                      {recoveredResult.integrityVerified ? 'PASS (100% Exact Match)' : 'FAIL (Hash Mismatch)'}
                    </span>
                  </div>
                  <div className="integrity-meta-item">
                    <span className="meta-key">Verification Checkpoint:</span>
                    <span className="meta-val">Post-Decryption Plaintext</span>
                  </div>
                  <div className="integrity-meta-item">
                    <span className="meta-key">Trust Root:</span>
                    <span className="meta-val text-purple">Immutable Smart Contract (StegoShareAccess)</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Owner Access Control Panel (If connected wallet is the file creator/owner) */}
          {authRole === 'OWNER' && (
            <div className="owner-management-card glass-card">
              <div className="owner-card-header">
                <ShieldCheck size={20} className="text-purple" />
                <div>
                  <h4 className="owner-card-title">Owner Access Control</h4>
                  <p className="owner-card-desc">As the asset creator, you can revoke or restore receiver access at any time on-chain.</p>
                </div>
              </div>

              {revocationMsg && (
                <div className="alert-box alert-success mb-3">
                  <CheckCircle2 size={16} />
                  <span>{revocationMsg}</span>
                </div>
              )}

              <div className="owner-actions-row">
                {fileMeta.isRevoked ? (
                  <button 
                    className="btn-emerald btn-sm"
                    onClick={handleRestoreAccess}
                    disabled={isRevoking}
                  >
                    Restore Receiver Access
                  </button>
                ) : (
                  <button 
                    className="btn-danger btn-sm"
                    onClick={handleRevokeAccess}
                    disabled={isRevoking}
                  >
                    Revoke Receiver Access
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
