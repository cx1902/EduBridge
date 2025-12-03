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
};
