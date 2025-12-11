const prisma = require('../utils/prisma');
const { logAction, ACTION_TYPES, RESOURCE_TYPES } = require('../utils/auditLogger');
const emailService = require('../utils/emailService');
const crypto = require('crypto');

// ==================== USER MANAGEMENT ====================

/**
 * Get all users with filtering and pagination
 * GET /api/admin/users
 */
exports.getUsers = async (req, res) => {
  try {
    const {
      search,
      role,
      status,
      page = 1,
      limit = 50,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      startDate,
      endDate,
      emailVerified,
      language,
      hasWarnings,
      activityDays,
      minPoints,
      maxPoints,
    } = req.query;

    const where = {};

    // Search filter
    if (search) {
      where.OR = [
        { email: { contains: search, mode: 'insensitive' } },
        { firstName: { contains: search, mode: 'insensitive' } },
        { lastName: { contains: search, mode: 'insensitive' } },
        { id: { contains: search } },
      ];
    }

    // Role filter
    if (role && ['STUDENT', 'TUTOR', 'ADMIN', 'MANAGEMENT'].includes(role)) {
      where.role = role;
    }

    // Status filter
    if (status && ['ACTIVE', 'SUSPENDED', 'BANNED'].includes(status)) {
      where.status = status;
    }

    // Email verification filter
    if (emailVerified !== undefined) {
      where.emailVerified = emailVerified === 'true';
    }

    // Language filter
    if (language && ['en', 'zh-CN', 'zh-TW'].includes(language)) {
      where.preferredLanguage = language;
    }

    // Has warnings filter
    if (hasWarnings === 'true') {
      where.warningsReceived = {
        some: {},
      };
    } else if (hasWarnings === 'false') {
      where.warningsReceived = {
        none: {},
      };
    }

    // Activity filter (last login within specified days)
    if (activityDays) {
      const days = parseInt(activityDays);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      where.lastLogin = {
        gte: cutoffDate,
      };
    }

    // Points range filter
    if (minPoints !== undefined || maxPoints !== undefined) {
      where.totalPoints = {};
      if (minPoints !== undefined) where.totalPoints.gte = parseInt(minPoints);
      if (maxPoints !== undefined) where.totalPoints.lte = parseInt(maxPoints);
    }

    // Date range filter
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [users, total, statistics] = await Promise.all([
      prisma.user.findMany({
        where,
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          status: true,
          totalPoints: true,
          currentStreak: true,
          emailVerified: true,
          lastLogin: true,
          createdAt: true,
          preferredLanguage: true,
          _count: {
            select: {
              enrollments: true,
              createdCourses: true,
              sessionBookings: true,
              warningsReceived: true,
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: parseInt(limit),
      }),
      prisma.user.count({ where }),
      // Get aggregated statistics
      Promise.all([
        prisma.user.count(),
        prisma.user.groupBy({
          by: ['role'],
          _count: true,
        }),
        prisma.user.groupBy({
          by: ['status'],
          _count: true,
        }),
        prisma.user.groupBy({
          by: ['preferredLanguage'],
          _count: true,
        }),
        prisma.user.count({ where: { emailVerified: true } }),
        prisma.user.count({
          where: {
            warningsReceived: {
              some: {},
            },
          },
        }),
      ]),
    ]);

    // Format statistics
    const [totalUsers, byRole, byStatus, byLanguage, emailVerifiedCount, withWarningsCount] = statistics;
    
    const formattedStatistics = {
      totalUsers,
      byRole: byRole.reduce((acc, item) => ({ ...acc, [item.role]: item._count }), {}),
      byStatus: byStatus.reduce((acc, item) => ({ ...acc, [item.status]: item._count }), {}),
      byLanguage: byLanguage.reduce((acc, item) => ({ ...acc, [item.preferredLanguage]: item._count }), {}),
      emailVerified: emailVerifiedCount,
      withWarnings: withWarningsCount,
    };

    res.json({
      success: true,
      users,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
      statistics: formattedStatistics,
    });
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch users' });
  }
};

/**
 * Get user details by ID
 * GET /api/admin/users/:id
 */
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        enrollments: {
          include: { course: { select: { id: true, title: true } } },
          take: 10,
          orderBy: { enrolledAt: 'desc' },
        },
        createdCourses: {
          select: { id: true, title: true, status: true, enrollmentCount: true },
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        sessionBookings: {
          select: { id: true, status: true, bookedAt: true },
          take: 10,
          orderBy: { bookedAt: 'desc' },
        },
        userBadges: {
          include: { badge: true },
          orderBy: { earnedAt: 'desc' },
        },
        warningsReceived: {
          include: { issuer: { select: { firstName: true, lastName: true } } },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Remove sensitive data
    delete user.passwordHash;

    res.json({ success: true, user });
  } catch (error) {
    console.error('Error fetching user:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch user details' });
  }
};

/**
 * Get comprehensive user details including all related entities
 * GET /api/admin/users/:id/details
 */
exports.getUserDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const { tab } = req.query; // Optional: fetch specific tab data

    // Base user information (always fetched)
    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        // Basic Information
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        profilePictureUrl: true,
        dateOfBirth: true,
        phoneNumber: true,
        bio: true,
        
        // Account Status
        role: true,
        status: true,
        emailVerified: true,
        loginAttempts: true,
        lastLogin: true,
        createdAt: true,
        updatedAt: true,
        
        // Preferences
        preferredLanguage: true,
        themePreference: true,
        fontSize: true,
        timezone: true,
        
        // Gamification
        totalPoints: true,
        currentStreak: true,
        longestStreak: true,
        lastActivityDate: true,
        streakFreezesAvailable: true,
        streakFreezesUsed: true,
        
        // Counts
        _count: {
          select: {
            enrollments: true,
            createdCourses: true,
            sessionBookings: true,
            userBadges: true,
            warningsReceived: true,
          },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Log admin action
    await logAction({
      adminId: req.user.id,
      actionType: 'USER_DETAILS_VIEW',
      targetResourceType: RESOURCE_TYPES.USER,
      targetResourceId: id,
      reason: 'Viewed user details',
      ipAddress: req.ip || req.connection.remoteAddress,
    });

    // Fetch additional data based on tab or return all if no tab specified
    let additionalData = {};

    if (!tab || tab === 'activity') {
      // Activity data: Points transactions
      const pointsTransactions = await prisma.pointsTransaction.findMany({
        where: { userId: id },
        take: 50,
        orderBy: { timestamp: 'desc' },
      });
      additionalData.pointsTransactions = pointsTransactions;
    }

    if (!tab || tab === 'courses') {
      // Courses data: Enrollments and created courses
      const [enrollments, createdCourses] = await Promise.all([
        prisma.enrollment.findMany({
          where: { userId: id },
          include: {
            course: {
              select: {
                id: true,
                title: true,
                thumbnailUrl: true,
                status: true,
              },
            },
          },
          take: 50,
          orderBy: { enrolledAt: 'desc' },
        }),
        prisma.course.findMany({
          where: { tutorId: id },
          select: {
            id: true,
            title: true,
            status: true,
            enrollmentCount: true,
            averageRating: true,
            createdAt: true,
            publishedAt: true,
          },
          take: 50,
          orderBy: { createdAt: 'desc' },
        }),
      ]);
      additionalData.enrollments = enrollments;
      additionalData.createdCourses = createdCourses;
    }

    if (!tab || tab === 'sessions') {
      // Sessions data: Booked sessions and tutored sessions
      const [sessionBookings, tutoredSessions] = await Promise.all([
        prisma.sessionBooking.findMany({
          where: { studentId: id },
          include: {
            session: {
              select: {
                id: true,
                subject: true,
                scheduledStart: true,
                scheduledEnd: true,
                status: true,
                tutor: {
                  select: {
                    firstName: true,
                    lastName: true,
                  },
                },
              },
            },
          },
          take: 50,
          orderBy: { bookedAt: 'desc' },
        }),
        prisma.tutoringSession.findMany({
          where: { tutorId: id },
          select: {
            id: true,
            subject: true,
            scheduledStart: true,
            scheduledEnd: true,
            status: true,
            maxParticipants: true,
            _count: {
              select: {
                bookings: true,
              },
            },
          },
          take: 50,
          orderBy: { scheduledStart: 'desc' },
        }),
      ]);
      additionalData.sessionBookings = sessionBookings;
      additionalData.tutoredSessions = tutoredSessions;
    }

    if (!tab || tab === 'warnings') {
      // Warnings data
      const warningsReceived = await prisma.userWarning.findMany({
        where: { userId: id },
        include: {
          issuer: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      });
      additionalData.warningsReceived = warningsReceived;
    }

    if (!tab || tab === 'audit') {
      // Audit history: Role changes, status changes, admin actions
      const auditHistory = await prisma.auditLog.findMany({
        where: {
          targetResourceType: RESOURCE_TYPES.USER,
          targetResourceId: id,
        },
        include: {
          admin: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        take: 100,
        orderBy: { timestamp: 'desc' },
      });
      additionalData.auditHistory = auditHistory;
    }

    if (!tab || tab === 'badges') {
      // Badges data
      const userBadges = await prisma.userBadge.findMany({
        where: { userId: id },
        include: {
          badge: true,
        },
        orderBy: { earnedAt: 'desc' },
      });
      additionalData.userBadges = userBadges;
    }

    res.json({
      success: true,
      user: {
        ...user,
        ...additionalData,
      },
    });
  } catch (error) {
    console.error('Error fetching user details:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch user details' });
  }
};

/**
 * Change user role
 * PUT /api/admin/users/:id/role
 */
exports.changeUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { newRole, reason } = req.body;
    const adminId = req.user.id;

    // Validate input
    if (!['STUDENT', 'TUTOR', 'ADMIN', 'MANAGEMENT'].includes(newRole)) {
      return res.status(400).json({ success: false, message: 'Invalid role' });
    }

    if (!reason || reason.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Reason is required (minimum 10 characters)',
      });
    }

    // Prevent self-modification
    if (id === adminId) {
      return res.status(403).json({
        success: false,
        message: 'You cannot modify your own role',
      });
    }

    // Get current user
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const previousRole = user.role;

    // Validate role transition for TUTOR
    if (newRole === 'TUTOR') {
      const hasVerification = await prisma.tutorVerificationApplication.findFirst({
        where: { userId: id, status: 'APPROVED' },
      });

      if (!hasVerification) {
        return res.status(400).json({
          success: false,
          message: 'User must have an approved tutor verification to become a TUTOR',
        });
      }
    }

    // Update user role
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { role: newRole },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        role: true,
      },
    });

    // Create audit log
    await logAction({
      adminId,
      actionType: ACTION_TYPES.USER_ROLE_CHANGE,
      targetResourceType: RESOURCE_TYPES.USER,
      targetResourceId: id,
      previousState: { role: previousRole },
      newState: { role: newRole },
      reason,
      ipAddress: req.ip || req.connection.remoteAddress,
    });

    // Send notification email to user
    try {
      await emailService.sendEmail({
        to: user.email,
        subject: 'Your Account Role Has Been Updated',
        text: `Dear ${user.firstName},

Your account role has been changed from ${previousRole} to ${newRole}.

Reason: ${reason}

Best regards,
EduBridge Team`,
      });
    } catch (emailError) {
      console.error('Failed to send role change email:', emailError);
    }

    res.json({
      success: true,
      message: 'User role updated successfully',
      user: updatedUser,
    });
  } catch (error) {
    console.error('Error changing user role:', error);
    res.status(500).json({ success: false, message: 'Failed to change user role' });
  }
};

