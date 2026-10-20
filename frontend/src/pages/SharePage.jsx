import React, { useState, useRef } from 'react'
import { 
  Upload, FileText, Image as ImageIcon, CheckCircle, AlertTriangle, 
  Trash2, ArrowRight, ShieldCheck, Lock, Eye, KeyRound, Loader2, Sparkles, RefreshCw 
} from 'lucide-react'
import { api } from '../services/api'
import { Web3Service, DEMO_WALLETS } from '../services/web3'

export default function SharePage({ wallet, onProcessingComplete, setActivePage }) {
  const [confidentialFile, setConfidentialFile] = useState(null)
  const [carrierImage, setCarrierImage] = useState(null)
  const [carrierPreview, setCarrierPreview] = useState(null)
  const [carrierCapacity, setCarrierCapacity] = useState(null)

  const [receiverAddress, setReceiverAddress] = useState('')
  const [addressError, setAddressError] = useState('')

  const [isProcessing, setIsProcessing] = useState(false)
  const [processingStage, setProcessingStage] = useState(0)
  const [executionLogs, setExecutionLogs] = useState([])
  const [errorMessage, setErrorMessage] = useState('')

  const fileInputRef = useRef(null)
  const imageInputRef = useRef(null)

  // Step 1: Confidential File Handler
  const handleFileChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setConfidentialFile(file)
    setErrorMessage('')
  }

  const handleRemoveFile = () => {
    setConfidentialFile(null)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  // Step 2: Carrier Image Handler
  const handleImageChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setCarrierImage(file)
    setErrorMessage('')

    const reader = new FileReader()
    reader.onload = (event) => {
      const img = new Image()
      img.onload = () => {
        setCarrierPreview(event.target.result)
        // 3 bits per pixel (R, G, B channels)
        const capacityBytes = Math.floor((img.width * img.height * 3) / 8)
        setCarrierCapacity({
          width: img.width,
          height: img.height,
          capacityBytes
        })
      }
      img.src = event.target.result
    }
    reader.readAsDataURL(file)
  }

  const handleRemoveImage = () => {
    setCarrierImage(null)
    setCarrierPreview(null)
    setCarrierCapacity(null)
    if (imageInputRef.current) imageInputRef.current.value = ''
  }

  // Step 3: Address Validation
  const handleAddressChange = (e) => {
    const val = e.target.value.trim()
    setReceiverAddress(val)
    if (!val) {
      setAddressError('')
    } else if (val.includes('...')) {
      setAddressError('Please enter the full 42-character Ethereum address (do not use shortened address with "...").')
    } else if (!Web3Service.isValidAddress(val)) {
      setAddressError('Invalid Ethereum wallet address format (Must be 42 characters starting with 0x).')
    } else {
      setAddressError('')
    }
  }

  const handleQuickFillReceiver = (type) => {
    if (type === 'CONNECTED' && wallet?.address) {
      setReceiverAddress(wallet.address)
      setAddressError('')
    } else if (type === 'DEMO_RECEIVER') {
      const fullReceiverAddress = DEMO_WALLETS.RECEIVER.address || DEMO_WALLETS.RECEIVER
      setReceiverAddress(fullReceiverAddress)
      setAddressError('')
    } else if (type === 'DEMO_OWNER') {
      const fullOwnerAddress = DEMO_WALLETS.OWNER.address || DEMO_WALLETS.OWNER
      setReceiverAddress(fullOwnerAddress)
      setAddressError('')
    }
  }

  // Step 4: Secure & Process
  const handleProcessFile = async () => {
    // Validations
    if (!confidentialFile) {
      setErrorMessage('Please select a confidential file to secure.')
      return
    }
    if (!carrierImage) {
      setErrorMessage('Please select a carrier image to hide the encrypted file inside.')
      return
    }

    const fullReceiver = Web3Service.extractAddress(receiverAddress)
    if (!fullReceiver || fullReceiver.includes('...') || !Web3Service.isValidAddress(fullReceiver)) {
      setErrorMessage('Please enter a valid authorized receiver Ethereum wallet address (Must be 42 characters starting with 0x).')
      return
    }

    // Capacity Check
    if (carrierCapacity && confidentialFile.size > carrierCapacity.capacityBytes) {
      setErrorMessage(
        `Carrier image capacity exceeded! Confidential file is ${(confidentialFile.size / 1024).toFixed(1)} KB, ` +
        `but carrier image capacity is only ${(carrierCapacity.capacityBytes / 1024).toFixed(1)} KB. Please select a larger image.`
      )
      return
    }

    setIsProcessing(true)
    setErrorMessage('')
    setExecutionLogs([])
    setProcessingStage(1)

    // Simulated visual step progression for smooth UX feedback while backend computes
    const logSteps = [
      { stage: 1, label: 'Confidential file loaded and validated' },
      { stage: 2, label: 'AES-256 encryption initialized with random key & IV' },
      { stage: 3, label: 'SHA-256 cryptographic file integrity hash generated' },
      { stage: 4, label: 'Packaging LSB steganographic payload' },
      { stage: 5, label: 'Hiding encrypted bits inside 24-bit RGB carrier pixels' },
      { stage: 6, label: 'Stego PNG generated & uploading to IPFS network' },
      { stage: 7, label: 'IPFS CID generated & recording access permissions on blockchain' },
      { stage: 8, label: 'Smart contract verified and secure access link generated' }
    ]

    let stepTimer = 0
    const intervals = []
    logSteps.forEach((s, idx) => {
      stepTimer += 350
      const t = setTimeout(() => {
        setProcessingStage(s.stage)
        setExecutionLogs(prev => [...prev, s.label])
      }, stepTimer)
      intervals.push(t)
    })

    const formData = new FormData()
    formData.append('file', confidentialFile)
    formData.append('coverImage', carrierImage)
    formData.append('receiverAddress', fullReceiver)
    const ownerAddr = wallet?.isMetaMask 
      ? wallet.address 
      : (wallet?.address === DEMO_WALLETS.ATTACKER.address ? DEMO_WALLETS.OWNER.address : (wallet?.address || DEMO_WALLETS.OWNER.address))
    formData.append('ownerAddress', ownerAddr)


    try {
      const result = await api.processFile(formData)
      intervals.forEach(clearTimeout)
      setProcessingStage(8)
      setTimeout(() => {
        setIsProcessing(false)
        onProcessingComplete(result)
      }, 600)
    } catch (err) {
      intervals.forEach(clearTimeout)
      setIsProcessing(false)
      setErrorMessage(err.message || 'Failed to process file.')
    }
  }

  return (
    <div className="share-page-container">
      {/* Page Header */}
      <div className="page-header-row">
        <div>
          <div className="badge badge-cyan mb-2">
            <Lock size={12} />
            <span>Confidential Asset Packaging</span>
          </div>
          <h1 className="page-title">Share Confidential File</h1>
          <p className="page-subtitle">
            Encrypt your secret file with AES-256, hide it inside an innocent carrier image, 
            pin it to IPFS, and restrict access to a designated Web3 wallet.
          </p>
        </div>
      </div>

      {errorMessage && (
        <div className="alert-box alert-error glass-card">
          <AlertTriangle size={18} />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* Main Form Grid */}
      <div className="share-workflow-grid">
        {/* Left Column: Upload Inputs */}
        <div className="workflow-left-col">

          {/* STEP 1: Select Confidential File */}
          <div className="workflow-step-card glass-card">
            <div className="step-card-header">
              <div className="step-number-circle">1</div>
              <div>
                <h3 className="step-card-title">Select Confidential File</h3>
                <p className="step-card-hint">Any document, archive, pdf, or code (will be AES-256 encrypted)</p>
              </div>
            </div>

            {!confidentialFile ? (
              <div 
                className="dropzone-area"
                onClick={() => fileInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault()
                  if (e.dataTransfer.files?.[0]) {
                    setConfidentialFile(e.dataTransfer.files[0])
                  }
                }}
              >
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  style={{ display: 'none' }} 
                />
                <div className="dropzone-icon-box">
                  <Upload size={24} className="text-cyan" />
                </div>
                <span className="dropzone-main-text">Drag & drop your confidential file here</span>
                <span className="dropzone-sub-text">or browse from your device</span>
                <button type="button" className="btn-secondary btn-sm mt-3">
                  Choose File
                </button>
              </div>
            ) : (
              <div className="selected-file-card">
                <div className="selected-file-icon">
                  <FileText size={24} className="text-cyan" />
                </div>
                <div className="selected-file-details">
                  <span className="selected-file-name">{confidentialFile.name}</span>
                  <div className="selected-file-meta">
                    <span className="badge badge-cyan">{(confidentialFile.size / 1024).toFixed(2)} KB</span>
                    <span className="file-mime-text">{confidentialFile.type || 'Binary File'}</span>
                  </div>
                </div>
                <button className="remove-file-btn" onClick={handleRemoveFile} title="Remove File">
                  <Trash2 size={16} />
                </button>
              </div>
            )}
          </div>

          {/* STEP 2: Select Carrier Image */}
          <div className="workflow-step-card glass-card">
            <div className="step-card-header">
              <div className="step-number-circle">2</div>
              <div>
                <h3 className="step-card-title">Select Carrier Image</h3>
                <p className="step-card-hint">PNG image that will hide the encrypted bits inside its pixels</p>
              </div>
            </div>

            {!carrierImage ? (
              <div 
                className="dropzone-area"
                onClick={() => imageInputRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault()
                  if (e.dataTransfer.files?.[0]) {
                    handleImageChange({ target: { files: e.dataTransfer.files } })
                  }
                }}
              >
                <input 
                  type="file" 
                  accept="image/png, image/jpeg, image/webp" 
                  ref={imageInputRef} 
                  onChange={handleImageChange} 
                  style={{ display: 'none' }} 
                />
                <div className="dropzone-icon-box bg-purple-dim">
                  <ImageIcon size={24} className="text-purple" />
                </div>
                <span className="dropzone-main-text">Select carrier image (PNG recommended)</span>
                <span className="dropzone-sub-text">Higher resolution allows hiding larger files</span>
                <button type="button" className="btn-secondary btn-sm mt-3">
                  Choose Carrier Image
                </button>
              </div>
            ) : (
              <div className="selected-carrier-container">
                <div className="carrier-preview-wrapper">
                  <img src={carrierPreview} alt="Carrier preview" className="carrier-img-preview" />
                  <button className="carrier-replace-btn" onClick={handleRemoveImage}>
                    <RefreshCw size={14} />
                    <span>Replace</span>
                  </button>
                </div>

                <div className="carrier-meta-box">
                  <div className="carrier-meta-row">
                    <span className="carrier-meta-label">Dimensions:</span>
                    <span className="mono">{carrierCapacity?.width} x {carrierCapacity?.height} px</span>
                  </div>
                  <div className="carrier-meta-row">
                    <span className="carrier-meta-label">Steganographic Capacity:</span>
                    <span className="mono text-emerald">
                      {(carrierCapacity?.capacityBytes / 1024).toFixed(1)} KB Available
                    </span>
                  </div>
                  {confidentialFile && carrierCapacity && (
                    <div className="capacity-bar-wrapper">
                      <div className="capacity-bar-labels">
                        <span>Payload Size: {(confidentialFile.size / 1024).toFixed(1)} KB</span>
                        <span>{Math.min(100, Math.round((confidentialFile.size / carrierCapacity.capacityBytes) * 100))}% used</span>
                      </div>
                      <div className="capacity-progress-track">
                        <div 
                          className="capacity-progress-fill" 
                          style={{ width: `${Math.min(100, (confidentialFile.size / carrierCapacity.capacityBytes) * 100)}%` }}
                        ></div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* STEP 3: Receiver Authorization */}
          <div className="workflow-step-card glass-card">
            <div className="step-card-header">
              <div className="step-number-circle">3</div>
              <div>
                <h3 className="step-card-title">Receiver Authorization</h3>
                <p className="step-card-hint">Designate the Ethereum wallet address permitted to decrypt this file</p>
              </div>
            </div>

            <div className="wallet-input-group">
              <label className="input-field-label">Authorized Receiver Wallet Address</label>
              <div className="input-with-icon">
                <KeyRound size={18} className="input-icon text-muted" />
                <input 
                  type="text"
                  placeholder="0x1234567890abcdef1234567890abcdef12345678"
                  value={receiverAddress}
                  onChange={handleAddressChange}
                  className="mono text-input full-width"
                />
              </div>

              {addressError && (
                <span className="input-error-msg">{addressError}</span>
              )}

              {/* Quick Fill Helpers */}
              <div className="quick-fill-row">
                <span className="quick-fill-label">Quick Fill:</span>
                {wallet && (
                  <button 
                    type="button" 
                    className="quick-fill-btn"
                    onClick={() => handleQuickFillReceiver('CONNECTED')}
                  >
                    My Wallet ({Web3Service.shortenAddress(wallet.address, 3)})
                  </button>
                )}
                <button 
                  type="button" 
                  className="quick-fill-btn"
                  onClick={() => handleQuickFillReceiver('DEMO_RECEIVER')}
                >
                  Test Receiver Account #1
                </button>
                <button 
                  type="button" 
                  className="quick-fill-btn"
                  onClick={() => handleQuickFillReceiver('DEMO_OWNER')}
                >
                  Test Owner Account #0
                </button>
              </div>
            </div>
          </div>

        </div>

        {/* Right Column: Execution & Summary Card */}
        <div className="workflow-right-col">
          <div className="summary-sticky-card glass-card">
            <div className="summary-card-header">
              <ShieldCheck size={22} className="text-cyan" />
              <h3 className="summary-title">Security Summary</h3>
            </div>

            <div className="summary-list">
              <div className="summary-item">
                <span className="summary-label">Confidential File:</span>
                <span className="summary-val">{confidentialFile ? confidentialFile.name : 'Not selected'}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Carrier Image:</span>
                <span className="summary-val">{carrierImage ? carrierImage.name : 'Not selected'}</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Target Receiver:</span>
                <span className="summary-val mono">
                  {receiverAddress ? Web3Service.shortenAddress(receiverAddress, 5) : 'Not specified'}
                </span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Storage Target:</span>
                <span className="summary-val">IPFS Decentralized Network</span>
              </div>
              <div className="summary-item">
                <span className="summary-label">Access Policy:</span>
                <span className="summary-val">Smart Contract Enforced</span>
              </div>
            </div>

            <div className="divider-line"></div>

            {/* Action Button */}
            <button 
              className={`btn-primary full-width secure-action-btn ${isProcessing ? 'btn-disabled' : ''}`}
              onClick={handleProcessFile}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 size={18} className="spin-icon" />
                  <span>Processing StegoShare Protocol...</span>
                </>
              ) : (
                <>
                  <Sparkles size={18} />
                  <span>Secure & Process File</span>
                </>
              )}
            </button>

            {/* Real-time Progress Timeline during processing */}
            {isProcessing && (
              <div className="processing-progress-box">
                <span className="progress-header-text">Live Cryptographic Execution:</span>
                <div className="execution-logs-list">
                  {executionLogs.map((log, i) => (
                    <div key={i} className="execution-log-item">
                      <CheckCircle size={14} className="text-emerald" />
                      <span>{log}</span>
                    </div>
                  ))}
                  <div className="execution-log-item current-step">
                    <Loader2 size={14} className="spin-icon text-cyan" />
                    <span>Executing pipeline stage {processingStage} of 8...</span>
                  </div>
                </div>
              </div>
            )}

            <div className="security-notice-box">
              <Lock size={14} className="text-muted" />
              <span>Original unencrypted file is never permanently retained on the server.</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
