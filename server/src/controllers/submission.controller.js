const prisma = require('../utils/prisma');
const fs = require('fs').promises;

/**
 * Submit assignment
 * @route POST /api/components/:componentId/submit
 * @access Private (Student)
 */
exports.submitAssignment = async (req, res) => {
  try {
    const { componentId } = req.params;
    const { studentComments } = req.body;
    const userId = req.user.id;

    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: { message: 'No files provided for submission' }
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

    if (component.componentType !== 'ASSIGNMENT') {
      return res.status(400).json({
        success: false,
        error: { message: 'Component is not an assignment' }
      });
    }

    // Check enrollment
    const enrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId: component.course.id
        }
      }
    });

    if (!enrollment) {
      return res.status(403).json({
        success: false,
        error: { message: 'Must be enrolled in the course to submit assignments' }
      });
    }

    // Get configuration (due date, late submissions, etc.)
    const config = component.configuration || {};
    const dueDate = config.dueDate ? new Date(config.dueDate) : null;
    const allowLateSubmissions = config.allowLateSubmissions !== false;
    const maxAttempts = config.maxAttempts || null;

    // Check deadline
    let isLate = false;
    if (dueDate) {
      const now = new Date();
      isLate = now > dueDate;
      
      if (isLate && !allowLateSubmissions) {
        return res.status(400).json({
          success: false,
          error: { message: 'Submission deadline has passed and late submissions are not allowed' }
        });
      }
    }

    // Check attempt limit
    const previousSubmissions = await prisma.assignmentSubmission.findMany({
      where: {
        componentId,
        studentId: userId
      },
      orderBy: { attemptNumber: 'desc' }
    });

    const attemptNumber = previousSubmissions.length > 0 
      ? previousSubmissions[0].attemptNumber + 1 
      : 1;

    if (maxAttempts && attemptNumber > maxAttempts) {
      return res.status(400).json({
        success: false,
        error: { message: `Maximum submission attempts (${maxAttempts}) exceeded` }
      });
    }

    // Create submission using transaction
    const submission = await prisma.$transaction(async (tx) => {
      // Create submission record
      const newSubmission = await tx.assignmentSubmission.create({
        data: {
          componentId,
          studentId: userId,
          attemptNumber,
          isLate,
          studentComments,
          status: 'SUBMITTED'
        }
      });

      // Create file records
      await Promise.all(
        req.files.map((file) =>
          tx.submissionFile.create({
            data: {
              submissionId: newSubmission.id,
              fileName: file.originalname,
              filePath: file.path,
              fileSize: file.size,
              mimeType: file.mimetype
            }
          })
        )
      );

      return tx.assignmentSubmission.findUnique({
        where: { id: newSubmission.id },
        include: {
          files: true,
          student: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              email: true
            }
          }
        }
      });
    });

    // Create notification for tutor
    await prisma.notification.create({
      data: {
        userId: component.course.tutorId,
        type: 'SYSTEM_ANNOUNCEMENT', // Reusing existing type or create new one
        title: 'New Assignment Submission',
        message: `${req.user.firstName} ${req.user.lastName} submitted ${component.title}${isLate ? ' (Late)' : ''}`,
        link: `/tutor/courses/${component.course.id}/components/${componentId}`
      }
    });

    res.status(201).json({
      success: true,
      data: submission,
      message: 'Assignment submitted successfully'
    });
  } catch (error) {
    console.error('Submit assignment error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to submit assignment' }
    });
  }
};

/**
 * Get student's submissions for a component
 * @route GET /api/components/:componentId/my-submissions
 * @access Private (Student)
 */
exports.getMySubmissions = async (req, res) => {
  try {
    const { componentId } = req.params;
    const userId = req.user.id;

    const submissions = await prisma.assignmentSubmission.findMany({
      where: {
        componentId,
        studentId: userId
      },
      orderBy: { attemptNumber: 'desc' },
      include: {
        files: true,
        grader: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: submissions
    });
  } catch (error) {
    console.error('Get my submissions error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch submissions' }
    });
  }
};

/**
 * Get all submissions for an assignment (Tutor/Admin)
 * @route GET /api/components/:componentId/submissions
 * @access Private (Tutor/Admin)
 */
