import React from 'react'
import { Shield, Lock, ExternalLink } from 'lucide-react'

export default function Footer({ onOpenModal }) {
  return (
    <footer className="footer-container">
      <div className="footer-content">
        {/* Left Brand */}
        <div className="footer-brand">
          <div className="footer-logo">
            <Shield className="logo-icon-sm" />
            <span className="footer-title">Stego<span className="brand-accent">Share</span></span>
          </div>
          <p className="footer-tagline">
            Decentralized Zero-Trust File Security using Blockchain & Image Steganography.
          </p>
        </div>

        {/* Footer Navigation Links */}
        <div className="footer-links-group">
          <button className="footer-link-btn" onClick={() => onOpenModal('privacy')}>
            Privacy Policy
          </button>
          <button className="footer-link-btn" onClick={() => onOpenModal('terms')}>
            Terms of Service
          </button>
          <button className="footer-link-btn" onClick={() => onOpenModal('audit')}>
            Security Audit
          </button>
          <button className="footer-link-btn" onClick={() => onOpenModal('compliance')}>
            Compliance
          </button>
        </div>
      </div>

      <div className="footer-bottom">
        <p className="footer-copyright">
          © 2026 StegoShare. Securely Protected.
        </p>
        <div className="footer-security-pill">
          <span className="pulse-dot pulse-dot-emerald"></span>
          <span className="mono">Network Status: Operational</span>
        </div>
      </div>
    </footer>
  )
}
