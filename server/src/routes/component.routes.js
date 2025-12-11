const express = require('express');
const router = express.Router();
const componentController = require('../controllers/component.controller');
const fileController = require('../controllers/file.controller');
const submissionController = require('../controllers/submission.controller');
const { authenticate, authorize } = require('../middleware/auth.middleware');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    // Determine destination based on route
    let uploadPath;
    if (req.baseUrl.includes('/submit')) {
      uploadPath = path.join(__dirname, '../../uploads/submissions');
    } else {
      uploadPath = path.join(__dirname, '../../uploads/course-files');
    }
    
    // Ensure directory exists
    if (!fs.existsSync(uploadPath)) {
      fs.mkdirSync(uploadPath, { recursive: true });
    }
    cb(null, uploadPath);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

// File filter for security
const fileFilter = (req, file, cb) => {
  // Allowed file types
  const allowedTypes = [
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.ms-powerpoint',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/plain',
    'image/jpeg',
    'image/png',
    'image/gif',
    'application/zip',
    'application/x-zip-compressed'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Allowed: PDF, DOC, DOCX, PPT, PPTX, TXT, images, ZIP'), false);
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50 MB
  }
});

// ==================== COURSE COMPONENT ROUTES ====================

// Create component (Tutor/Admin only)
router.post('/courses/:courseId/components', 
  authenticate, 
  authorize(['TUTOR', 'ADMIN']), 
  componentController.createComponent
);

// Get all components for a course (Public with enrollment check)
router.get('/courses/:courseId/components', 
  componentController.getCourseComponents
);

// Reorder components (Tutor/Admin only)
router.patch('/courses/:courseId/components/reorder', 
  authenticate, 
  authorize(['TUTOR', 'ADMIN']), 
  componentController.reorderComponents
);

// Get component by ID
router.get('/components/:id', 
  componentController.getComponentById
);

// Update component (Tutor/Admin only)
router.put('/components/:id', 
  authenticate, 
  authorize(['TUTOR', 'ADMIN']), 
  componentController.updateComponent
);

// Delete component (Tutor/Admin only)
router.delete('/components/:id', 
  authenticate, 
  authorize(['TUTOR', 'ADMIN']), 
  componentController.deleteComponent
);

// ==================== FILE MANAGEMENT ROUTES ====================

// Upload files to component (Tutor/Admin only)
router.post('/components/:componentId/files', 
  authenticate, 
  authorize(['TUTOR', 'ADMIN']), 
  upload.array('files', 10), // Max 10 files per upload
  fileController.uploadFiles
);

// Get file metadata
router.get('/files/:fileId', 
  authenticate, 
  fileController.getFileMetadata
);

// Download file
router.get('/files/:fileId/download', 
  authenticate, 
  fileController.downloadFile
);

// Update file description (Tutor/Admin only)
router.patch('/files/:fileId', 
  authenticate, 
  authorize(['TUTOR', 'ADMIN']), 
  fileController.updateFileDescription
);

// Delete file (Tutor/Admin only)
router.delete('/files/:fileId', 
  authenticate, 
  authorize(['TUTOR', 'ADMIN']), 
  fileController.deleteFile
);

// ==================== ASSIGNMENT SUBMISSION ROUTES ====================

// Submit assignment (Student only)
router.post('/components/:componentId/submit', 
  authenticate, 
  authorize(['STUDENT', 'ADMIN']), 
  upload.array('files', 5), // Max 5 files per submission
  submissionController.submitAssignment
);

// Get my submissions for a component (Student)
router.get('/components/:componentId/my-submissions', 
  authenticate, 
  authorize(['STUDENT', 'ADMIN']), 
  submissionController.getMySubmissions
);

// Get all submissions for an assignment component (Tutor/Admin)
router.get('/components/:componentId/submissions', 
  authenticate, 
  authorize(['TUTOR', 'ADMIN']), 
  submissionController.getComponentSubmissions
);

// Get specific submission details
router.get('/submissions/:submissionId', 
  authenticate, 
  submissionController.getSubmission
);

// Grade a submission (Tutor/Admin)
router.patch('/submissions/:submissionId/grade', 
  authenticate, 
  authorize(['TUTOR', 'ADMIN']), 
  submissionController.gradeSubmission
);

// Download submission file
router.get('/submission-files/:fileId/download', 
  authenticate, 
  submissionController.downloadSubmissionFile
);

module.exports = router;