/**
 * Change user status (suspend, unsuspend, ban)
 * PUT /api/admin/users/:id/status
 */
exports.changeUserStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, reason } = req.body;
    const adminId = req.user.id;

    // Validate input
    if (!['ACTIVE', 'SUSPENDED', 'BANNED'].includes(status)) {
      return res.status(400).json({ success: false, message: 'Invalid status' });
    }

    if ((status === 'SUSPENDED' || status === 'BANNED') && (!reason || reason.trim().length < 10)) {
      return res.status(400).json({
        success: false,
        message: 'Reason is required for suspension or ban (minimum 10 characters)',
      });
    }

    // Prevent self-modification
    if (id === adminId) {
      return res.status(403).json({
        success: false,
        message: 'You cannot modify your own status',
      });
    }

    // Get current user
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const previousStatus = user.status;

    // Update user status
    const updatedUser = await prisma.user.update({
      where: { id },
      data: { status },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        status: true,
      },
    });

    // Create audit log
    await logAction({
      adminId,
      actionType: ACTION_TYPES.USER_STATUS_CHANGE,
      targetResourceType: RESOURCE_TYPES.USER,
      targetResourceId: id,
      previousState: { status: previousStatus },
      newState: { status },
      reason,
      ipAddress: req.ip || req.connection.remoteAddress,
    });

    // Send notification email to user
    const statusMessages = {
      ACTIVE: 'Your account has been reactivated.',
      SUSPENDED: `Your account has been temporarily suspended.\n\nReason: ${reason}`,
      BANNED: `Your account has been permanently banned.\n\nReason: ${reason}`,
    };

    try {
      await emailService.sendEmail({
        to: user.email,
        subject: `Account Status Update: ${status}`,
        text: `Dear ${user.firstName},

${statusMessages[status]}

If you have questions, please contact support.

Best regards,
EduBridge Team`,
      });
    } catch (emailError) {
      console.error('Failed to send status change email:', emailError);
    }

    res.json({
      success: true,
      message: `User status updated to ${status}`,
      user: updatedUser,
    });
  } catch (error) {
    console.error('Error changing user status:', error);
    res.status(500).json({ success: false, message: 'Failed to change user status' });
  }
};

