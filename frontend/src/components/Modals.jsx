import React from 'react'
import { X, ShieldCheck, FileText, CheckCircle2, Lock } from 'lucide-react'

export default function Modals({ modalType, onClose }) {
  if (!modalType) return null

  const content = {
    privacy: {
      title: 'StegoShare Privacy Policy',
      badge: 'Zero-Knowledge Protocol',
      icon: ShieldCheck,
      sections: [
        {
          heading: '1. Zero-Storage Architecture',
          body: 'StegoShare does not store plaintext confidential files on centralized servers. Once encrypted via AES-256 and embedded into carrier images, all raw temporary uploaded files are immediately unlinked from disk.'
        },
        {
          heading: '2. Cryptographic Access Control',
          body: 'Decryption keys and payload extraction parameters are protected by Solidity smart-contract logic and public/private key cryptography.'
        },
        {
          heading: '3. IPFS Content Addressing',
          body: 'Assets are stored on decentralized IPFS network as opaque steganographic images. Content cannot be linked to plaintext contents without authorization.'
        }
      ]
    },
    terms: {
      title: 'Terms of Service',
      badge: 'Decentralized Service',
      icon: FileText,
      sections: [
        {
          heading: '1. Usage License',
          body: 'StegoShare is provided as an open-source decentralized file security protocol for authorized data sharing, research, and enterprise confidentiality.'
        },
        {
          heading: '2. Wallet Responsibility',
          body: 'Users are solely responsible for safeguarding their Web3 wallet private keys and verifying receiver addresses before registering file access permissions on the blockchain.'
        }
      ]
    },
    audit: {
      title: 'Security Audit & Verification',
      badge: 'Audited Architecture',
      icon: Lock,
      sections: [
        {
          heading: 'Cryptographic Algorithms',
          body: 'Implementation follows NIST FIPS 197 standard for AES-256-CBC, with 128-bit CSPRNG IVs and SHA-256 integrity verification.'
        },
        {
          heading: 'Steganography Resilience',
          body: '24-bit RGB Least Significant Bit embedding preserves PNG pixel structures without lossy compression degradation.'
        },
        {
          heading: 'Smart Contract Verification',
          body: 'Access control smart contract enforces strict modifier checks (onlyFileOwner, fileMustExist) preventing unauthorized state mutation.'
        }
      ]
    },
    compliance: {
      title: 'Compliance & Standards',
      badge: 'SOC2 & GDPR Aligned',
      icon: CheckCircle2,
      sections: [
        {
          heading: 'Data Sovereignty',
          body: 'Users maintain full custody of encryption material and can revoke access permissions at any time via on-chain transactions.'
        },
        {
          heading: 'Immutable Audit Trail',
          body: 'Every file registration and access modification emits indexed Ethereum events for auditable compliance reporting.'
        }
      ]
    }
  }

  const active = content[modalType] || content.privacy
  const Icon = active.icon

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-container glass-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title-group">
            <div className="icon-box-cyan modal-icon">
              <Icon size={20} />
            </div>
            <div>
              <h3 className="modal-title">{active.title}</h3>
              <span className="badge badge-cyan">{active.badge}</span>
            </div>
          </div>
          <button className="modal-close-btn" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        <div className="modal-body">
          {active.sections.map((sec, i) => (
            <div key={i} className="modal-section-item">
              <h4 className="modal-sec-heading">{sec.heading}</h4>
              <p className="modal-sec-body">{sec.body}</p>
            </div>
          ))}
        </div>

        <div className="modal-footer">
          <button className="btn-secondary" onClick={onClose}>
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
