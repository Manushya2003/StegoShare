import React from 'react'
import { ShieldCheck, ArrowRight, Lock, Key, Cpu, Database, EyeOff, Layers } from 'lucide-react'

export default function Hero({ setActivePage, stats }) {
  return (
    <section className="hero-section">
      {/* Top Security Status Badge */}
      <div className="hero-badge-wrapper">
        <div className="badge badge-emerald hero-badge">
          <span className="pulse-dot pulse-dot-emerald"></span>
          <span>Military-Grade Encryption Active</span>
        </div>
      </div>

      {/* Main Hero Headings */}
      <h1 className="hero-title">
        Secure File Sharing Using <br />
        <span className="text-gradient-hero">Blockchain & Steganography</span>
      </h1>

      {/* Subtitle */}
      <p className="hero-subtitle">
        A decentralized secure file-sharing system designed to encrypt confidential files, 
        hide encrypted data inside images using LSB steganography, store them securely on IPFS, 
        and enforce cryptographically verifiable access control via Solidity smart contracts.
      </p>

      {/* Hero CTA Action Buttons */}
      <div className="hero-actions">
        <button 
          className="btn-primary hero-btn-main"
          onClick={() => setActivePage('share')}
        >
          <span>Share a File</span>
          <ArrowRight size={18} />
        </button>

        <button 
          className="btn-secondary hero-btn-secondary"
          onClick={() => setActivePage('access')}
        >
          <Lock size={18} className="text-cyan" />
          <span>Access Shared File</span>
        </button>
      </div>

      {/* Live Security Metrics Banner */}
      <div className="hero-metrics-grid">
        <div className="metric-card glass-card">
          <div className="metric-icon-box bg-cyan-dim">
            <Lock size={20} className="text-cyan" />
          </div>
          <div className="metric-info">
            <span className="metric-value mono">AES-256-CBC</span>
            <span className="metric-label">Symmetric Cipher</span>
          </div>
        </div>

        <div className="metric-card glass-card">
          <div className="metric-icon-box bg-purple-dim">
            <EyeOff size={20} className="text-purple" />
          </div>
          <div className="metric-info">
            <span className="metric-value mono">24-Bit LSB</span>
            <span className="metric-label">Pixel Steganography</span>
          </div>
        </div>

        <div className="metric-card glass-card">
          <div className="metric-icon-box bg-blue-dim">
            <Database size={20} className="text-blue" />
          </div>
          <div className="metric-info">
            <span className="metric-value mono">IPFS Gateway</span>
            <span className="metric-label">Decentralized Storage</span>
          </div>
        </div>

        <div className="metric-card glass-card">
          <div className="metric-icon-box bg-emerald-dim">
            <Layers size={20} className="text-emerald" />
          </div>
          <div className="metric-info">
            <span className="metric-value mono">Smart Contracts</span>
            <span className="metric-label">Solidity Access Control</span>
          </div>
        </div>
      </div>
    </section>
  )
}
