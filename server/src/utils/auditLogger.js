const prisma = require('./prisma');

/**
 * Audit Logger Utility
 * Creates audit log entries for administrative actions
 */

/**
 * Log an administrative action
 * @param {Object} params - Audit log parameters
 * @param {string} params.adminId - ID of the admin performing the action
 * @param {string} params.actionType - Type of action (e.g., 'USER_ROLE_CHANGE', 'COURSE_PUBLISH')
 * @param {string} params.targetResourceType - Type of resource affected (e.g., 'USER', 'COURSE')
 * @param {string} params.targetResourceId - ID of the affected resource
 * @param {Object} params.previousState - State before the action
 * @param {Object} params.newState - State after the action
 * @param {string} params.reason - Justification for the action
 * @param {string} params.ipAddress - IP address of the admin
 * @param {Object} params.additionalContext - Any additional context data
 * @returns {Promise<Object>} Created audit log entry
 */
async function logAction({
  adminId,
  actionType,
  targetResourceType,
  targetResourceId = null,
  previousState = null,
  newState = null,
  reason = null,
  ipAddress = null,
  additionalContext = null,
}) {
  try {
    const auditLog = await prisma.auditLog.create({
      data: {
        adminId,
        actionType,
        targetResourceType,
        targetResourceId,
        previousState,
        newState,
        reason,
        ipAddress,
        additionalContext,
      },
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
    });

    return auditLog;
  } catch (error) {
    console.error('Failed to create audit log:', error);
    // Don't throw - we don't want audit logging failures to break the main action
    return null;
  }
}

/**
 * Query audit logs with filters
 * @param {Object} filters - Query filters
 * @param {string} filters.adminId - Filter by admin ID
 * @param {string} filters.actionType - Filter by action type
 * @param {string} filters.targetResourceType - Filter by resource type
 * @param {Date} filters.startDate - Start of date range
 * @param {Date} filters.endDate - End of date range
 * @param {string} filters.searchTerm - Search in reason field
 * @param {number} filters.page - Page number (1-indexed)
 * @param {number} filters.limit - Items per page
 * @returns {Promise<Object>} Audit logs and pagination info
 */
async function queryLogs(filters = {}) {
  const {
    adminId,
    actionType,
    targetResourceType,
    startDate,
    endDate,
    searchTerm,
    page = 1,
    limit = 50,
  } = filters;

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

  const skip = (page - 1) * limit;

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
      take: limit,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return {
    logs,
    pagination: {
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    },
  };
}

/**
 * Export audit logs to CSV format
 * @param {Object} filters - Same filters as queryLogs
 * @returns {Promise<string>} CSV string
 */
async function exportToCSV(filters = {}) {
  const { logs } = await queryLogs({ ...filters, limit: 10000 }); // Large limit for export

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

  return csvContent;
}

/**
 * Get audit log statistics
 * @param {Date} startDate - Start date for statistics
 * @param {Date} endDate - End date for statistics
 * @returns {Promise<Object>} Statistics object
 */
async function getStatistics(startDate, endDate) {
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

  return {
    totalActions,
    actionsByType: actionsByType.map((item) => ({
      actionType: item.actionType,
      count: item._count,
    })),
    actionsByAdmin: actionsByAdmin.map((item) => ({
      adminId: item.adminId,
      count: item._count,
    })),
  };
}

// Predefined action types for consistency
const ACTION_TYPES = {
  // User Management
  USER_ROLE_CHANGE: 'USER_ROLE_CHANGE',
  USER_STATUS_CHANGE: 'USER_STATUS_CHANGE',
  USER_PASSWORD_RESET: 'USER_PASSWORD_RESET',
  USER_DELETE: 'USER_DELETE',

  // Tutor Verification
  TUTOR_APPLICATION_APPROVE: 'TUTOR_APPLICATION_APPROVE',
  TUTOR_APPLICATION_DECLINE: 'TUTOR_APPLICATION_DECLINE',
  TUTOR_APPLICATION_REQUEST_CHANGES: 'TUTOR_APPLICATION_REQUEST_CHANGES',

  // Content Moderation
  COURSE_PUBLISH: 'COURSE_PUBLISH',
  COURSE_UNPUBLISH: 'COURSE_UNPUBLISH',
  COURSE_ARCHIVE: 'COURSE_ARCHIVE',
  COURSE_LOCK: 'COURSE_LOCK',
  COURSE_UNLOCK: 'COURSE_UNLOCK',
  COURSE_VERSION_REVERT: 'COURSE_VERSION_REVERT',

  // Report Management
  REPORT_DISMISS: 'REPORT_DISMISS',
  REPORT_REQUIRE_EDIT: 'REPORT_REQUIRE_EDIT',
  REPORT_HIDE_CONTENT: 'REPORT_HIDE_CONTENT',
  REPORT_WARN_USER: 'REPORT_WARN_USER',

  // Question Bank
  QUESTION_EDIT: 'QUESTION_EDIT',
  QUESTION_ARCHIVE: 'QUESTION_ARCHIVE',
  QUESTION_RESTORE: 'QUESTION_RESTORE',

  // System Settings
  FEATURE_FLAG_TOGGLE: 'FEATURE_FLAG_TOGGLE',
  SETTING_UPDATE: 'SETTING_UPDATE',
  EMAIL_TEMPLATE_UPDATE: 'EMAIL_TEMPLATE_UPDATE',

  // Broadcast
  BROADCAST_SEND: 'BROADCAST_SEND',
  BROADCAST_SCHEDULE: 'BROADCAST_SCHEDULE',
  BROADCAST_CANCEL: 'BROADCAST_CANCEL',

  // Payment
  REFUND_INITIATE: 'REFUND_INITIATE',
  DISPUTE_NOTE_ADD: 'DISPUTE_NOTE_ADD',
};

// Resource types
const RESOURCE_TYPES = {
  USER: 'USER',
  COURSE: 'COURSE',
  LESSON: 'LESSON',
  QUIZ: 'QUIZ',
  QUESTION: 'QUESTION',
  REPORT: 'REPORT',
  SETTING: 'SETTING',
  EMAIL_TEMPLATE: 'EMAIL_TEMPLATE',
  BROADCAST: 'BROADCAST',
  TRANSACTION: 'TRANSACTION',
  TUTOR_APPLICATION: 'TUTOR_APPLICATION',
};

module.exports = {
  logAction,
  queryLogs,
  exportToCSV,
  getStatistics,
  ACTION_TYPES,
  RESOURCE_TYPES,
};
