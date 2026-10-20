require('dotenv').config()
const express = require('express')
const cors = require('cors')
const path = require('path')
const fs = require('fs')

const fileRoutes = require('./routes/fileRoutes')
const ipfsService = require('./services/ipfsService')
const fileController = require('./controllers/fileController')

const app = express()
const PORT = process.env.PORT || 5000

// =====================================================
// Middleware
// =====================================================
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-wallet-address']
}))

app.use(express.json({ limit: '50mb' }))
app.use(express.urlencoded({ extended: true, limit: '50mb' }))

// Create required runtime directories
const requiredDirs = [
  path.join(__dirname, 'uploads'),
  path.join(__dirname, 'encrypted'),
  path.join(__dirname, 'stego'),
  path.join(__dirname, 'recovered'),
  path.join(__dirname, 'ipfs'),
  path.join(__dirname, 'data')
]

requiredDirs.forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true })
  }
})

// =====================================================
// Routes
// =====================================================

// API Routes
app.use('/api', fileRoutes)

// Legacy upload compatibility route
app.post('/upload', (req, res, next) => {
  fileRoutes(req, res, next)
})

// IPFS Gateway Endpoint
app.get('/ipfs/:cid', (req, res) => {
  const { cid } = req.params
  const cachedPath = ipfsService.getCachedPath(cid)

  if (cachedPath && fs.existsSync(cachedPath)) {
    res.setHeader('Content-Type', 'image/png')
    res.setHeader('Cache-Control', 'public, max-age=31536000')
    return res.sendFile(cachedPath)
  }

  return res.status(404).json({
    success: false,
    message: `IPFS CID "${cid}" not found on this gateway.`
  })
})

// Stego direct download endpoint
app.get('/download-stego/:fileName', (req, res) => {
  return fileController.downloadStegoImage(req, res)
})

// Health & Status
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    service: 'StegoShare Security Engine',
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  })
})

app.get('/', (req, res) => {
  res.json({
    name: 'StegoShare Backend API',
    status: 'online',
    version: '1.0.0',
    endpoints: {
      process: 'POST /api/process',
      fileInfo: 'GET /api/files/:fileId',
      verifyAccess: 'POST /api/files/:fileId/verify-access',
      recover: 'POST /api/files/:fileId/recover',
      ipfsGateway: 'GET /ipfs/:cid',
      stats: 'GET /api/stats'
    }
  })
})

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('[StegoShare Server Error]:', err)
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined
  })
})

// Start Server
app.listen(PORT, () => {
  console.log(`====================================================`)
  console.log(`🔐 StegoShare Security Backend Engine`)
  console.log(`🚀 Running on http://localhost:${PORT}`)
  console.log(`🌐 IPFS Local Gateway ready at http://localhost:${PORT}/ipfs/`)
  console.log(`====================================================`)
})