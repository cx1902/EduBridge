const prisma = require('../utils/prisma');

// Get received messages (Inbox)
exports.getInbox = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    // Execute queries sequentially for debugging purposes and better error isolation
    const messages = await prisma.inboxMessage.findMany({
      where: {
        receiverId: userId,
        isArchived: false,
      },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            profilePictureUrl: true,
            role: true
          }
        },
        course: {
          select: {
            id: true,
            title: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limit
    });

    const total = await prisma.inboxMessage.count({
      where: {
        receiverId: userId,
        isArchived: false,
      }
    });

    // Count unread
    const unreadCount = await prisma.inboxMessage.count({
      where: {
        receiverId: userId,
        isRead: false,
        isArchived: false,
      }
    });

    res.json({
      success: true,
      data: messages,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      },
      unreadCount
    });
  } catch (error) {
    console.error('Get Inbox Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to fetch inbox', 
      error: process.env.NODE_ENV === 'development' ? error.message : undefined 
    });
  }
};

// Get sent messages
exports.getSent = async (req, res) => {
  try {
    const userId = req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 20;
    const skip = (page - 1) * limit;

    const messages = await prisma.inboxMessage.findMany({
      where: {
        senderId: userId,
      },
      include: {
        receiver: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            profilePictureUrl: true,
            role: true
          }
        },
        course: {
          select: {
            id: true,
            title: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      },
      skip,
      take: limit
    });

    const total = await prisma.inboxMessage.count({
      where: {
        senderId: userId,
      }
    });

    res.json({
      success: true,
      data: messages,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Get Sent Messages Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch sent messages' });
  }
};

// Send a message
exports.sendMessage = async (req, res) => {
  try {
    const senderId = req.user.id;
    const { receiverId, subject, content, type, courseId } = req.body;

    console.log('SendMessage Request:', { senderId, receiverId, type, courseId }); // Debug Log

    // Validation
    if (!subject || !content) {
      return res.status(400).json({ success: false, message: 'Subject and content are required' });
    }

    // Handle "Class Update" bulk send
    if (type === 'CLASS_UPDATE' && courseId) {
      // Verify sender is the tutor of the course (or admin)
      const course = await prisma.course.findUnique({
        where: { id: courseId },
        include: {
          enrollments: {
            where: { status: 'ACTIVE' },
            select: { userId: true }
          }
        }
      });

      if (!course) {
        return res.status(404).json({ success: false, message: 'Course not found' });
      }

      if (course.tutorId !== senderId && req.user.role !== 'ADMIN') {
        return res.status(403).json({ success: false, message: 'Not authorized to send updates for this course' });
      }

      // Create messages for all enrolled students
      const messages = course.enrollments
        .filter(enrollment => enrollment.userId !== senderId)
        .map(enrollment => ({
          senderId,
          receiverId: enrollment.userId,
          subject,
          content,
          type: 'CLASS_UPDATE',
          courseId
        }));

      if (messages.length > 0) {
        await prisma.inboxMessage.createMany({
          data: messages
        });
      }

      return res.json({
        success: true,
        message: `Update sent to ${messages.length} students`
      });
    }
    
    // Handle "Admin Ticket"
    if (type === 'ADMIN_TICKET') {
      // Find an admin to receive the message
      // For now, let's just pick the first admin found
      // Ideally, there should be a dedicated support user or group
      const admin = await prisma.user.findFirst({
        where: { role: 'ADMIN' }
      });

      if (!admin) {
         // Fallback: If no admin exists, create a dummy admin or return error
         // Ideally, you should have at least one admin seeded
         return res.status(404).json({ success: false, message: 'No admin available to receive ticket' });
      }

      const message = await prisma.inboxMessage.create({
        data: {
          senderId,
          receiverId: admin.id,
          subject,
          content,
          type: 'ADMIN_TICKET',
          courseId: courseId || null // Ensure null if undefined
        }
      });

      return res.json({ success: true, data: message });
    }

    // Handle Standard Direct Message
    if (!receiverId) {
      return res.status(400).json({ success: false, message: 'Receiver is required' });
    }

    const message = await prisma.inboxMessage.create({
      data: {
        senderId,
        receiverId,
        subject,
        content,
        type: type || 'GENERAL',
        courseId: courseId || null // Ensure null if undefined
      }
    });

    res.json({ success: true, data: message });

  } catch (error) {
    console.error('Send Message Error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send message',
      error: error.message,
      stack: error.stack // Expose stack for debugging
    });
  }
};

// Mark message as read
exports.markAsRead = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const message = await prisma.inboxMessage.findUnique({
      where: { id }
    });

    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    if (message.receiverId !== userId) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    await prisma.inboxMessage.update({
      where: { id },
      data: { isRead: true }
    });

    res.json({ success: true });
  } catch (error) {
    console.error('Mark Read Error:', error);
    res.status(500).json({ success: false, message: 'Failed to update message' });
  }
};

// Get single message details
exports.getMessage = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const message = await prisma.inboxMessage.findUnique({
      where: { id },
      include: {
        sender: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            profilePictureUrl: true,
            role: true
          }
        },
        receiver: {
          select: {
             id: true,
             firstName: true,
             lastName: true,
             email: true,
             profilePictureUrl: true,
             role: true
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

    if (!message) {
      return res.status(404).json({ success: false, message: 'Message not found' });
    }

    // Check authorization (sender or receiver)
    if (message.receiverId !== userId && message.senderId !== userId) {
      return res.status(403).json({ success: false, message: 'Not authorized' });
    }

    // If receiver opens it, mark as read
    if (message.receiverId === userId && !message.isRead) {
      await prisma.inboxMessage.update({
        where: { id },
        data: { isRead: true }
      });
      message.isRead = true;
    }

    res.json({ success: true, data: message });
  } catch (error) {
    console.error('Get Message Error:', error);
    res.status(500).json({ success: false, message: 'Failed to fetch message' });
  }
};
