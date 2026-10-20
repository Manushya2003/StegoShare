import React, { useState } from 'react'
import { Shield, Lock, Wallet, ChevronDown, Check, Copy, LogOut, Cpu, AlertCircle } from 'lucide-react'
import { Web3Service, DEMO_WALLETS } from '../services/web3'

export default function Navbar({ activePage, setActivePage, wallet, setWallet }) {
  const [dropdownOpen, setDropdownOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  const handleConnectMetaMask = async () => {
    setIsConnecting(true)
    setErrorMsg('')
    try {
      const res = await Web3Service.connectMetaMask()
      setWallet({
        address: res.address,
        network: res.networkName,
        isMetaMask: true
      })
      setDropdownOpen(false)
    } catch (err) {
      setErrorMsg(err.message)
      // Auto open demo wallet selector if MetaMask is not installed
      setDropdownOpen(true)
    } finally {
      setIsConnecting(false)
    }
  }

  const handleSelectDemoWallet = (demoKey) => {
    const selected = DEMO_WALLETS[demoKey]
    setWallet({
      address: selected.address,
      name: selected.name,
      role: selected.role,
      network: 'Hardhat Localhost (31337)',
      isMetaMask: false
    })
    setDropdownOpen(false)
    setErrorMsg('')
  }

  const handleDisconnect = () => {
    setWallet(null)
    setDropdownOpen(false)
  }

  const handleCopyAddress = async () => {
    if (!wallet?.address) return
    try {
      await navigator.clipboard.writeText(wallet.address)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <header className="navbar-container">
      <div className="navbar-content">
        {/* Brand / Logo */}
        <div className="navbar-brand" onClick={() => setActivePage('home')}>
          <div className="logo-icon-wrapper">
            <Shield className="logo-icon" />
          </div>
          <span className="brand-title">Stego<span className="brand-accent">Share</span></span>
          <span className="brand-badge">PRO v1.0</span>
        </div>

        {/* Center Navigation */}
        <nav className="navbar-links">
          <button 
            className={`nav-link-btn ${activePage === 'share' ? 'active' : ''}`}
            onClick={() => setActivePage('share')}
          >
            Share
          </button>
          <button 
            className={`nav-link-btn ${activePage === 'access' ? 'active' : ''}`}
            onClick={() => setActivePage('access')}
          >
            Access
          </button>
          <button 
            className={`nav-link-btn ${activePage === 'security' ? 'active' : ''}`}
            onClick={() => {
              setActivePage('home')
              setTimeout(() => {
                const el = document.getElementById('security-features-section')
                if (el) el.scrollIntoView({ behavior: 'smooth' })
              }, 100)
            }}
          >
            Security Features
          </button>
        </nav>

        {/* Right - Wallet Action */}
        <div className="navbar-wallet-wrapper">
          {!wallet ? (
            <div className="wallet-connect-group">
              <button 
                className="btn-primary connect-wallet-btn" 
                onClick={handleConnectMetaMask}
                disabled={isConnecting}
              >
                <Wallet size={16} />
                {isConnecting ? 'Connecting...' : 'Connect Wallet'}
              </button>
              <button 
                className="btn-secondary demo-wallet-toggle"
                onClick={() => setDropdownOpen(!dropdownOpen)}
                title="Select Demo Test Account"
              >
                <ChevronDown size={14} />
              </button>
            </div>
          ) : (
            <div className="wallet-connected-pill">
              <button 
                className="wallet-address-trigger"
                onClick={() => setDropdownOpen(!dropdownOpen)}
              >
                <span className="pulse-dot pulse-dot-emerald"></span>
                <span className="mono wallet-text">
                  {Web3Service.shortenAddress(wallet.address, 4)}
                </span>
                {wallet.role && (
                  <span className="wallet-role-tag">{wallet.role}</span>
                )}
                <ChevronDown size={14} className="dropdown-caret" />
              </button>
            </div>
          )}

          {/* Wallet Dropdown & Switcher */}
          {dropdownOpen && (
            <div className="wallet-dropdown glass-card">
              {wallet ? (
                <div className="dropdown-section">
                  <div className="dropdown-header">
                    <span className="dropdown-label">Connected Wallet</span>
                    <span className="network-badge">{wallet.network || 'Localhost 31337'}</span>
                  </div>

                  <div className="address-display-box">
                    <span className="mono full-address">{wallet.address}</span>
                    <button className="copy-btn-icon" onClick={handleCopyAddress} title="Copy Address">
                      {copied ? <Check size={14} className="text-emerald" /> : <Copy size={14} />}
                    </button>
                  </div>
                  {copied && <span className="copy-feedback">Address copied to clipboard!</span>}

                  <div className="dropdown-divider"></div>
                  <span className="dropdown-subtitle">Switch Test Account:</span>
                </div>
              ) : (
                <div className="dropdown-section">
                  <div className="dropdown-header">
                    <span className="dropdown-label">Wallet Authentication</span>
                  </div>
                  {errorMsg && (
                    <div className="wallet-error-banner">
                      <AlertCircle size={14} />
                      <span>{errorMsg}</span>
                    </div>
                  )}
                  <button className="btn-primary full-width mb-3" onClick={handleConnectMetaMask}>
                    <Wallet size={16} />
                    Connect via MetaMask Extension
                  </button>
                  <div className="dropdown-divider"></div>
                  <span className="dropdown-subtitle">Or Select Local Simulation Account:</span>
                </div>
              )}

              {/* Demo Accounts List */}
              <div className="demo-accounts-list">
                <div 
                  className={`demo-account-item ${wallet?.address?.toLowerCase() === DEMO_WALLETS.OWNER.address.toLowerCase() ? 'active' : ''}`}
                  onClick={() => handleSelectDemoWallet('OWNER')}
                >
                  <div className="account-info">
                    <span className="account-title">👑 Account #0 (File Owner)</span>
                    <span className="mono account-addr">{Web3Service.shortenAddress(DEMO_WALLETS.OWNER.address, 6)}</span>
                  </div>
                  <span className="badge badge-purple">Owner</span>
                </div>

                <div 
                  className={`demo-account-item ${wallet?.address?.toLowerCase() === DEMO_WALLETS.RECEIVER.address.toLowerCase() ? 'active' : ''}`}
                  onClick={() => handleSelectDemoWallet('RECEIVER')}
                >
                  <div className="account-info">
                    <span className="account-title">🎯 Account #1 (Authorized Receiver)</span>
                    <span className="mono account-addr">{Web3Service.shortenAddress(DEMO_WALLETS.RECEIVER.address, 6)}</span>
                  </div>
                  <span className="badge badge-emerald">Receiver</span>
                </div>

                <div 
                  className={`demo-account-item ${wallet?.address?.toLowerCase() === DEMO_WALLETS.ATTACKER.address.toLowerCase() ? 'active' : ''}`}
                  onClick={() => handleSelectDemoWallet('ATTACKER')}
                >
                  <div className="account-info">
                    <span className="account-title">⚠️ Account #2 (Unauthorized User)</span>
                    <span className="mono account-addr">{Web3Service.shortenAddress(DEMO_WALLETS.ATTACKER.address, 6)}</span>
                  </div>
                  <span className="badge badge-rose">Unauthorized</span>
                </div>
              </div>

              {wallet && (
                <div className="dropdown-footer">
                  <button className="disconnect-btn" onClick={handleDisconnect}>
                    <LogOut size={14} />
                    Disconnect Wallet
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </header>
  )
}