/**
 * Send password reset link
 * POST /api/admin/users/:id/reset-password
 */
exports.sendPasswordReset = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Generate reset token (24-hour expiry)
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000);

    // In production, you'd save this token to the database
    // For now, we'll just generate and send it

    const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;

    // Create audit log
    await logAction({
      adminId,
      actionType: ACTION_TYPES.USER_PASSWORD_RESET,
      targetResourceType: RESOURCE_TYPES.USER,
      targetResourceId: id,
      reason: 'Admin-initiated password reset',
      ipAddress: req.ip || req.connection.remoteAddress,
    });

    // Send reset email
    try {
      await emailService.sendEmail({
        to: user.email,
        subject: 'Password Reset Request',
        text: `Dear ${user.firstName},

A password reset has been requested for your account by an administrator.

Please click the link below to reset your password:
${resetLink}

This link will expire in 24 hours.

If you did not request this reset, please contact support immediately.

Best regards,
EduBridge Team`,
      });

      res.json({
        success: true,
        message: 'Password reset email sent successfully',
      });
    } catch (emailError) {
      console.error('Failed to send password reset email:', emailError);
      res.status(500).json({
        success: false,
        message: 'Failed to send password reset email',
      });
    }
  } catch (error) {
    console.error('Error sending password reset:', error);
    res.status(500).json({ success: false, message: 'Failed to send password reset' });
  }
};

/**
 * Soft delete user
 * DELETE /api/admin/users/:id
 */
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const adminId = req.user.id;

    if (!reason || reason.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Reason is required for deletion (minimum 10 characters)',
      });
    }

    // Prevent self-deletion
    if (id === adminId) {
      return res.status(403).json({
        success: false,
        message: 'You cannot delete your own account',
      });
    }

    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    // Soft delete by setting status to BANNED and anonymizing email
    const deletedUser = await prisma.user.update({
      where: { id },
      data: {
        status: 'BANNED',
        email: `deleted_${id}@edubridge.local`,
      },
    });

    // Create audit log
    await logAction({
      adminId,
      actionType: ACTION_TYPES.USER_DELETE,
      targetResourceType: RESOURCE_TYPES.USER,
      targetResourceId: id,
      previousState: { email: user.email, status: user.status },
      newState: { email: deletedUser.email, status: 'BANNED', deleted: true },
      reason,
      ipAddress: req.ip || req.connection.remoteAddress,
    });

    res.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(500).json({ success: false, message: 'Failed to delete user' });
  }
};

/**
 * Get user role change history
 * GET /api/admin/users/:id/role-history
 */
exports.getUserRoleHistory = async (req, res) => {
  try {
    const { id } = req.params;

    const roleChanges = await prisma.auditLog.findMany({
      where: {
        targetResourceType: RESOURCE_TYPES.USER,
        targetResourceId: id,
        actionType: ACTION_TYPES.USER_ROLE_CHANGE,
      },
      include: {
        admin: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: { timestamp: 'desc' },
    });

    res.json({ success: true, roleChanges });
  } catch (error) {
    console.error('Error fetching role history:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch role history' });
  }
};

// ==================== AUDIT LOGS ====================

/**
 * Get audit logs with filters
 * GET /api/admin/audit-logs
 */
exports.getAuditLogs = async (req, res) => {
  try {
    const {
      adminId,
      actionType,
      targetResourceType,
      startDate,
      endDate,
      searchTerm,
      page = 1,
      limit = 50,
    } = req.query;

    const where = {};

    if (adminId) where.adminId = adminId;
    if (actionType) where.actionType = actionType;
    if (targetResourceType) where.targetResourceType = targetResourceType;

    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = new Date(startDate);
      if (endDate) where.timestamp.lte = new Date(endDate);
    }

    if (searchTerm) {
      where.reason = {
        contains: searchTerm,
        mode: 'insensitive',
      };
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        include: {
          admin: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              role: true,
            },
          },
        },
        orderBy: { timestamp: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.auditLog.count({ where }),
    ]);

    res.json({
      success: true,
      logs,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch audit logs' });
  }
};

/**
 * Export audit logs to CSV
 * GET /api/admin/audit-logs/export
 */
exports.exportAuditLogs = async (req, res) => {
  try {
    const { adminId, actionType, targetResourceType, startDate, endDate } = req.query;

    const where = {};
    if (adminId) where.adminId = adminId;
    if (actionType) where.actionType = actionType;
    if (targetResourceType) where.targetResourceType = targetResourceType;

    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = new Date(startDate);
      if (endDate) where.timestamp.lte = new Date(endDate);
    }

    const logs = await prisma.auditLog.findMany({
      where,
      include: {
        admin: {
          select: { email: true, firstName: true, lastName: true },
        },
      },
      orderBy: { timestamp: 'desc' },
      take: 10000, // Limit for export
    });

    const headers = [
      'Timestamp',
      'Admin Email',
      'Admin Name',
      'Action Type',
      'Target Resource Type',
      'Target Resource ID',
      'Reason',
      'IP Address',
    ];

    const rows = logs.map((log) => [
      log.timestamp.toISOString(),
      log.admin.email,
      `${log.admin.firstName} ${log.admin.lastName}`,
      log.actionType,
      log.targetResourceType,
      log.targetResourceId || '',
      log.reason || '',
      log.ipAddress || '',
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) =>
        row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')
      ),
    ].join('\n');

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename=audit-logs.csv');
    res.send(csvContent);
  } catch (error) {
    console.error('Error exporting audit logs:', error);
    res.status(500).json({ success: false, message: 'Failed to export audit logs' });
  }
};

/**
 * Get audit log statistics
 * GET /api/admin/audit-logs/stats
 */
