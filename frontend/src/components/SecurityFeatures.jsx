import React from 'react'
import { Lock, EyeOff, Database, Shield, Wallet, CheckCircle2, Cpu, FileCheck } from 'lucide-react'

export default function SecurityFeatures() {
  const features = [
    {
      title: 'AES-256 Encryption',
      desc: 'Protect confidential file contents using high-entropy AES-256 encryption with per-asset unique keys and random initialization vectors.',
      icon: Lock,
      badge: 'FIPS 197 Standard',
      color: 'cyan'
    },
    {
      title: 'Advanced Steganography',
      desc: 'Hide encrypted data directly inside carrier image RGB channels using Least Significant Bit (LSB) encoding without perceptible visual artifacts.',
      icon: EyeOff,
      badge: 'Lossless Embedding',
      color: 'purple'
    },
    {
      title: 'IPFS Decentralization',
      desc: 'Store stego images on decentralized InterPlanetary File System nodes, eliminating single points of failure with content-addressed CIDs.',
      icon: Database,
      badge: 'Immutable Storage',
      color: 'blue'
    },
    {
      title: 'Blockchain Access Control',
      desc: 'Deploy immutable Solidity smart contracts to manage authorized receiver wallet addresses, access logs, and real-time revocation.',
      icon: Shield,
      badge: 'Smart Contract',
      color: 'amber'
    },
    {
      title: 'MetaMask Integration',
      desc: 'Authenticate users using cryptographic Ethereum wallet signatures and address verification for zero-trust identity validation.',
      icon: Wallet,
      badge: 'Web3 Auth',
      color: 'emerald'
    },
    {
      title: 'Tamper Detection',
      desc: 'Verify binary data integrity using SHA-256 cryptographic hashes on recovery to prevent malicious payload modification and MITM attacks.',
      icon: FileCheck,
      badge: 'SHA-256 Verified',
      color: 'rose'
    }
  ]

  return (
    <section id="security-features-section" className="features-section">
      <div className="section-header-center">
        <span className="badge badge-purple">Cryptographic Capabilities</span>
        <h2 className="section-title">Built-In Security Architecture</h2>
        <p className="section-subtitle">
          Engineered to provide end-to-end confidentiality, authenticity, and non-repudiation 
          for sensitive enterprise files and classified communications.
        </p>
      </div>

      <div className="features-grid">
        {features.map((item, idx) => {
          const Icon = item.icon
          return (
            <div key={idx} className="feature-card glass-card">
              <div className="feature-card-header">
                <div className={`feature-icon-box icon-box-${item.color}`}>
                  <Icon size={24} />
                </div>
                <span className={`badge badge-${item.color}`}>{item.badge}</span>
              </div>

              <h3 className="feature-card-title">{item.title}</h3>
              <p className="feature-card-desc">{item.desc}</p>

              <div className="feature-card-footer">
                <span className="feature-status-text">
                  <CheckCircle2 size={14} className="text-emerald" />
                  Active in Engine
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </section>
  )
}
