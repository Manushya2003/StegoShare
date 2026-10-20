import React from 'react'
import { Lock, EyeOff, Database, ShieldCheck, KeyRound, ChevronRight } from 'lucide-react'

export default function ProtocolSection() {
  const steps = [
    {
      num: '01',
      title: 'Encryption',
      icon: Lock,
      color: 'cyan',
      tag: 'AES-256-CBC',
      desc: 'Confidential files are protected using AES-256 encryption with a randomly generated 32-byte key before processing.'
    },
    {
      num: '02',
      title: 'Steganography',
      icon: EyeOff,
      color: 'purple',
      tag: 'LSB Embedding',
      desc: 'Encrypted ciphertext and integrity hash are embedded invisibly inside the RGB pixel channels of a carrier image.'
    },
    {
      num: '03',
      title: 'IPFS Storage',
      icon: Database,
      color: 'blue',
      tag: 'CIDv1 Pinning',
      desc: 'The generated stego image is pinned on decentralized IPFS storage infrastructure for immutable content retrieval.'
    },
    {
      num: '04',
      title: 'Blockchain',
      icon: ShieldCheck,
      color: 'amber',
      tag: 'Solidity Contract',
      desc: 'Smart contracts record file metadata and enforce cryptographic wallet-based access permissions on-chain.'
    },
    {
      num: '05',
      title: 'Secure Access',
      icon: KeyRound,
      color: 'emerald',
      tag: 'Verified Recovery',
      desc: 'Only authorized wallet addresses can retrieve the stego image, extract payload, verify SHA-256 hash, and decrypt.'
    }
  ]

  return (
    <section className="protocol-section">
      <div className="section-header-center">
        <span className="badge badge-cyan">Architecture & Pipeline</span>
        <h2 className="section-title">The StegoShare Protocol</h2>
        <p className="section-subtitle">
          An end-to-end multi-layered security protocol bridging cryptography, steganography, 
          decentralized storage, and blockchain access control.
        </p>
      </div>

      <div className="protocol-timeline-container">
        {/* Horizontal Connector Line */}
        <div className="timeline-connector-bar"></div>

        <div className="protocol-steps-grid">
          {steps.map((step, idx) => {
            const Icon = step.icon
            return (
              <div key={idx} className="protocol-step-card glass-card">
                <div className="step-badge-row">
                  <span className={`step-number-tag bg-${step.color}-glow`}>
                    {step.num}
                  </span>
                  <span className={`badge badge-${step.color}`}>
                    {step.tag}
                  </span>
                </div>

                <div className={`step-icon-wrapper icon-box-${step.color}`}>
                  <Icon size={24} />
                </div>

                <h3 className="step-card-title">{step.title}</h3>
                <p className="step-card-desc">{step.desc}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}