exports.getComponentSubmissions = async (req, res) => {
  try {
    const { componentId } = req.params;
    const userId = req.user.id;
    const { status, studentName } = req.query;

    // Get component with course info
    const component = await prisma.courseComponent.findUnique({
      where: { id: componentId },
      include: {
        course: { select: { tutorId: true } }
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
        error: { message: 'Not authorized to view submissions' }
      });
    }

    // Build where clause
    const where = { componentId };
    if (status) {
      where.status = status;
    }

    let submissions = await prisma.assignmentSubmission.findMany({
      where,
      orderBy: { submittedAt: 'desc' },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        files: true,
        grader: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    // Filter by student name if provided
    if (studentName) {
      const searchLower = studentName.toLowerCase();
      submissions = submissions.filter(sub => 
        `${sub.student.firstName} ${sub.student.lastName}`.toLowerCase().includes(searchLower)
      );
    }

    // Get latest submission for each student
    const studentLatestSubmissions = {};
    submissions.forEach(sub => {
      const key = sub.studentId;
      if (!studentLatestSubmissions[key] || 
          sub.attemptNumber > studentLatestSubmissions[key].attemptNumber) {
        studentLatestSubmissions[key] = sub;
      }
    });

    res.json({
      success: true,
      data: {
        all: submissions,
        latest: Object.values(studentLatestSubmissions)
      }
    });
  } catch (error) {
    console.error('Get component submissions error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch submissions' }
    });
  }
};

/**
 * Get a specific submission
 * @route GET /api/submissions/:submissionId
 * @access Private (Student - own, Tutor, Admin)
 */
exports.getSubmission = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const userId = req.user.id;

    const submission = await prisma.assignmentSubmission.findUnique({
      where: { id: submissionId },
      include: {
        component: {
          include: {
            course: { select: { id: true, tutorId: true } }
          }
        },
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        files: true,
        grader: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    if (!submission) {
      return res.status(404).json({
        success: false,
        error: { message: 'Submission not found' }
      });
    }

    // Check permissions
    const isOwner = submission.studentId === userId;
    const isTutor = submission.component.course.tutorId === userId;
    const isAdmin = req.user.role === 'ADMIN';

    if (!isOwner && !isTutor && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: { message: 'Not authorized to view this submission' }
      });
    }

    res.json({
      success: true,
      data: submission
    });
  } catch (error) {
    console.error('Get submission error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch submission' }
    });
  }
};

/**
 * Grade a submission
 * @route PATCH /api/submissions/:submissionId/grade
 * @access Private (Tutor/Admin)
 */
exports.gradeSubmission = async (req, res) => {
  try {
    const { submissionId } = req.params;
    const { grade, feedback, status } = req.body;
    const userId = req.user.id;

    // Validate grade
    if (grade !== undefined && (grade < 0 || grade > 100)) {
      return res.status(400).json({
        success: false,
        error: { message: 'Grade must be between 0 and 100' }
      });
    }

    // Get submission with component info
    const submission = await prisma.assignmentSubmission.findUnique({
      where: { id: submissionId },
      include: {
        component: {
          include: {
            course: { select: { tutorId: true } }
          }
        },
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        }
      }
    });

    if (!submission) {
      return res.status(404).json({
        success: false,
        error: { message: 'Submission not found' }
      });
    }

    // Check permissions
    if (submission.component.course.tutorId !== userId && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: { message: 'Not authorized to grade this submission' }
      });
    }

    // Update submission
    const updated = await prisma.assignmentSubmission.update({
      where: { id: submissionId },
      data: {
        ...(grade !== undefined && { grade }),
        ...(feedback && { feedback }),
        ...(status && { status }),
        gradedBy: userId,
        gradedAt: new Date()
      },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        grader: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        files: true
      }
    });

    // Create notification for student
    await prisma.notification.create({
      data: {
        userId: submission.student.id,
        type: 'SYSTEM_ANNOUNCEMENT',
        title: 'Assignment Graded',
        message: `Your submission for "${submission.component.title}" has been graded${grade !== undefined ? `: ${grade}/100` : ''}`,
        link: `/student/courses/${submission.component.course.id}/components/${submission.component.id}`
      }
    });

    res.json({
      success: true,
      data: updated,
      message: 'Submission graded successfully'
    });
  } catch (error) {
    console.error('Grade submission error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to grade submission' }
    });
  }
};

/**
 * Download submission file
 * @route GET /api/submission-files/:fileId/download
 * @access Private (Student - own, Tutor, Admin)
 */
exports.downloadSubmissionFile = async (req, res) => {
  try {
    const { fileId } = req.params;
    const userId = req.user.id;

    const file = await prisma.submissionFile.findUnique({
      where: { id: fileId },
      include: {
        submission: {
          include: {
            component: {
              include: {
                course: { select: { tutorId: true } }
              }
            }
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
    const isOwner = file.submission.studentId === userId;
    const isTutor = file.submission.component.course.tutorId === userId;
    const isAdmin = req.user.role === 'ADMIN';

    if (!isOwner && !isTutor && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: { message: 'Not authorized to download this file' }
      });
    }

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
    console.error('Download submission file error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to download file' }
    });
  }
};
