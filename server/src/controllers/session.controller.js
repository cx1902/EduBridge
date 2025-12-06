/**
 * Session Controller
 * Handles tutoring session scheduling, invitations, and student responses
 */

const prisma = require('../utils/prisma');
const emailService = require('../utils/emailService');

/**
 * Create a new tutoring session
 * POST /api/sessions
 */
const createSession = async (req, res) => {
  try {
    const { user } = req;
    const {
      subject,
      educationLevel,
      scheduledStart,
      scheduledEnd,
      maxParticipants,
      pricePerStudent,
      sessionType,
      videoRoomId,
    } = req.body;

    // Verify user is a tutor
    if (user.role !== 'TUTOR') {
      return res.status(403).json({
        success: false,
        message: 'Only tutors can create sessions',
      });
    }

    // Create session
    const session = await prisma.tutoringSession.create({
      data: {
        tutorId: user.id,
        subject,
        educationLevel,
        scheduledStart: new Date(scheduledStart),
        scheduledEnd: new Date(scheduledEnd),
        maxParticipants,
        pricePerStudent,
        sessionType,
        videoRoomId,
        status: 'SCHEDULED',
      },
    });

    res.status(201).json({
      success: true,
      message: 'Session created successfully',
      data: session,
    });
  } catch (error) {
    console.error('Error creating session:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to create session',
      error: error.message,
    });
  }
};

/**
 * Send invitations to enrolled students for a session
 * POST /api/sessions/:sessionId/invite
 */
const sendInvitations = async (req, res) => {
  try {
    const { user } = req;
    const { sessionId } = req.params;
    const { studentIds } = req.body;

    // Verify session exists and belongs to tutor
    const session = await prisma.tutoringSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found',
      });
    }

    if (session.tutorId !== user.id && user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to send invitations for this session',
      });
    }

    // Validate that all students are enrolled in tutor's courses
    const enrollments = await prisma.enrollment.findMany({
      where: {
        userId: { in: studentIds },
        course: {
          tutorId: user.id,
        },
        status: 'ACTIVE',
      },
      select: {
        userId: true,
      },
    });

    const enrolledStudentIds = enrollments.map(e => e.userId);
    const unenrolledStudentIds = studentIds.filter(id => !enrolledStudentIds.includes(id));

    if (unenrolledStudentIds.length > 0) {
      return res.status(400).json({
        success: false,
        message: 'Some students are not enrolled in your courses',
        unenrolledStudentIds,
      });
    }

    // Send invitations
    const result = await emailService.sendSessionInvitations(sessionId, studentIds);

    // Create notification for each student
    await prisma.notification.createMany({
      data: studentIds.map(studentId => ({
        userId: studentId,
        type: 'SESSION_INVITATION',
        title: 'New Class Session Scheduled',
        message: `${user.firstName} ${user.lastName} has scheduled a new session: ${session.subject}`,
        link: `/student/sessions/${sessionId}`,
      })),
    });

    res.status(200).json({
      success: true,
      message: `Invitations sent to ${result.sent} students`,
      data: result,
    });
  } catch (error) {
    console.error('Error sending invitations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send invitations',
      error: error.message,
    });
  }
};

/**
 * Get email tracking status for a session
 * GET /api/sessions/:sessionId/email-status
 */
const getEmailStatus = async (req, res) => {
  try {
    const { user } = req;
    const { sessionId } = req.params;

    // Verify session belongs to tutor
    const session = await prisma.tutoringSession.findUnique({
      where: { id: sessionId },
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        message: 'Session not found',
      });
    }

    if (session.tutorId !== user.id && user.role !== 'ADMIN') {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    // Fetch email tracking data
    const emailTracking = await prisma.sessionEmailTracking.findMany({
      where: { sessionId },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
      orderBy: {
        sentAt: 'desc',
      },
    });

    // Fetch student responses
    const responses = await prisma.studentSessionResponse.findMany({
      where: { sessionId },
      include: {
        student: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
          },
        },
      },
    });

    res.status(200).json({
      success: true,
      data: {
        emailTracking,
        responses,
      },
    });
  } catch (error) {
    console.error('Error fetching email status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch email status',
      error: error.message,
    });
  }
};

