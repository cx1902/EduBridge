const express = require('express')
const router = express.Router()
const { authenticate } = require('../middleware/auth.middleware')
const uploadController = require('../controllers/upload.controller')

// Upload route - protected
router.post(
  '/image',
  authenticate,
  uploadController.uploadMiddleware,
  uploadController.uploadImage
)

module.exports = router