exports.getAuditStats = async (req, res) => {
  try {
    const { startDate, endDate } = req.query;

    const where = {};
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = new Date(startDate);
      if (endDate) where.timestamp.lte = new Date(endDate);
    }

    const [totalActions, actionsByType, actionsByAdmin] = await Promise.all([
      prisma.auditLog.count({ where }),
      prisma.auditLog.groupBy({
        by: ['actionType'],
        where,
        _count: true,
      }),
      prisma.auditLog.groupBy({
        by: ['adminId'],
        where,
        _count: true,
      }),
    ]);

    res.json({
      success: true,
      statistics: {
        totalActions,
        actionsByType: actionsByType.map((item) => ({
          actionType: item.actionType,
          count: item._count,
        })),
        actionsByAdmin: actionsByAdmin.map((item) => ({
          adminId: item.adminId,
          count: item._count,
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching audit stats:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch audit statistics' });
  }
};

// ==================== TUTOR VERIFICATION ====================

/**
 * Get all tutor verification applications
 * GET /api/admin/tutor-applications
 */
exports.getTutorApplications = async (req, res) => {
  try {
    const { status, page = 1, limit = 50, sortBy = 'submittedAt', sortOrder = 'asc' } = req.query;

    const where = {};
    if (status && ['PENDING', 'UNDER_REVIEW', 'APPROVED', 'DECLINED', 'CHANGES_REQUESTED'].includes(status)) {
      where.status = status;
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [applications, total] = await Promise.all([
      prisma.tutorVerificationApplication.findMany({
        where,
        include: {
          applicant: {
            select: {
              id: true,
              email: true,
              firstName: true,
              lastName: true,
              bio: true,
              profilePictureUrl: true,
            },
          },
          reviewer: {
            select: {
              firstName: true,
              lastName: true,
              email: true,
            },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: parseInt(limit),
      }),
      prisma.tutorVerificationApplication.count({ where }),
    ]);

    res.json({
      success: true,
      applications,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching tutor applications:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch tutor applications' });
  }
};

/**
 * Review tutor application (approve, decline, request changes)
 * PUT /api/admin/tutor-applications/:id/review
 */
exports.reviewTutorApplication = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, reviewNotes } = req.body;
    const adminId = req.user.id;

    if (!['APPROVE', 'DECLINE', 'REQUEST_CHANGES'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Invalid action' });
    }

    const application = await prisma.tutorVerificationApplication.findUnique({
      where: { id },
      include: { applicant: true },
    });

    if (!application) {
      return res.status(404).json({ success: false, message: 'Application not found' });
    }

    let newStatus;
    let userRoleUpdate = null;

    switch (action) {
      case 'APPROVE':
        newStatus = 'APPROVED';
        userRoleUpdate = 'TUTOR';
        break;
      case 'DECLINE':
        newStatus = 'DECLINED';
        break;
      case 'REQUEST_CHANGES':
        newStatus = 'CHANGES_REQUESTED';
        break;
    }

    // Update application
    const updatedApplication = await prisma.tutorVerificationApplication.update({
      where: { id },
      data: {
        status: newStatus,
        reviewerId: adminId,
        reviewNotes,
        reviewedAt: new Date(),
      },
    });

    // If approved, update user role to TUTOR
    if (userRoleUpdate) {
      await prisma.user.update({
        where: { id: application.userId },
        data: { role: userRoleUpdate },
      });
    }

    // Create audit log
    const actionTypeMap = {
      APPROVE: ACTION_TYPES.TUTOR_APPLICATION_APPROVE,
      DECLINE: ACTION_TYPES.TUTOR_APPLICATION_DECLINE,
      REQUEST_CHANGES: ACTION_TYPES.TUTOR_APPLICATION_REQUEST_CHANGES,
    };

    await logAction({
      adminId,
      actionType: actionTypeMap[action],
      targetResourceType: RESOURCE_TYPES.TUTOR_APPLICATION,
      targetResourceId: id,
      previousState: { status: application.status },
      newState: { status: newStatus, roleUpdate: userRoleUpdate },
      reason: reviewNotes,
      ipAddress: req.ip || req.connection.remoteAddress,
    });

    // Send email notification
    const emailSubjects = {
      APPROVE: 'Tutor Application Approved!',
      DECLINE: 'Tutor Application Update',
      REQUEST_CHANGES: 'Changes Requested for Your Tutor Application',
    };

    const emailMessages = {
      APPROVE: `Congratulations! Your tutor application has been approved. You can now create courses and schedule sessions.\n\nReview Notes: ${reviewNotes || 'None'}`,
      DECLINE: `Your tutor application has been declined.

Reason: ${reviewNotes}

You may reapply after addressing the concerns mentioned above.`,
      REQUEST_CHANGES: `Your tutor application requires some changes before approval.

Required Changes: ${reviewNotes}

Please update your application and resubmit.`,
    };

    try {
      await emailService.sendEmail({
        to: application.applicant.email,
        subject: emailSubjects[action],
        text: `Dear ${application.applicant.firstName},

${emailMessages[action]}

Best regards,
EduBridge Team`,
      });
    } catch (emailError) {
      console.error('Failed to send review email:', emailError);
    }

    res.json({
      success: true,
      message: `Application ${newStatus.toLowerCase()}`,
      application: updatedApplication,
    });
  } catch (error) {
    console.error('Error reviewing tutor application:', error);
    res.status(500).json({ success: false, message: 'Failed to review application' });
  }
};

// ==================== CONTENT REPORTS ====================

/**
 * Get all content reports
 * GET /api/admin/reports
 */
exports.getReports = async (req, res) => {
  try {
    const {
      status,
      priority,
      reportedItemType,
      page = 1,
      limit = 50,
      sortBy = 'createdAt',
      sortOrder = 'desc',
    } = req.query;

    const where = {};
    if (status) where.status = status;
    if (priority) where.priority = priority;
    if (reportedItemType) where.reportedItemType = reportedItemType;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [reports, total] = await Promise.all([
      prisma.contentReport.findMany({
        where,
        include: {
          reporter: {
            select: { id: true, email: true, firstName: true, lastName: true },
          },
          resolver: {
            select: { firstName: true, lastName: true, email: true },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: parseInt(limit),
      }),
      prisma.contentReport.count({ where }),
    ]);

    res.json({
      success: true,
      reports,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching reports:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch reports' });
  }
};

/**
 * Resolve a content report
 * PUT /api/admin/reports/:id/resolve
 */
exports.resolveReport = async (req, res) => {
  try {
    const { id } = req.params;
    const { action, resolution } = req.body;
    const adminId = req.user.id;

    if (!['DISMISS', 'REQUIRE_EDIT', 'HIDE_CONTENT', 'WARN_USER'].includes(action)) {
      return res.status(400).json({ success: false, message: 'Invalid action' });
    }

    if (!resolution || resolution.trim().length < 10) {
      return res.status(400).json({
        success: false,
        message: 'Resolution notes required (minimum 10 characters)',
      });
    }

    const report = await prisma.contentReport.findUnique({
      where: { id },
      include: { reporter: true },
    });

    if (!report) {
      return res.status(404).json({ success: false, message: 'Report not found' });
    }

    // Update report status
    const updatedReport = await prisma.contentReport.update({
      where: { id },
      data: {
        status: action === 'DISMISS' ? 'DISMISSED' : 'RESOLVED',
        resolverId: adminId,
        resolution,
        resolvedAt: new Date(),
      },
    });

    // Perform action based on type
    if (action === 'WARN_USER' && report.reportedItemType === 'USER') {
      await prisma.userWarning.create({
        data: {
          userId: report.reportedItemId,
          issuedBy: adminId,
          reason: resolution,
          severity: report.priority === 'CRITICAL' ? 'SEVERE' : 'MEDIUM',
          relatedItemType: 'REPORT',
          relatedItemId: id,
        },
      });
    }

    // Hide content if requested
    if (action === 'HIDE_CONTENT') {
      if (report.reportedItemType === 'COURSE') {
        await prisma.course.update({
          where: { id: report.reportedItemId },
          data: { status: 'DRAFT' },
        });
      } else if (report.reportedItemType === 'LESSON') {
        await prisma.lesson.update({
          where: { id: report.reportedItemId },
          data: { published: false },
        });
      }
    }

    // Create audit log
    const actionTypeMap = {
      DISMISS: ACTION_TYPES.REPORT_DISMISS,
      REQUIRE_EDIT: ACTION_TYPES.REPORT_REQUIRE_EDIT,
      HIDE_CONTENT: ACTION_TYPES.REPORT_HIDE_CONTENT,
      WARN_USER: ACTION_TYPES.REPORT_WARN_USER,
    };

    await logAction({
      adminId,
      actionType: actionTypeMap[action],
      targetResourceType: RESOURCE_TYPES.REPORT,
      targetResourceId: id,
      previousState: { status: report.status },
      newState: { status: updatedReport.status, action },
      reason: resolution,
      ipAddress: req.ip || req.connection.remoteAddress,
    });

    res.json({
      success: true,
      message: 'Report resolved successfully',
      report: updatedReport,
    });
  } catch (error) {
    console.error('Error resolving report:', error);
    res.status(500).json({ success: false, message: 'Failed to resolve report' });
  }
};

// ==================== SYSTEM SETTINGS ====================

/**
 * Get all system settings
 * GET /api/admin/settings
 */
exports.getSettings = async (req, res) => {
  try {
    const { category } = req.query;

    const where = {};
    if (category) where.category = category;

    const settings = await prisma.systemSetting.findMany({
      where,
      orderBy: { category: 'asc' },
    });

    res.json({ success: true, settings });
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch settings' });
  }
};

/**
 * Update a system setting
 * PUT /api/admin/settings/:key
 */
exports.updateSetting = async (req, res) => {
  try {
    const { key } = req.params;
    const { value, description } = req.body;
    const adminId = req.user.id;

    const setting = await prisma.systemSetting.findUnique({
      where: { settingKey: key },
    });

    let updatedSetting;
    if (setting) {
      // Update existing setting
      updatedSetting = await prisma.systemSetting.update({
        where: { settingKey: key },
        data: {
          settingValue: value,
          description: description || setting.description,
          lastModifiedBy: adminId,
          lastModifiedAt: new Date(),
        },
      });

      // Create audit log
      await logAction({
        adminId,
        actionType: ACTION_TYPES.SETTING_UPDATE,
        targetResourceType: RESOURCE_TYPES.SETTING,
        targetResourceId: key,
        previousState: { value: setting.settingValue },
        newState: { value },
        reason: `Setting ${key} updated`,
        ipAddress: req.ip || req.connection.remoteAddress,
      });
    } else {
      return res.status(404).json({ success: false, message: 'Setting not found' });
    }

    res.json({
      success: true,
      message: 'Setting updated successfully',
      setting: updatedSetting,
    });
  } catch (error) {
    console.error('Error updating setting:', error);
    res.status(500).json({ success: false, message: 'Failed to update setting' });
  }
};

/**
 * Initialize default system settings
 * POST /api/admin/settings/initialize
 */
exports.initializeSettings = async (req, res) => {
  try {
    const defaultSettings = [
      {
        settingKey: 'feature_gamification',
        settingValue: true,
        valueType: 'BOOLEAN',
        category: 'FEATURE_FLAG',
        description: 'Enable gamification features (points, badges, streaks)',
      },
      {
        settingKey: 'feature_tutor_bookings',
        settingValue: true,
        valueType: 'BOOLEAN',
        category: 'FEATURE_FLAG',
        description: 'Allow live session scheduling and tutor bookings',
      },
      {
        settingKey: 'feature_public_signup',
        settingValue: true,
        valueType: 'BOOLEAN',
        category: 'FEATURE_FLAG',
        description: 'Open registration without admin approval',
      },
      {
        settingKey: 'feature_course_reviews',
        settingValue: true,
        valueType: 'BOOLEAN',
        category: 'FEATURE_FLAG',
        description: 'Enable student course ratings and reviews',
      },
      {
        settingKey: 'feature_payment_processing',
        settingValue: false,
        valueType: 'BOOLEAN',
        category: 'FEATURE_FLAG',
        description: 'Accept paid courses and sessions',
      },
      {
        settingKey: 'feature_email_notifications',
        settingValue: true,
        valueType: 'BOOLEAN',
        category: 'FEATURE_FLAG',
        description: 'Send automated email notifications',
      },
      {
        settingKey: 'gamification_quiz_points',
        settingValue: 50,
        valueType: 'INTEGER',
        category: 'GAMIFICATION',
        description: 'Points awarded for passing a quiz',
      },
      {
        settingKey: 'gamification_course_complete_points',
        settingValue: 500,
        valueType: 'INTEGER',
        category: 'GAMIFICATION',
        description: 'Points awarded for completing a course',
      },
      {
        settingKey: 'gamification_daily_cap',
        settingValue: 1000,
        valueType: 'INTEGER',
        category: 'GAMIFICATION',
        description: 'Maximum points that can be earned per day',
      },
      {
        settingKey: 'broadcast_daily_limit',
        settingValue: 5,
        valueType: 'INTEGER',
        category: 'GENERAL',
        description: 'Maximum broadcast messages per day',
      },
      {
        settingKey: 'broadcast_interval_hours',
        settingValue: 2,
        valueType: 'INTEGER',
        category: 'GENERAL',
        description: 'Minimum hours between broadcasts',
      },
    ];

    const createdSettings = [];
    for (const settingData of defaultSettings) {
      const existing = await prisma.systemSetting.findUnique({
        where: { settingKey: settingData.settingKey },
      });

      if (!existing) {
        const created = await prisma.systemSetting.create({
          data: {
            ...settingData,
            lastModifiedBy: req.user.id,
          },
        });
        createdSettings.push(created);
      }
    }

    res.json({
      success: true,
      message: `Initialized ${createdSettings.length} default settings`,
      settings: createdSettings,
    });
  } catch (error) {
    console.error('Error initializing settings:', error);
    res.status(500).json({ success: false, message: 'Failed to initialize settings' });
  }
};

// ==================== EMAIL TEMPLATES ====================

/**
 * Get all email templates
 * GET /api/admin/email-templates
 */
exports.getEmailTemplates = async (req, res) => {
  try {
    const { category, isActive } = req.query;

    const where = {};
    if (category) where.category = category;
    if (isActive !== undefined) where.isActive = isActive === 'true';

    const templates = await prisma.emailTemplate.findMany({
      where,
      orderBy: { category: 'asc' },
    });

    res.json({ success: true, templates });
  } catch (error) {
    console.error('Error fetching email templates:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch email templates' });
  }
};

/**
 * Update an email template
 * PUT /api/admin/email-templates/:id
 */
exports.updateEmailTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const { subject, bodyHtml, bodyPlain, isActive } = req.body;
    const adminId = req.user.id;

    const template = await prisma.emailTemplate.findUnique({ where: { id } });
    if (!template) {
      return res.status(404).json({ success: false, message: 'Template not found' });
    }

    const updatedTemplate = await prisma.emailTemplate.update({
      where: { id },
      data: {
        subject: subject || template.subject,
        bodyHtml: bodyHtml || template.bodyHtml,
        bodyPlain: bodyPlain || template.bodyPlain,
        isActive: isActive !== undefined ? isActive : template.isActive,
        version: template.version + 1,
      },
    });

    // Create audit log
    await logAction({
      adminId,
      actionType: ACTION_TYPES.EMAIL_TEMPLATE_UPDATE,
      targetResourceType: RESOURCE_TYPES.EMAIL_TEMPLATE,
      targetResourceId: id,
      previousState: { version: template.version },
      newState: { version: updatedTemplate.version },
      reason: `Email template ${template.templateKey} updated`,
      ipAddress: req.ip || req.connection.remoteAddress,
    });

    res.json({
      success: true,
      message: 'Email template updated successfully',
      template: updatedTemplate,
    });
  } catch (error) {
    console.error('Error updating email template:', error);
    res.status(500).json({ success: false, message: 'Failed to update email template' });
  }
};

// ==================== COURSE MODERATION ====================

/**
 * Get all courses with moderation filters
 * GET /api/admin/courses
 */
exports.getCourses = async (req, res) => {
  try {
    const {
      status,
      tutorId,
      subjectCategory,
      hasFlagsPage = 1,
      limit = 50,
      sortBy = 'updatedAt',
      sortOrder = 'desc',
    } = req.query;

    const where = {};
    if (status) where.status = status;
    if (tutorId) where.tutorId = tutorId;
    if (subjectCategory) where.subjectCategory = subjectCategory;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        where,
        include: {
          tutor: {
            select: { id: true, firstName: true, lastName: true, email: true },
          },
          _count: {
            select: { enrollments: true, lessons: true },
          },
        },
        orderBy: { [sortBy]: sortOrder },
        skip,
        take: parseInt(limit),
      }),
      prisma.course.count({ where }),
    ]);

    res.json({
      success: true,
      courses,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching courses:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch courses' });
  }
};

/**
 * Publish a course
 * PUT /api/admin/courses/:id/publish
 */
exports.publishCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;

    const course = await prisma.course.findUnique({ where: { id } });
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    const updatedCourse = await prisma.course.update({
      where: { id },
      data: {
        status: 'PUBLISHED',
        publishedAt: new Date(),
      },
    });

    // Create version snapshot
    await prisma.courseVersion.create({
      data: {
        courseId: id,
        versionNumber: (await prisma.courseVersion.count({ where: { courseId: id } })) + 1,
        changesSummary: 'Course published by admin',
        snapshotData: updatedCourse,
      },
    });

    // Create audit log
    await logAction({
      adminId,
      actionType: ACTION_TYPES.COURSE_PUBLISH,
      targetResourceType: RESOURCE_TYPES.COURSE,
      targetResourceId: id,
      previousState: { status: course.status },
      newState: { status: 'PUBLISHED' },
      reason: 'Course published',
      ipAddress: req.ip || req.connection.remoteAddress,
    });

    res.json({
      success: true,
      message: 'Course published successfully',
      course: updatedCourse,
    });
  } catch (error) {
    console.error('Error publishing course:', error);
    res.status(500).json({ success: false, message: 'Failed to publish course' });
  }
};

/**
 * Unpublish a course
 * PUT /api/admin/courses/:id/unpublish
 */
exports.unpublishCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const adminId = req.user.id;

    const course = await prisma.course.findUnique({ where: { id } });
    if (!course) {
      return res.status(404).json({ success: false, message: 'Course not found' });
    }

    const updatedCourse = await prisma.course.update({
      where: { id },
      data: { status: 'DRAFT' },
    });

    // Create audit log
    await logAction({
      adminId,
      actionType: ACTION_TYPES.COURSE_UNPUBLISH,
      targetResourceType: RESOURCE_TYPES.COURSE,
      targetResourceId: id,
      previousState: { status: course.status },
      newState: { status: 'DRAFT' },
      reason,
      ipAddress: req.ip || req.connection.remoteAddress,
    });

    res.json({
      success: true,
      message: 'Course unpublished successfully',
      course: updatedCourse,
    });
  } catch (error) {
    console.error('Error unpublishing course:', error);
    res.status(500).json({ success: false, message: 'Failed to unpublish course' });
  }
};

/**
 * Lock a course for editing
 * POST /api/admin/courses/:id/lock
 */
exports.lockCourse = async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const adminId = req.user.id;

    const courseLock = await prisma.courseLock.create({
      data: {
        courseId: id,
        lockedBy: adminId,
        lockReason: reason,
      },
    });

    // Create audit log
    await logAction({
      adminId,
      actionType: ACTION_TYPES.COURSE_LOCK,
      targetResourceType: RESOURCE_TYPES.COURSE,
      targetResourceId: id,
      reason,
      ipAddress: req.ip || req.connection.remoteAddress,
    });

    res.json({
      success: true,
      message: 'Course locked successfully',
      lock: courseLock,
    });
  } catch (error) {
    console.error('Error locking course:', error);
    res.status(500).json({ success: false, message: 'Failed to lock course' });
  }
};

// ==================== QUESTION BANK MANAGEMENT ====================

/**
 * Get question performance metrics
 * GET /api/admin/questions/performance
 */
exports.getQuestionPerformance = async (req, res) => {
  try {
    const { minCorrectRate, maxCorrectRate, page = 1, limit = 50 } = req.query;

    const where = {};
    if (minCorrectRate !== undefined || maxCorrectRate !== undefined) {
      where.correctRate = {};
      if (minCorrectRate) where.correctRate.gte = parseFloat(minCorrectRate);
      if (maxCorrectRate) where.correctRate.lte = parseFloat(maxCorrectRate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [performance, total] = await Promise.all([
      prisma.questionPerformance.findMany({
        where,
        orderBy: { correctRate: 'asc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.questionPerformance.count({ where }),
    ]);

    res.json({
      success: true,
      performance,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching question performance:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch question performance' });
  }
};

// ==================== PAYMENT MANAGEMENT ====================

/**
 * Get all transactions
 * GET /api/admin/transactions
 */
exports.getTransactions = async (req, res) => {
  try {
    const { status, type, userId, startDate, endDate, page = 1, limit = 50 } = req.query;

    const where = {};
    if (status) where.status = status;
    if (type) where.type = type;
    if (userId) where.userId = userId;

    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) where.createdAt.gte = new Date(startDate);
      if (endDate) where.createdAt.lte = new Date(endDate);
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          user: {
            select: { id: true, email: true, firstName: true, lastName: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.transaction.count({ where }),
    ]);

    res.json({
      success: true,
      transactions,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch transactions' });
  }
};

/**
 * Get webhook events
 * GET /api/admin/payment-webhooks
 */
exports.getWebhookEvents = async (req, res) => {
  try {
    const { eventType, processingStatus, page = 1, limit = 50 } = req.query;

    const where = {};
    if (eventType) where.eventType = eventType;
    if (processingStatus) where.processingStatus = processingStatus;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [events, total] = await Promise.all([
      prisma.paymentWebhookEvent.findMany({
        where,
        orderBy: { receivedAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.paymentWebhookEvent.count({ where }),
    ]);

    res.json({
      success: true,
      events,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching webhook events:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch webhook events' });
  }
};

// ==================== BROADCAST MESSAGING ====================

/**
 * Create broadcast message
 * POST /api/admin/broadcast
 */
exports.createBroadcast = async (req, res) => {
  try {
    const { targetAudience, targetRole, subject, body, priority, scheduledFor, expiresAt } =
      req.body;
    const adminId = req.user.id;

    // Check rate limits
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const todayCount = await prisma.broadcastMessage.count({
      where: {
        createdBy: adminId,
        createdAt: { gte: today },
      },
    });

    const dailyLimit = 5; // Should come from settings
    if (todayCount >= dailyLimit) {
      return res.status(429).json({
        success: false,
        message: `Daily broadcast limit reached (${dailyLimit})`,
      });
    }

    const broadcast = await prisma.broadcastMessage.create({
      data: {
        createdBy: adminId,
        targetAudience,
        targetRole,
        subject,
        body,
        priority: priority || 'NORMAL',
        scheduledFor: scheduledFor ? new Date(scheduledFor) : null,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
        status: scheduledFor ? 'SCHEDULED' : 'DRAFT',
      },
    });

    // Create audit log
    await logAction({
      adminId,
      actionType: ACTION_TYPES.BROADCAST_SCHEDULE,
      targetResourceType: RESOURCE_TYPES.BROADCAST,
      targetResourceId: broadcast.id,
      reason: `Broadcast created: ${subject}`,
      ipAddress: req.ip || req.connection.remoteAddress,
    });

    res.json({
      success: true,
      message: 'Broadcast created successfully',
      broadcast,
    });
  } catch (error) {
    console.error('Error creating broadcast:', error);
    res.status(500).json({ success: false, message: 'Failed to create broadcast' });
  }
};

/**
 * Send broadcast immediately
 * POST /api/admin/broadcast/:id/send
 */
exports.sendBroadcast = async (req, res) => {
  try {
    const { id } = req.params;
    const adminId = req.user.id;

    const broadcast = await prisma.broadcastMessage.findUnique({ where: { id } });
    if (!broadcast) {
      return res.status(404).json({ success: false, message: 'Broadcast not found' });
    }

    // Get recipients based on target audience
    const where = {};
    if (broadcast.targetAudience === 'ALL_STUDENTS') {
      where.role = 'STUDENT';
    } else if (broadcast.targetAudience === 'ALL_TUTORS') {
      where.role = 'TUTOR';
    } else if (broadcast.targetAudience === 'SPECIFIC_ROLE') {
      where.role = broadcast.targetRole;
    } else if (broadcast.targetAudience === 'ACTIVE_USERS_ONLY') {
      where.status = 'ACTIVE';
    }

    const recipients = await prisma.user.findMany({
      where,
      select: { id: true, email: true, firstName: true },
    });

    // Create notifications for all recipients
    const notifications = recipients.map((user) => ({
      userId: user.id,
      type: 'SYSTEM_ANNOUNCEMENT',
      title: broadcast.subject,
      message: broadcast.body,
      read: false,
    }));

    await prisma.notification.createMany({
      data: notifications,
    });

    // Update broadcast status
    await prisma.broadcastMessage.update({
      where: { id },
      data: {
        status: 'SENT',
        sentAt: new Date(),
        sentCount: recipients.length,
      },
    });

    // Create audit log
    await logAction({
      adminId,
      actionType: ACTION_TYPES.BROADCAST_SEND,
      targetResourceType: RESOURCE_TYPES.BROADCAST,
      targetResourceId: id,
      reason: `Broadcast sent to ${recipients.length} users`,
      ipAddress: req.ip || req.connection.remoteAddress,
    });

    res.json({
      success: true,
      message: `Broadcast sent to ${recipients.length} users`,
      recipientCount: recipients.length,
    });
  } catch (error) {
    console.error('Error sending broadcast:', error);
    res.status(500).json({ success: false, message: 'Failed to send broadcast' });
  }
};

/**
 * Get all broadcasts
 * GET /api/admin/broadcast
 */
exports.getBroadcasts = async (req, res) => {
  try {
    const { status, page = 1, limit = 50 } = req.query;

    const where = {};
    if (status) where.status = status;

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [broadcasts, total] = await Promise.all([
      prisma.broadcastMessage.findMany({
        where,
        include: {
          creator: {
            select: { firstName: true, lastName: true, email: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.broadcastMessage.count({ where }),
    ]);

    res.json({
      success: true,
      broadcasts,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching broadcasts:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch broadcasts' });
  }
};

// ==================== MANUAL ENROLLMENT MANAGEMENT ====================

/**
 * Manually enroll a user in a course
 * POST /api/admin/courses/:courseId/enroll
 */
exports.manualEnrollUser = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { userId, role } = req.body; // role can be used to enroll tutors as co-instructors
    const adminId = req.user.id;

    // Validate course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, title: true, tutorId: true }
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Validate user exists
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { id: true, firstName: true, lastName: true, email: true, role: true }
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if already enrolled
    const existingEnrollment = await prisma.enrollment.findUnique({
      where: {
        userId_courseId: {
          userId,
          courseId
        }
      }
    });

    if (existingEnrollment) {
      return res.status(400).json({
        success: false,
        message: 'User is already enrolled in this course'
      });
    }

    // Create enrollment
    const enrollment = await prisma.enrollment.create({
      data: {
        userId,
        courseId,
        enrolledAt: new Date(),
        status: 'ACTIVE'
      },
      include: {
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true
          }
        },
        course: {
          select: {
            id: true,
            title: true
          }
        }
      }
    });

    // Update course enrollment count
    await prisma.course.update({
      where: { id: courseId },
      data: {
        enrollmentCount: { increment: 1 }
      }
    });

    // Create notification for user
    await prisma.notification.create({
      data: {
        userId,
        type: 'ENROLLMENT',
        title: 'Enrolled in Course',
        message: `You have been enrolled in "${course.title}" by an administrator.`,
        link: `/student/courses/${courseId}`
      }
    });

    // Log action
    await logAction({
      adminId,
      actionType: ACTION_TYPES.USER_UPDATE,
      targetResourceType: RESOURCE_TYPES.ENROLLMENT,
      targetResourceId: enrollment.id,
      reason: `Manually enrolled ${user.email} in ${course.title}`,
      ipAddress: req.ip || req.connection.remoteAddress,
      additionalContext: {
        userId,
        courseId,
        userEmail: user.email,
        courseTitle: course.title
      }
    });

    res.status(201).json({
      success: true,
      data: enrollment,
      message: `Successfully enrolled ${user.firstName} ${user.lastName} in ${course.title}`
    });
  } catch (error) {
    console.error('Manual enrollment error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to enroll user in course' 
    });
  }
};

/**
 * Bulk enroll multiple users in a course
 * POST /api/admin/courses/:courseId/bulk-enroll
 */
exports.bulkEnrollUsers = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { userIds } = req.body; // Array of user IDs
    const adminId = req.user.id;

    if (!Array.isArray(userIds) || userIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'userIds must be a non-empty array'
      });
    }

    // Validate course exists
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { id: true, title: true }
    });

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found'
      });
    }

    // Get existing enrollments to avoid duplicates
    const existingEnrollments = await prisma.enrollment.findMany({
      where: {
        courseId,
        userId: { in: userIds }
      },
      select: { userId: true }
    });

    const existingUserIds = new Set(existingEnrollments.map(e => e.userId));
    const newUserIds = userIds.filter(id => !existingUserIds.has(id));

    if (newUserIds.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'All specified users are already enrolled'
      });
    }

    // Get user details for notifications
    const users = await prisma.user.findMany({
      where: { id: { in: newUserIds } },
      select: { id: true, firstName: true, lastName: true, email: true }
    });

    // Create enrollments and notifications in transaction
    const enrollments = await prisma.$transaction(async (tx) => {
      // Create enrollments
      const createdEnrollments = await Promise.all(
        newUserIds.map(userId =>
          tx.enrollment.create({
            data: {
              userId,
              courseId,
              enrolledAt: new Date(),
              status: 'ACTIVE'
            }
          })
        )
      );

      // Update course enrollment count
      await tx.course.update({
        where: { id: courseId },
        data: {
          enrollmentCount: { increment: newUserIds.length }
        }
      });

      // Create notifications
      await Promise.all(
        newUserIds.map(userId =>
          tx.notification.create({
            data: {
              userId,
              type: 'ENROLLMENT',
              title: 'Enrolled in Course',
              message: `You have been enrolled in "${course.title}" by an administrator.`,
              link: `/student/courses/${courseId}`
            }
          })
        )
      );

      return createdEnrollments;
    });

    // Log action
    await logAction({
      adminId,
      actionType: ACTION_TYPES.USER_UPDATE,
      targetResourceType: RESOURCE_TYPES.COURSE,
      targetResourceId: courseId,
      reason: `Bulk enrolled ${newUserIds.length} users in ${course.title}`,
      ipAddress: req.ip || req.connection.remoteAddress,
      additionalContext: {
        enrolledCount: newUserIds.length,
        skippedCount: userIds.length - newUserIds.length,
        courseId,
        courseTitle: course.title
      }
    });

    res.status(201).json({
      success: true,
      data: {
        enrolledCount: newUserIds.length,
        skippedCount: userIds.length - newUserIds.length,
        enrollments
      },
      message: `Successfully enrolled ${newUserIds.length} users. ${userIds.length - newUserIds.length} already enrolled.`
    });
  } catch (error) {
    console.error('Bulk enrollment error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to perform bulk enrollment' 
    });
  }
};

/**
 * Remove enrollment
 * DELETE /api/admin/enrollments/:enrollmentId
 */
exports.removeEnrollment = async (req, res) => {
  try {
    const { enrollmentId } = req.params;
    const adminId = req.user.id;

    // Get enrollment details
    const enrollment = await prisma.enrollment.findUnique({
      where: { id: enrollmentId },
      include: {
        user: {
          select: { id: true, firstName: true, lastName: true, email: true }
        },
        course: {
          select: { id: true, title: true }
        }
      }
    });

    if (!enrollment) {
      return res.status(404).json({
        success: false,
        message: 'Enrollment not found'
      });
    }

    // Delete enrollment
    await prisma.$transaction(async (tx) => {
      await tx.enrollment.delete({
        where: { id: enrollmentId }
      });

      // Update course enrollment count
      await tx.course.update({
        where: { id: enrollment.courseId },
        data: {
          enrollmentCount: { decrement: 1 }
        }
      });

      // Create notification
      await tx.notification.create({
        data: {
          userId: enrollment.userId,
          type: 'SYSTEM_ANNOUNCEMENT',
          title: 'Enrollment Removed',
          message: `Your enrollment in "${enrollment.course.title}" has been removed by an administrator.`,
          link: '/student/courses'
        }
      });
    });

    // Log action
    await logAction({
      adminId,
      actionType: ACTION_TYPES.USER_UPDATE,
      targetResourceType: RESOURCE_TYPES.ENROLLMENT,
      targetResourceId: enrollmentId,
      reason: `Removed enrollment for ${enrollment.user.email} from ${enrollment.course.title}`,
      ipAddress: req.ip || req.connection.remoteAddress
    });

    res.json({
      success: true,
      message: `Enrollment removed successfully`
    });
  } catch (error) {
    console.error('Remove enrollment error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to remove enrollment' 
    });
  }
};