/**
 * Resend invitation to specific student
 * POST /api/sessions/:sessionId/resend
 */
const resendInvitation = async (req, res) => {
  try {
    const { user } = req;
    const { sessionId } = req.params;
    const { studentId } = req.body;

    // Verify session belongs to tutor
    const session = await prisma.tutoringSession.findUnique({
      where: { id: sessionId },
    });

    if (!session || session.tutorId !== user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    // Resend invitation
    const result = await emailService.sendSessionInvitations(sessionId, [studentId]);

    res.status(200).json({
      success: true,
      message: 'Invitation resent successfully',
      data: result,
    });
  } catch (error) {
    console.error('Error resending invitation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to resend invitation',
      error: error.message,
    });
  }
};

/**
 * Send reminder to participants
 * POST /api/sessions/:sessionId/remind
 */
const sendReminder = async (req, res) => {
  try {
    const { user } = req;
    const { sessionId } = req.params;
    const { timeframe } = req.body; // e.g., "1 hour", "24 hours"

    // Verify session belongs to tutor
    const session = await prisma.tutoringSession.findUnique({
      where: { id: sessionId },
    });

    if (!session || session.tutorId !== user.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    }

    // Send reminders
    const result = await emailService.sendSessionReminder(sessionId, timeframe || '1 hour');

    res.status(200).json({
      success: true,
      message: 'Reminders sent successfully',
      data: result,
    });
  } catch (error) {
    console.error('Error sending reminders:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send reminders',
      error: error.message,
    });
  }
};

/**
 * Confirm attendance to a session (Student)
 * POST /api/sessions/:sessionId/confirm
 */
const confirmAttendance = async (req, res) => {
  try {
    const { user } = req;
    const { sessionId } = req.params;

    // Check if response already exists
    const existingResponse = await prisma.studentSessionResponse.findFirst({
      where: {
        sessionId,
        studentId: user.id,
      },
    });

    if (existingResponse) {
      // Update existing response
      const updated = await prisma.studentSessionResponse.update({
        where: { id: existingResponse.id },
        data: {
          responseType: 'CONFIRMED',
          responseAt: new Date(),
        },
      });

      // Update email tracking status
      await prisma.sessionEmailTracking.updateMany({
        where: {
          sessionId,
          studentId: user.id,
        },
        data: {
          responseStatus: 'CONFIRMED',
        },
      });

      // Notify tutor
      const session = await prisma.tutoringSession.findUnique({
        where: { id: sessionId },
      });

      await prisma.notification.create({
        data: {
          userId: session.tutorId,
          type: 'SESSION_CONFIRMED',
          title: 'Student Confirmed Attendance',
          message: `${user.firstName} ${user.lastName} confirmed attendance for ${session.subject}`,
          link: `/tutor/sessions/${sessionId}`,
        },
      });

      return res.status(200).json({
        success: true,
        message: 'Attendance confirmed',
        data: updated,
      });
    }

    // Create new response
    const response = await prisma.studentSessionResponse.create({
      data: {
        sessionId,
        studentId: user.id,
        responseType: 'CONFIRMED',
      },
    });

    // Update email tracking
    await prisma.sessionEmailTracking.updateMany({
      where: {
        sessionId,
        studentId: user.id,
      },
      data: {
        responseStatus: 'CONFIRMED',
      },
    });

    // Notify tutor
    const session = await prisma.tutoringSession.findUnique({
      where: { id: sessionId },
    });

    await prisma.notification.create({
      data: {
        userId: session.tutorId,
        type: 'SESSION_CONFIRMED',
        title: 'Student Confirmed Attendance',
        message: `${user.firstName} ${user.lastName} confirmed attendance for ${session.subject}`,
        link: `/tutor/sessions/${sessionId}`,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Attendance confirmed successfully',
      data: response,
    });
  } catch (error) {
    console.error('Error confirming attendance:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to confirm attendance',
      error: error.message,
    });
  }
};

/**
 * Decline session invitation (Student)
 * POST /api/sessions/:sessionId/decline
 */
