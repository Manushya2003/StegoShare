import React, { useState } from 'react'
import { 
  CheckCircle, Copy, Check, ExternalLink, Download, ArrowRight, 
  ShieldCheck, Share2, Database, KeyRound, Lock, FileText, Hash 
} from 'lucide-react'
import { api } from '../services/api'

export default function SecuredStatusPage({ result, setActivePage, setAccessFileId }) {
  const [copiedField, setCopiedField] = useState(null)
  const [linkCopied, setLinkCopied] = useState(false)

  if (!result) {
    return (
      <div className="secured-empty-state glass-card">
        <ShieldCheck size={48} className="text-cyan mb-3" />
        <h2>No Secured Asset Found</h2>
        <p>Please process a confidential file first to view cryptographic artifacts.</p>
        <button className="btn-primary mt-4" onClick={() => setActivePage('share')}>
          Share a File
        </button>
      </div>
    )
  }

  const {
    fileId,
    ipfsCid,
    txHash,
    fileHash,
    shareLink,
    originalFileName,
    fileSize,
    mimeType,
    stegoFileName,
    ownerAddress,
    authorizedReceiver,
    executionLogs
  } = result

  const handleCopy = async (text, fieldName) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedField(fieldName)
      setTimeout(() => setCopiedField(null), 2000)
    } catch (err) {
      console.error(err)
    }
  }

  const handleCopyShareLink = async () => {
    try {
      await navigator.clipboard.writeText(shareLink)
      setLinkCopied(true)
      setTimeout(() => setLinkCopied(false), 2500)
    } catch (err) {
      console.error(err)
    }
  }

  const handleOpenInAccessPortal = () => {
    setAccessFileId(fileId)
    setActivePage('access')
  }

  const handleDownloadStego = () => {
    const url = api.getStegoDownloadUrl(fileId)
    window.open(url, '_blank')
  }

  return (
    <div className="secured-page-container">
      {/* Top Secured Confirmation Banner */}
      <div className="secured-banner-card glass-card">
        <div className="secured-header-row">
          <div className="secured-title-group">
            <div className="secured-shield-glow">
              <ShieldCheck size={36} className="text-emerald" />
            </div>
            <div>
              <div className="badge-row mb-1">
                <span className="badge badge-emerald">
                  <span className="pulse-dot pulse-dot-emerald"></span>
                  SECURED
                </span>
                <span className="badge badge-cyan">IPFS Pinned</span>
                <span className="badge badge-purple">On-Chain Access</span>
              </div>
              <h1 className="secured-main-title">Asset Secured</h1>
              <p className="secured-subtitle">
                Your confidential file has been successfully encrypted, hidden inside a carrier image, 
                stored on decentralized storage, and protected with blockchain-based access control.
              </p>
            </div>
          </div>
        </div>

        {/* Secure Share Link Box */}
        <div className="share-link-banner-box">
          <div className="share-link-info">
            <Share2 size={20} className="text-cyan" />
            <div>
              <span className="share-link-label">Secure Access Link (Share with Designated Receiver):</span>
              <span className="mono share-link-text">{shareLink}</span>
            </div>
          </div>
          <button 
            className={`btn-cyan copy-link-main-btn ${linkCopied ? 'btn-copied' : ''}`}
            onClick={handleCopyShareLink}
          >
            {linkCopied ? (
              <>
                <Check size={16} />
                <span>Link Copied!</span>
              </>
            ) : (
              <>
                <Copy size={16} />
                <span>Copy Secure Link</span>
              </>
            )}
          </button>
        </div>

        {linkCopied && (
          <div className="copy-success-toast">
            <CheckCircle size={14} className="text-emerald" />
            <span>Secure share link copied to clipboard. Send this to the authorized wallet holder!</span>
          </div>
        )}
      </div>

      <div className="secured-content-grid">
        {/* Left Column: Cryptographic Artifacts Cards */}
        <div className="artifacts-col">
          <div className="section-subheading">
            <Lock size={18} className="text-cyan" />
            <h3>Cryptographic & Blockchain Artifacts</h3>
          </div>

          <div className="artifacts-cards-grid">
            {/* IPFS CID Card */}
            <div className="artifact-card glass-card">
              <div className="artifact-header">
                <div className="artifact-icon-title">
                  <Database size={16} className="text-blue" />
                  <span className="artifact-title">IPFS CID</span>
                </div>
                <button 
                  className="artifact-copy-btn" 
                  onClick={() => handleCopy(ipfsCid, 'cid')}
                  title="Copy CID"
                >
                  {copiedField === 'cid' ? <span className="copied-text"><Check size={12} /> Copied!</span> : <Copy size={14} />}
                </button>
              </div>
              <p className="artifact-desc">Decentralized Content Identifier for the carrier stego image</p>
              <div className="artifact-value-box">
                <span className="mono artifact-value">{ipfsCid}</span>
              </div>
            </div>

            {/* Transaction Hash Card */}
            <div className="artifact-card glass-card">
              <div className="artifact-header">
                <div className="artifact-icon-title">
                  <Hash size={16} className="text-purple" />
                  <span className="artifact-title">Transaction Hash</span>
                </div>
                <button 
                  className="artifact-copy-btn" 
                  onClick={() => handleCopy(txHash, 'tx')}
                  title="Copy Tx Hash"
                >
                  {copiedField === 'tx' ? <span className="copied-text"><Check size={12} /> Copied!</span> : <Copy size={14} />}
                </button>
              </div>
              <p className="artifact-desc">Immutable smart contract access registration receipt</p>
              <div className="artifact-value-box">
                <span className="mono artifact-value">{txHash}</span>
              </div>
            </div>

            {/* Unique File ID Card */}
            <div className="artifact-card glass-card">
              <div className="artifact-header">
                <div className="artifact-icon-title">
                  <FileText size={16} className="text-cyan" />
                  <span className="artifact-title">File ID</span>
                </div>
                <button 
                  className="artifact-copy-btn" 
                  onClick={() => handleCopy(fileId, 'fileId')}
                  title="Copy File ID"
                >
                  {copiedField === 'fileId' ? <span className="copied-text"><Check size={12} /> Copied!</span> : <Copy size={14} />}
                </button>
              </div>
              <p className="artifact-desc">Unique asset identifier across StegoShare decentralized ledger</p>
              <div className="artifact-value-box">
                <span className="mono artifact-value">{fileId}</span>
              </div>
            </div>

            {/* SHA-256 Hash Card */}
            <div className="artifact-card glass-card">
              <div className="artifact-header">
                <div className="artifact-icon-title">
                  <ShieldCheck size={16} className="text-emerald" />
                  <span className="artifact-title">SHA-256 Integrity Hash</span>
                </div>
                <button 
                  className="artifact-copy-btn" 
                  onClick={() => handleCopy(fileHash, 'hash')}
                  title="Copy SHA-256 Hash"
                >
                  {copiedField === 'hash' ? <span className="copied-text"><Check size={12} /> Copied!</span> : <Copy size={14} />}
                </button>
              </div>
              <p className="artifact-desc">Cryptographic fingerprint for zero-trust tamper verification</p>
              <div className="artifact-value-box">
                <span className="mono artifact-value">{fileHash}</span>
              </div>
            </div>
          </div>

          {/* Access Policy Card */}
          <div className="policy-details-card glass-card mt-4">
            <h4 className="policy-card-title">Enforced Blockchain Access Policy</h4>
            <div className="policy-table">
              <div className="policy-row">
                <span className="policy-key">Asset Owner:</span>
                <span className="mono policy-val">{ownerAddress}</span>
              </div>
              <div className="policy-row">
                <span className="policy-key">Authorized Receiver:</span>
                <span className="mono policy-val text-cyan">{authorizedReceiver}</span>
              </div>
              <div className="policy-row">
                <span className="policy-key">Original Asset:</span>
                <span className="policy-val">{originalFileName} ({(fileSize / 1024).toFixed(2)} KB)</span>
              </div>
              <div className="policy-row">
                <span className="policy-key">Stego Asset:</span>
                <span className="policy-val">{stegoFileName}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Execution Log & Navigation Actions */}
        <div className="logs-col">
          <div className="section-subheading">
            <CheckCircle size={18} className="text-emerald" />
            <h3>Execution Log Timeline</h3>
          </div>

          <div className="execution-timeline-card glass-card">
            <div className="timeline-steps-list">
              <div className="timeline-step-item completed">
                <div className="timeline-check-circle">
                  <Check size={12} />
                </div>
                <div className="timeline-step-info">
                  <span className="timeline-step-name">File Selected</span>
                  <span className="timeline-step-sub">{originalFileName}</span>
                </div>
              </div>

              <div className="timeline-step-item completed">
                <div className="timeline-check-circle">
                  <Check size={12} />
                </div>
                <div className="timeline-step-info">
                  <span className="timeline-step-name">AES Encryption Completed</span>
                  <span className="timeline-step-sub">AES-256-CBC cipher initialized</span>
                </div>
              </div>

              <div className="timeline-step-item completed">
                <div className="timeline-check-circle">
                  <Check size={12} />
                </div>
                <div className="timeline-step-info">
                  <span className="timeline-step-name">File Hash Generated</span>
                  <span className="timeline-step-sub mono">{fileHash.substring(0, 16)}...</span>
                </div>
              </div>

              <div className="timeline-step-item completed">
                <div className="timeline-check-circle">
                  <Check size={12} />
                </div>
                <div className="timeline-step-info">
                  <span className="timeline-step-name">Data Hidden Using Steganography</span>
                  <span className="timeline-step-sub">Embedded in 24-bit RGB pixel LSBs</span>
                </div>
              </div>

              <div className="timeline-step-item completed">
                <div className="timeline-check-circle">
                  <Check size={12} />
                </div>
                <div className="timeline-step-info">
                  <span className="timeline-step-name">Uploaded to IPFS</span>
                  <span className="timeline-step-sub mono">{ipfsCid.substring(0, 18)}...</span>
                </div>
              </div>

              <div className="timeline-step-item completed">
                <div className="timeline-check-circle">
                  <Check size={12} />
                </div>
                <div className="timeline-step-info">
                  <span className="timeline-step-name">Blockchain Access Granted</span>
                  <span className="timeline-step-sub">Recorded on Smart Contract</span>
                </div>
              </div>

              <div className="timeline-step-item completed">
                <div className="timeline-check-circle">
                  <Check size={12} />
                </div>
                <div className="timeline-step-info">
                  <span className="timeline-step-name">Secure Link Generated</span>
                  <span className="timeline-step-sub">/access/{fileId}</span>
                </div>
              </div>
            </div>

            <div className="timeline-action-buttons mt-4">
              <button className="btn-primary full-width mb-2" onClick={handleOpenInAccessPortal}>
                <span>Test Access in Portal</span>
                <ArrowRight size={16} />
              </button>

              <button className="btn-secondary full-width mb-2" onClick={handleDownloadStego}>
                <Download size={16} />
                <span>Download Stego PNG</span>
              </button>

              <button className="btn-outline full-width" onClick={() => setActivePage('share')}>
                <span>Share Another File</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
