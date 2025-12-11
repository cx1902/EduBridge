const prisma = require('../utils/prisma');
const path = require('path');
const fs = require('fs').promises;
const crypto = require('crypto');

/**
 * Upload files to a component
 * @route POST /api/components/:componentId/files
 * @access Private (Tutor/Admin)
 */
exports.uploadFiles = async (req, res) => {
  try {
    const { componentId } = req.params;
    const { description } = req.body;
    const userId = req.user.id;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'No files provided' }
      });
    }

    // Get component with course info
    const component = await prisma.courseComponent.findUnique({
      where: { id: componentId },
      include: {
        course: { select: { id: true, tutorId: true } }
      }
    });

    if (!component) {
      return res.status(404).json({
        success: false,
        error: { message: 'Component not found' }
      });
    }

    // Check permissions
    if (component.course.tutorId !== userId && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: { message: 'Not authorized to upload files to this component' }
      });
    }

    // Create file records
    const fileRecords = await Promise.all(
      req.files.map(async (file) => {
        return prisma.componentFile.create({
          data: {
            componentId,
            fileName: file.originalname,
            filePath: file.path,
            fileSize: file.size,
            mimeType: file.mimetype,
            uploadedBy: userId,
            description
          },
          include: {
            uploader: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            }
          }
        });
      })
    );

    res.status(201).json({
      success: true,
      data: fileRecords
    });
  } catch (error) {
    console.error('Upload files error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to upload files' }
    });
  }
};

/**
 * Download a file
 * @route GET /api/files/:fileId/download
 * @access Private (Enrolled students, Tutors, Admins)
 */
exports.downloadFile = async (req, res) => {
  try {
    const { fileId } = req.params;
    const userId = req.user?.id;

    const file = await prisma.componentFile.findUnique({
      where: { id: fileId },
      include: {
        component: {
          include: {
            course: { select: { id: true, tutorId: true } }
          }
        }
      }
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        error: { message: 'File not found' }
      });
    }

    // Check if component is published
    if (!file.component.isPublished) {
      const isTutor = file.component.course.tutorId === userId;
      const isAdmin = req.user?.role === 'ADMIN';
      
      if (!isTutor && !isAdmin) {
        return res.status(403).json({
          success: false,
          error: { message: 'Component is not published' }
        });
      }
    }

    // Check enrollment for students
    if (userId) {
      const isTutor = file.component.course.tutorId === userId;
      const isAdmin = req.user?.role === 'ADMIN';

      if (!isTutor && !isAdmin) {
        const enrollment = await prisma.enrollment.findUnique({
          where: {
            userId_courseId: {
              userId,
              courseId: file.component.course.id
            }
          }
        });

        if (!enrollment) {
          return res.status(403).json({
            success: false,
            error: { message: 'Must be enrolled in the course to download files' }
          });
        }
      }
    } else {
      return res.status(401).json({
        success: false,
        error: { message: 'Authentication required' }
      });
    }

    // Increment download count
    await prisma.componentFile.update({
      where: { id: fileId },
      data: { downloadCount: { increment: 1 } }
    });

    // Send file
    res.download(file.filePath, file.fileName, (err) => {
      if (err) {
        console.error('File download error:', err);
        if (!res.headersSent) {
          res.status(500).json({
            success: false,
            error: { message: 'Failed to download file' }
          });
        }
      }
    });
  } catch (error) {
    console.error('Download file error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to download file' }
    });
  }
};

/**
 * Delete a file
 * @route DELETE /api/files/:fileId
 * @access Private (Tutor/Admin)
 */
exports.deleteFile = async (req, res) => {
  try {
    const { fileId } = req.params;
    const userId = req.user.id;

    const file = await prisma.componentFile.findUnique({
      where: { id: fileId },
      include: {
        component: {
          include: {
            course: { select: { tutorId: true } }
          }
        }
      }
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        error: { message: 'File not found' }
      });
    }

    // Check permissions
    if (file.component.course.tutorId !== userId && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: { message: 'Not authorized to delete this file' }
      });
    }

    // Delete file from filesystem
    try {
      await fs.unlink(file.filePath);
    } catch (err) {
      console.error('File deletion error:', err);
      // Continue even if file doesn't exist on filesystem
    }

    // Delete record from database
    await prisma.componentFile.delete({
      where: { id: fileId }
    });

    res.json({
      success: true,
      message: 'File deleted successfully'
    });
  } catch (error) {
    console.error('Delete file error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to delete file' }
    });
  }
};

/**
 * Get file metadata
 * @route GET /api/files/:fileId
 * @access Private (Enrolled students, Tutors, Admins)
 */
exports.getFileMetadata = async (req, res) => {
  try {
    const { fileId } = req.params;
    const userId = req.user?.id;

    const file = await prisma.componentFile.findUnique({
      where: { id: fileId },
      include: {
        component: {
          select: {
            id: true,
            isPublished: true,
            course: { select: { id: true, tutorId: true, title: true } }
          }
        },
        uploader: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        error: { message: 'File not found' }
      });
    }

    // Check permissions (same logic as download)
    if (!file.component.isPublished) {
      const isTutor = file.component.course.tutorId === userId;
      const isAdmin = req.user?.role === 'ADMIN';
      
      if (!isTutor && !isAdmin) {
        return res.status(403).json({
          success: false,
          error: { message: 'Component is not published' }
        });
      }
    }

    res.json({
      success: true,
      data: file
    });
  } catch (error) {
    console.error('Get file metadata error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch file metadata' }
    });
  }
};

/**
 * Update file description
 * @route PATCH /api/files/:fileId
 * @access Private (Tutor/Admin)
 */
exports.updateFileDescription = async (req, res) => {
  try {
    const { fileId } = req.params;
    const { description } = req.body;
    const userId = req.user.id;

    const file = await prisma.componentFile.findUnique({
      where: { id: fileId },
      include: {
        component: {
          include: {
            course: { select: { tutorId: true } }
          }
        }
      }
    });

    if (!file) {
      return res.status(404).json({
        success: false,
        error: { message: 'File not found' }
      });
    }

    // Check permissions
    if (file.component.course.tutorId !== userId && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: { message: 'Not authorized to update this file' }
      });
    }

    const updated = await prisma.componentFile.update({
      where: { id: fileId },
      data: { description }
    });

    res.json({
      success: true,
      data: updated
    });
  } catch (error) {
    console.error('Update file description error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to update file description' }
    });
  }
};
