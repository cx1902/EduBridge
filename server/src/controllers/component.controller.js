const prisma = require('../utils/prisma');

/**
 * Create a new course component
 * @route POST /api/courses/:courseId/components
 * @access Private (Tutor/Admin)
 */
exports.createComponent = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { componentType, title, description, configuration, isPublished } = req.body;
    const userId = req.user.id;

    // Verify course exists and user has permission
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { tutorId: true }
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        error: { message: 'Course not found' }
      });
    }

    // Check if user is course owner or admin
    if (course.tutorId !== userId && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: { message: 'Not authorized to add components to this course' }
      });
    }

    // Get the next sequence order
    const lastComponent = await prisma.courseComponent.findFirst({
      where: { courseId },
      orderBy: { sequenceOrder: 'desc' },
      select: { sequenceOrder: true }
    });

    const sequenceOrder = lastComponent ? lastComponent.sequenceOrder + 1 : 1;

    // Create component
    const component = await prisma.courseComponent.create({
      data: {
        courseId,
        componentType,
        title,
        description,
        configuration: configuration || {},
        sequenceOrder,
        isPublished: isPublished || false,
        createdBy: userId
      },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        _count: {
          select: {
            files: true,
            submissions: true
          }
        }
      }
    });

    res.status(201).json({
      success: true,
      data: component
    });
  } catch (error) {
    console.error('Create component error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to create component' }
    });
  }
};

/**
 * Get all components for a course
 * @route GET /api/courses/:courseId/components
 * @access Public (enrolled students see published, tutors/admins see all)
 */
exports.getCourseComponents = async (req, res) => {
  try {
    const { courseId } = req.params;
    const userId = req.user?.id;

    // Check if course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { tutorId: true, status: true }
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        error: { message: 'Course not found' }
      });
    }

    // Determine what components user can see
    const isTutor = course.tutorId === userId;
    const isAdmin = req.user?.role === 'ADMIN';
    const showAll = isTutor || isAdmin;

    // Check if student is enrolled
    let isEnrolled = false;
    if (userId && !showAll) {
      const enrollment = await prisma.enrollment.findUnique({
        where: {
          userId_courseId: {
            userId,
            courseId
          }
        }
      });
      isEnrolled = !!enrollment;
    }

    // Build where clause
    const where = {
      courseId
    };

    // Only show published components to non-owners
    if (!showAll) {
      where.isPublished = true;
    }

    const components = await prisma.courseComponent.findMany({
      where,
      orderBy: { sequenceOrder: 'asc' },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        files: {
          select: {
            id: true,
            fileName: true,
            fileSize: true,
            mimeType: true,
            description: true,
            downloadCount: true,
            uploadedAt: true
          }
        },
        _count: {
          select: {
            submissions: true
          }
        }
      }
    });

    // For students, add their submission info if enrolled
    let componentsWithSubmissions = components;
    if (userId && isEnrolled && !showAll) {
      componentsWithSubmissions = await Promise.all(
        components.map(async (component) => {
          if (component.componentType === 'ASSIGNMENT') {
            const submission = await prisma.assignmentSubmission.findFirst({
              where: {
                componentId: component.id,
                studentId: userId
              },
              orderBy: { attemptNumber: 'desc' },
              select: {
                id: true,
                attemptNumber: true,
                submittedAt: true,
                status: true,
                grade: true,
                isLate: true
              }
            });
            return { ...component, userSubmission: submission };
          }
          return component;
        })
      );
    }

    res.json({
      success: true,
      data: componentsWithSubmissions,
      meta: {
        isEnrolled,
        canEdit: showAll
      }
    });
  } catch (error) {
    console.error('Get course components error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch components' }
    });
  }
};

/**
 * Get a single component by ID
 * @route GET /api/components/:id
 * @access Public (with enrollment check for students)
 */
exports.getComponentById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id;

    const component = await prisma.courseComponent.findUnique({
      where: { id },
      include: {
        course: {
          select: {
            id: true,
            title: true,
            tutorId: true
          }
        },
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        files: {
          orderBy: { uploadedAt: 'desc' }
        },
        _count: {
          select: {
            submissions: true
          }
        }
      }
    });

    if (!component) {
      return res.status(404).json({
        success: false,
        error: { message: 'Component not found' }
      });
    }

    // Check permissions
    const isTutor = component.course.tutorId === userId;
    const isAdmin = req.user?.role === 'ADMIN';

    if (!component.isPublished && !isTutor && !isAdmin) {
      return res.status(403).json({
        success: false,
        error: { message: 'Component is not published' }
      });
    }

    res.json({
      success: true,
      data: component
    });
  } catch (error) {
    console.error('Get component error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to fetch component' }
    });
  }
};

/**
 * Update a component
 * @route PUT /api/components/:id
 * @access Private (Tutor/Admin)
 */
exports.updateComponent = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, configuration, isPublished, componentType } = req.body;
    const userId = req.user.id;

    // Get component with course info
    const component = await prisma.courseComponent.findUnique({
      where: { id },
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
        error: { message: 'Not authorized to update this component' }
      });
    }

    // Update component
    const updated = await prisma.courseComponent.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(configuration && { configuration }),
        ...(isPublished !== undefined && { isPublished }),
        ...(componentType && { componentType })
      },
      include: {
        creator: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        _count: {
          select: {
            files: true,
            submissions: true
          }
        }
      }
    });

    res.json({
      success: true,
      data: updated
    });
  } catch (error) {
    console.error('Update component error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to update component' }
    });
  }
};

/**
 * Delete a component
 * @route DELETE /api/components/:id
 * @access Private (Tutor/Admin)
 */
exports.deleteComponent = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    // Get component with course info
    const component = await prisma.courseComponent.findUnique({
      where: { id },
      include: {
        course: { select: { tutorId: true } },
        _count: { select: { submissions: true } }
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
        error: { message: 'Not authorized to delete this component' }
      });
    }

    // Warn if has submissions
    if (component._count.submissions > 0) {
      return res.status(400).json({
        success: false,
        error: {
          message: `Cannot delete component with ${component._count.submissions} student submissions`,
          submissionCount: component._count.submissions
        }
      });
    }

    // Delete component (will cascade delete files)
    await prisma.courseComponent.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Component deleted successfully'
    });
  } catch (error) {
    console.error('Delete component error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to delete component' }
    });
  }
};

/**
 * Reorder components
 * @route PATCH /api/courses/:courseId/components/reorder
 * @access Private (Tutor/Admin)
 */
exports.reorderComponents = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { componentOrders } = req.body; // Array of { id, sequenceOrder }
    const userId = req.user.id;

    // Verify course ownership
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { tutorId: true }
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        error: { message: 'Course not found' }
      });
    }

    if (course.tutorId !== userId && req.user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        error: { message: 'Not authorized to reorder components' }
      });
    }

    // Update each component's sequence order
    await prisma.$transaction(
      componentOrders.map(({ id, sequenceOrder }) =>
        prisma.courseComponent.update({
          where: { id },
          data: { sequenceOrder }
        })
      )
    );

    res.json({
      success: true,
      message: 'Components reordered successfully'
    });
  } catch (error) {
    console.error('Reorder components error:', error);
    res.status(500).json({
      success: false,
      error: { message: 'Failed to reorder components' }
    });
  }
};
