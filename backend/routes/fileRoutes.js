const express = require('express')
const multer = require('multer')
const path = require('path')
const fileController = require('../controllers/fileController')

const router = express.Router()

const uploadsDir = path.join(__dirname, '..', 'uploads')
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}-${file.originalname}`
    cb(null, unique)
  }
})

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 } // 50MB
})

const uploadFields = upload.fields([
  { name: 'file', maxCount: 1 },
  { name: 'coverImage', maxCount: 1 },
  { name: 'carrierImage', maxCount: 1 }
])

// Process & Secure File
router.post('/process', uploadFields, (req, res) => fileController.processFile(req, res))

// Legacy upload compatibility route
router.post('/upload', uploadFields, (req, res) => fileController.processFile(req, res))

// File metadata & Access control
router.get('/files', (req, res) => fileController.getAllFiles(req, res))
router.get('/files/:fileId', (req, res) => fileController.getFileInfo(req, res))
router.post('/files/:fileId/verify-access', (req, res) => fileController.verifyAccess(req, res))
router.post('/files/:fileId/recover', (req, res) => fileController.extractAndRecover(req, res))
router.get('/files/:fileId/verify-integrity', (req, res) => fileController.verifyFileIntegrity(req, res))
router.post('/files/:fileId/verify-integrity', (req, res) => fileController.verifyFileIntegrity(req, res))
router.get('/files/:fileId/download-recovered', (req, res) => fileController.downloadRecoveredFile(req, res))
router.get('/files/:fileId/download-stego', (req, res) => fileController.downloadStegoImage(req, res))
router.post('/files/:fileId/revoke', (req, res) => fileController.revokeAccess(req, res))
router.post('/files/:fileId/restore', (req, res) => fileController.restoreAccess(req, res))

// Dashboard stats
router.get('/stats', (req, res) => fileController.getStats(req, res))

module.exports = router
