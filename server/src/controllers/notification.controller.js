const prisma = require('../utils/prisma');

// Get user notifications
exports.getNotifications = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { limit = 20, offset = 0, unreadOnly = false } = req.query;

    const where = { userId };
    if (unreadOnly === 'true') {
      where.read = false;
    }

    const [notifications, totalCount, unreadCount] = await Promise.all([
      prisma.notification.findMany({
        where,
        orderBy: {
          createdAt: 'desc'
        },
        skip: parseInt(offset),
        take: parseInt(limit)
      }),
      prisma.notification.count({ where }),
      prisma.notification.count({
        where: {
          userId,
          read: false
        }
      })
    ]);

    res.json({
      success: true,
      data: {
        notifications,
        unreadCount,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: totalCount
        }
      }
    });
  } catch (error) {
    console.error('Get notifications error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_NOTIFICATIONS_ERROR',
        message: 'Failed to fetch notifications',
        details: error.message
      }
    });
  }
};

// Mark notification as read
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // Verify ownership
    const notification = await prisma.notification.findUnique({
      where: { id }
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOTIFICATION_NOT_FOUND',
          message: 'Notification not found'
        }
      });
    }

    if (notification.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to update this notification'
        }
      });
    }

    const updatedNotification = await prisma.notification.update({
      where: { id },
      data: { read: true }
    });

    res.json({
      success: true,
      data: updatedNotification,
      message: 'Notification marked as read'
    });
  } catch (error) {
    console.error('Mark notification as read error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'MARK_READ_ERROR',
        message: 'Failed to mark notification as read',
        details: error.message
      }
    });
  }
};

// Mark all notifications as read
exports.markAllAsRead = async (req, res) => {
  try {
    const userId = req.user.userId;

    await prisma.notification.updateMany({
      where: {
        userId,
        read: false
      },
      data: {
        read: true
      }
    });

    res.json({
      success: true,
      message: 'All notifications marked as read'
    });
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'MARK_ALL_READ_ERROR',
        message: 'Failed to mark all notifications as read',
        details: error.message
      }
    });
  }
};

// Delete notification
exports.deleteNotification = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // Verify ownership
    const notification = await prisma.notification.findUnique({
      where: { id }
    });

    if (!notification) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'NOTIFICATION_NOT_FOUND',
          message: 'Notification not found'
        }
      });
    }

    if (notification.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to delete this notification'
        }
      });
    }

    await prisma.notification.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Notification deleted successfully'
    });
  } catch (error) {
    console.error('Delete notification error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'DELETE_NOTIFICATION_ERROR',
        message: 'Failed to delete notification',
        details: error.message
      }
    });
  }
};