const declineInvitation = async (req, res) => {
  try {
    const { user } = req;
    const { sessionId } = req.params;
    const { reason } = req.body;

    const response = await prisma.studentSessionResponse.create({
      data: {
        sessionId,
        studentId: user.id,
        responseType: 'DECLINED',
        declineReason: reason,
      },
    });

    // Update email tracking
    await prisma.sessionEmailTracking.updateMany({
      where: {
        sessionId,
        studentId: user.id,
      },
      data: {
        responseStatus: 'DECLINED',
      },
    });

    // Notify tutor
    const session = await prisma.tutoringSession.findUnique({
      where: { id: sessionId },
    });

    await prisma.notification.create({
      data: {
        userId: session.tutorId,
        type: 'SESSION_DECLINED',
        title: 'Student Declined Session',
        message: `${user.firstName} ${user.lastName} declined the session: ${session.subject}${reason ? `. Reason: ${reason}` : ''}`,
        link: `/tutor/sessions/${sessionId}`,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Invitation declined',
      data: response,
    });
  } catch (error) {
    console.error('Error declining invitation:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to decline invitation',
      error: error.message,
    });
  }
};

/**
 * Request reschedule (Student)
 * POST /api/sessions/:sessionId/reschedule
 */
const requestReschedule = async (req, res) => {
  try {
    const { user } = req;
    const { sessionId } = req.params;
    const { reason, preferredTimes } = req.body;

    const response = await prisma.studentSessionResponse.create({
      data: {
        sessionId,
        studentId: user.id,
        responseType: 'RESCHEDULE_REQUEST',
        rescheduleReason: reason,
        preferredTimes: preferredTimes || [],
      },
    });

    // Notify tutor
    const session = await prisma.tutoringSession.findUnique({
      where: { id: sessionId },
    });

    await prisma.notification.create({
      data: {
        userId: session.tutorId,
        type: 'SESSION_DECLINED',
        title: 'Reschedule Request',
        message: `${user.firstName} ${user.lastName} requested to reschedule ${session.subject}`,
        link: `/tutor/sessions/${sessionId}/reschedule-requests`,
      },
    });

    res.status(201).json({
      success: true,
      message: 'Reschedule request submitted',
      data: response,
    });
  } catch (error) {
    console.error('Error requesting reschedule:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to submit reschedule request',
      error: error.message,
    });
  }
};

/**
 * Get all pending invitations for student
 * GET /api/sessions/invitations
 */
const getPendingInvitations = async (req, res) => {
  try {
    const { user } = req;

    // Get email tracking records where student has pending response
    const pendingEmails = await prisma.sessionEmailTracking.findMany({
      where: {
        studentId: user.id,
        responseStatus: 'PENDING',
        emailType: 'INVITATION',
      },
      include: {
        session: {
          include: {
            tutor: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                profilePictureUrl: true,
              },
            },
          },
        },
      },
      orderBy: {
        sentAt: 'desc',
      },
    });

    res.status(200).json({
      success: true,
      data: pendingEmails,
    });
  } catch (error) {
    console.error('Error fetching pending invitations:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch pending invitations',
      error: error.message,
    });
  }
};

/**
 * Get available sessions for booking
 * GET /api/sessions
 */
const getAvailableSessions = async (req, res) => {
  try {
    const { subject, educationLevel, sessionType, startDate, endDate, limit = 20, offset = 0 } = req.query;

    const where = {
      status: 'SCHEDULED',
      scheduledStart: {
        gte: new Date() // Only future sessions
      }
    };

    if (subject) where.subject = subject;
    if (educationLevel) where.educationLevel = educationLevel;
    if (sessionType) where.sessionType = sessionType;
    if (startDate) where.scheduledStart.gte = new Date(startDate);
    if (endDate) {
      where.scheduledStart.lte = new Date(endDate);
    }

    const [sessions, totalCount] = await Promise.all([
      prisma.tutoringSession.findMany({
        where,
        include: {
          tutor: {
            select: {
              id: true,
              firstName: true,
              lastName: true,
              profilePictureUrl: true,
              bio: true
            }
          },
          _count: {
            select: {
              bookings: {
                where: {
                  status: 'CONFIRMED'
                }
              }
            }
          }
        },
        orderBy: {
          scheduledStart: 'asc'
        },
        skip: parseInt(offset),
        take: parseInt(limit)
      }),
      prisma.tutoringSession.count({ where })
    ]);

    // Add availability info
    const sessionsWithAvailability = sessions.map(session => ({
      ...session,
      currentBookings: session._count.bookings,
      availableSlots: session.maxParticipants - session._count.bookings,
      isFull: session._count.bookings >= session.maxParticipants
    }));

    res.json({
      success: true,
      data: {
        sessions: sessionsWithAvailability,
        pagination: {
          limit: parseInt(limit),
          offset: parseInt(offset),
          total: totalCount
        }
      }
    });
  } catch (error) {
    console.error('Get available sessions error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_SESSIONS_ERROR',
        message: 'Failed to fetch available sessions',
        details: error.message
      }
    });
  }
};

