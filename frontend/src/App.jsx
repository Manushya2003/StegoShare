import { useState, useEffect } from 'react'
import './App.css'
import Navbar from './components/Navbar'
import Hero from './components/Hero'
import ProtocolSection from './components/ProtocolSection'
import SecurityFeatures from './components/SecurityFeatures'
import SharePage from './pages/SharePage'
import SecuredStatusPage from './pages/SecuredStatusPage'
import AccessPage from './pages/AccessPage'
import Footer from './components/Footer'
import Modals from './components/Modals'
import { api } from './services/api'

function App() {
  const [activePage, setActivePage] = useState('home')
  const [wallet, setWallet] = useState(null)
  const [securedResult, setSecuredResult] = useState(null)
  const [accessFileId, setAccessFileId] = useState('')
  const [activeModal, setActiveModal] = useState(null)
  const [stats, setStats] = useState(null)

  // Listen to URL path changes (e.g., /access/:fileId)
  useEffect(() => {
    const handleUrlRoute = () => {
      const pathname = window.location.pathname
      const hash = window.location.hash

      if (pathname.startsWith('/access/')) {
        const fileId = pathname.replace('/access/', '').trim()
        if (fileId) {
          setAccessFileId(fileId)
          setActivePage('access')
        }
      } else if (hash.startsWith('#/access/')) {
        const fileId = hash.replace('#/access/', '').trim()
        if (fileId) {
          setAccessFileId(fileId)
          setActivePage('access')
        }
      }
    }

    handleUrlRoute()
    window.addEventListener('popstate', handleUrlRoute)
    return () => window.removeEventListener('popstate', handleUrlRoute)
  }, [])

  // Listen to MetaMask account / network switches
  useEffect(() => {
    if (typeof window !== 'undefined' && window.ethereum) {
      const handleAccountsChanged = (accounts) => {
        if (!accounts || accounts.length === 0) {
          setWallet(null)
        } else {
          setWallet(prev => ({
            ...(prev || {}),
            address: accounts[0],
            network: prev?.network || 'Hardhat Localhost (31337)',
            isMetaMask: true
          }))
        }
      }

      window.ethereum.on('accountsChanged', handleAccountsChanged)
      return () => {
        if (window.ethereum.removeListener) {
          window.ethereum.removeListener('accountsChanged', handleAccountsChanged)
        }
      }
    }
  }, [])


  // Fetch security metrics
  useEffect(() => {
    api.getStats().then(setStats).catch(() => {})
  }, [activePage])

  const handleProcessingComplete = (result) => {
    setSecuredResult(result)
    setActivePage('secured')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleNavigate = (page) => {
    setActivePage(page)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className="app-container">
      {/* Top Navigation Bar */}
      <Navbar 
        activePage={activePage} 
        setActivePage={handleNavigate}
        wallet={wallet}
        setWallet={setWallet}
      />

      {/* Main Content View */}
      <main className="main-content">
        {activePage === 'home' && (
          <>
            <Hero setActivePage={handleNavigate} stats={stats} />
            <ProtocolSection />
            <SecurityFeatures />
          </>
        )}

        {activePage === 'share' && (
          <SharePage 
            wallet={wallet}
            onProcessingComplete={handleProcessingComplete}
            setActivePage={handleNavigate}
          />
        )}

        {activePage === 'secured' && (
          <SecuredStatusPage 
            result={securedResult}
            setActivePage={handleNavigate}
            setAccessFileId={setAccessFileId}
          />
        )}

        {activePage === 'access' && (
          <AccessPage 
            wallet={wallet}
            setWallet={setWallet}
            accessFileId={accessFileId}
            setAccessFileId={setAccessFileId}
            setActivePage={handleNavigate}
          />
        )}
      </main>

      {/* Footer */}
      <Footer onOpenModal={setActiveModal} />

      {/* Interactive Modals */}
      <Modals modalType={activeModal} onClose={() => setActiveModal(null)} />
    </div>
  )
}

export default App