/**
 * Book a session
 * POST /api/sessions/:id/book
 */
const bookSession = async (req, res) => {
  try {
    const { id: sessionId } = req.params;
    const userId = req.user.userId;

    // Get session details
    const session = await prisma.tutoringSession.findUnique({
      where: { id: sessionId },
      include: {
        tutor: {
          select: {
            id: true,
            firstName: true,
            lastName: true
          }
        },
        _count: {
          select: {
            bookings: {
              where: {
                status: 'CONFIRMED'
              }
            }
          }
        }
      }
    });

    if (!session) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'SESSION_NOT_FOUND',
          message: 'Session not found'
        }
      });
    }

    if (session.status !== 'SCHEDULED') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'SESSION_NOT_AVAILABLE',
          message: 'Session is not available for booking'
        }
      });
    }

    // Check if session is full
    if (session._count.bookings >= session.maxParticipants) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'SESSION_FULL',
          message: 'Session is fully booked',
          details: `Maximum ${session.maxParticipants} participants allowed`
        }
      });
    }

    // Check if already booked
    const existingBooking = await prisma.sessionBooking.findFirst({
      where: {
        studentId: userId,
        sessionId,
        status: { in: ['CONFIRMED', 'COMPLETED'] }
      }
    });

    if (existingBooking) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'ALREADY_BOOKED',
          message: 'You have already booked this session'
        }
      });
    }

    // Create booking
    const result = await prisma.$transaction(async (tx) => {
      const booking = await tx.sessionBooking.create({
        data: {
          studentId: userId,
          sessionId,
          status: 'CONFIRMED',
          amountPaid: parseFloat(session.pricePerStudent)
        }
      });

      // Create notifications
      await tx.notification.createMany({
        data: [
          {
            userId,
            type: 'SESSION_BOOKED',
            title: 'Session Booked Successfully',
            message: `You have booked a session: ${session.subject} on ${new Date(session.scheduledStart).toLocaleDateString()}`,
            link: `/sessions/${sessionId}`
          },
          {
            userId: session.tutorId,
            type: 'SESSION_BOOKED',
            title: 'New Session Booking',
            message: `A student has booked your session: ${session.subject}`,
            link: `/tutor/sessions/${sessionId}`
          }
        ]
      });

      return booking;
    });

    res.status(201).json({
      success: true,
      data: result,
      message: 'Session booked successfully'
    });
  } catch (error) {
    console.error('Book session error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'BOOK_SESSION_ERROR',
        message: 'Failed to book session',
        details: error.message
      }
    });
  }
};

/**
 * Get student's bookings
 * GET /api/sessions/my-bookings
 */
const getMyBookings = async (req, res) => {
  try {
    const userId = req.user.userId;
    const { status } = req.query;

    const where = { studentId: userId };
    if (status) where.status = status;

    const bookings = await prisma.sessionBooking.findMany({
      where,
      include: {
        session: {
          include: {
            tutor: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                profilePictureUrl: true
              }
            }
          }
        }
      },
      orderBy: {
        session: {
          scheduledStart: 'desc'
        }
      }
    });

    res.json({
      success: true,
      data: bookings
    });
  } catch (error) {
    console.error('Get my bookings error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'GET_BOOKINGS_ERROR',
        message: 'Failed to fetch bookings',
        details: error.message
      }
    });
  }
};

/**
 * Cancel a booking
 * POST /api/sessions/bookings/:id/cancel
 */
const cancelBooking = async (req, res) => {
  try {
    const { id: bookingId } = req.params;
    const userId = req.user.userId;

    // Get booking
    const booking = await prisma.sessionBooking.findUnique({
      where: { id: bookingId },
      include: {
        session: {
          include: {
            tutor: {
              select: {
                id: true,
                firstName: true,
                lastName: true
              }
            }
          }
        }
      }
    });

    if (!booking) {
      return res.status(404).json({
        success: false,
        error: {
          code: 'BOOKING_NOT_FOUND',
          message: 'Booking not found'
        }
      });
    }

    if (booking.studentId !== userId) {
      return res.status(403).json({
        success: false,
        error: {
          code: 'FORBIDDEN',
          message: 'You do not have permission to cancel this booking'
        }
      });
    }

    if (booking.status === 'CANCELLED') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'ALREADY_CANCELLED',
          message: 'This booking is already cancelled'
        }
      });
    }

    if (booking.status === 'COMPLETED') {
      return res.status(400).json({
        success: false,
        error: {
          code: 'SESSION_COMPLETED',
          message: 'Cannot cancel a completed session'
        }
      });
    }

    // Check cancellation policy (e.g., 24 hours before)
    const hoursUntilSession = (new Date(booking.session.scheduledStart) - new Date()) / (1000 * 60 * 60);
    if (hoursUntilSession < 24) {
      return res.status(400).json({
        success: false,
        error: {
          code: 'CANCELLATION_DEADLINE_PASSED',
          message: 'Cancellation must be made at least 24 hours before the session',
          details: `Session starts in ${Math.round(hoursUntilSession)} hours`
        }
      });
    }

    // Cancel booking
    const result = await prisma.$transaction(async (tx) => {
      const cancelledBooking = await tx.sessionBooking.update({
        where: { id: bookingId },
        data: {
          status: 'CANCELLED'
        }
      });

      // Notify tutor
      await tx.notification.create({
        data: {
          userId: booking.session.tutorId,
          type: 'SESSION_CANCELLED',
          title: 'Session Booking Cancelled',
          message: `A student has cancelled their booking for: ${booking.session.subject}`,
          link: `/tutor/sessions/${booking.sessionId}`
        }
      });

      return cancelledBooking;
    });

    res.json({
      success: true,
      data: result,
      message: 'Booking cancelled successfully'
    });
  } catch (error) {
    console.error('Cancel booking error:', error);
    res.status(500).json({
      success: false,
      error: {
        code: 'CANCEL_BOOKING_ERROR',
        message: 'Failed to cancel booking',
        details: error.message
      }
    });
  }
};

/**
 * Get today's sessions for tutor
 * GET /api/sessions/today
 */
const getTodaySessions = async (req, res) => {
  try {
    const { user } = req;

    // Verify user is a tutor
    if (user.role !== 'TUTOR') {
      return res.status(403).json({
        success: false,
        message: 'Only tutors can access this endpoint',
      });
    }

    // Get today's start and end times
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Fetch sessions for today
    const sessions = await prisma.tutoringSession.findMany({
      where: {
        tutorId: user.id,
        scheduledStart: {
          gte: today,
          lt: tomorrow,
        },
      },
      include: {
        emailTracking: {
          include: {
            student: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
          },
        },
      },
      orderBy: {
        scheduledStart: 'asc',
      },
    });

    res.status(200).json({
      success: true,
      data: sessions,
    });
  } catch (error) {
    console.error('Error fetching today\'s sessions:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to fetch today\'s sessions',
      error: error.message,
    });
  }
};

module.exports = {
  createSession,
  sendInvitations,
  getEmailStatus,
  resendInvitation,
  sendReminder,
  confirmAttendance,
  declineInvitation,
  requestReschedule,
  getPendingInvitations,
  getAvailableSessions,
  bookSession,
  getMyBookings,
  cancelBooking,
  getTodaySessions,
};
