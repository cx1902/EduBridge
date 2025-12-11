/**
 * Email Service Utility
 * Handles sending email notifications for tutoring sessions and authentication
 */

const nodemailer = require('nodemailer');
const prisma = require('./prisma');

/**
 * Create email transporter
 */
function createTransporter() {
  // For development, you can use Gmail or other SMTP services
  // For production, use services like SendGrid, AWS SES, or Mailgun
  
  // Check if real SMTP credentials are configured (not example values)
  const hasValidSMTP = 
    process.env.SMTP_HOST && 
    process.env.SMTP_USER && 
    process.env.SMTP_PASS &&
    !process.env.SMTP_HOST.includes('example.com') &&
    !process.env.SMTP_USER.includes('example.com');
  
  if (hasValidSMTP) {
    // Use configured SMTP service
    console.log('✉️  Using configured SMTP service:', process.env.SMTP_HOST);
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  } else {
    // For development without SMTP config, use ethereal email (testing service)
    console.warn('⚠️  No valid SMTP credentials found. Using Ethereal test email service.');
    console.warn('⚠️  Emails will not be delivered to real inboxes. Check console for preview URLs.');
    return null; // Will be created async in sendEmail function
  }
}

let transporter = createTransporter();

/**
 * Email templates for different notification types
 */
const EMAIL_TEMPLATES = {
  SESSION_INVITATION: {
    subject: (data) => `[${data.courseName}] - New Class Session: ${data.topic} on ${data.date}`,
    body: (data) => `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #4f46e5; color: white; padding: 20px; text-align: center; }
            .content { background: #f9fafb; padding: 30px; }
            .session-details { background: white; padding: 20px; margin: 20px 0; border-radius: 8px; }
            .detail-row { display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid #e5e7eb; }
            .cta-button { display: inline-block; background: #4f46e5; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 10px 5px; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📚 New Class Session Scheduled</h1>
            </div>
            <div class="content">
              <p>Hi ${data.studentName},</p>
              <p><strong>${data.tutorName}</strong> has scheduled a new class session for you!</p>
              
              <div class="session-details">
                <h3>Session Details</h3>
                <div class="detail-row">
                  <span><strong>Course:</strong></span>
                  <span>${data.courseName}</span>
                </div>
                <div class="detail-row">
                  <span><strong>Topic:</strong></span>
                  <span>${data.topic}</span>
                </div>
                <div class="detail-row">
                  <span><strong>Date & Time:</strong></span>
                  <span>${data.date} at ${data.time}</span>
                </div>
                <div class="detail-row">
                  <span><strong>Duration:</strong></span>
                  <span>${data.duration}</span>
                </div>
                <div class="detail-row">
                  <span><strong>Session Type:</strong></span>
                  <span>${data.sessionType}</span>
                </div>
              </div>

              ${data.objectives ? `<p><strong>Learning Objectives:</strong><br/>${data.objectives}</p>` : ''}
              
              <div style="text-align: center; margin: 30px 0;">
                <a href="${data.confirmLink}" class="cta-button">Confirm Attendance</a>
                <a href="${data.viewDetailsLink}" class="cta-button" style="background: #6b7280;">View Details</a>
              </div>

              <p><em>A calendar invite has been attached to help you remember this session.</em></p>
            </div>
            <div class="footer">
              <p>EduBridge Learning Platform</p>
              <p><a href="${data.rescheduleLink}">Request Reschedule</a> | <a href="${data.unsubscribeLink}">Notification Preferences</a></p>
            </div>
          </div>
        </body>
      </html>
    `,
  },
  
  SESSION_REMINDER: {
    subject: (data) => `Reminder: ${data.topic} session starting in ${data.timeframe}`,
    body: (data) => `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #f59e0b; color: white; padding: 20px; text-align: center; }
            .content { background: #f9fafb; padding: 30px; }
            .reminder-box { background: #fef3c7; padding: 20px; margin: 20px 0; border-left: 4px solid #f59e0b; }
            .cta-button { display: inline-block; background: #f59e0b; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>⏰ Session Reminder</h1>
            </div>
            <div class="content">
              <p>Hi ${data.studentName},</p>
              <div class="reminder-box">
                <h3>Your session "${data.topic}" is starting in ${data.timeframe}!</h3>
                <p><strong>Time:</strong> ${data.date} at ${data.time}</p>
                <p><strong>Tutor:</strong> ${data.tutorName}</p>
              </div>
              
              <div style="text-align: center;">
                <a href="${data.meetingLink}" class="cta-button">Join Session Now</a>
              </div>

              ${data.preparation ? `<p><strong>Quick Preparation Checklist:</strong><br/>${data.preparation}</p>` : ''}
            </div>
          </div>
        </body>
      </html>
    `,
  },

  SESSION_UPDATE: {
    subject: (data) => `Session Update: ${data.topic} - ${data.changeType}`,
    body: (data) => `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #3b82f6; color: white; padding: 20px; text-align: center; }
            .content { background: #f9fafb; padding: 30px; }
            .update-box { background: #dbeafe; padding: 20px; margin: 20px 0; border-left: 4px solid #3b82f6; }
            .old-value { text-decoration: line-through; color: #6b7280; }
            .new-value { font-weight: bold; color: #3b82f6; }
            .cta-button { display: inline-block; background: #3b82f6; color: white; padding: 12px 30px; text-decoration: none; border-radius: 6px; margin: 10px 0; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>📝 Session Details Updated</h1>
            </div>
            <div class="content">
              <p>Hi ${data.studentName},</p>
              <p>Your tutor <strong>${data.tutorName}</strong> has updated the session details:</p>
              
              <div class="update-box">
                <h3>${data.topic}</h3>
                ${data.changes.map(change => `
                  <p>
                    <strong>${change.field}:</strong><br/>
                    <span class="old-value">${change.oldValue}</span> → 
                    <span class="new-value">${change.newValue}</span>
                  </p>
                `).join('')}
                ${data.reason ? `<p><em>Reason: ${data.reason}</em></p>` : ''}
              </div>

              <div style="text-align: center;">
                <a href="${data.confirmLink}" class="cta-button">Reconfirm Attendance</a>
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
  },

  SESSION_CANCELLATION: {
    subject: (data) => `Session Cancelled: ${data.topic} on ${data.date}`,
    body: (data) => `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #ef4444; color: white; padding: 20px; text-align: center; }
            .content { background: #f9fafb; padding: 30px; }
            .cancel-box { background: #fee2e2; padding: 20px; margin: 20px 0; border-left: 4px solid #ef4444; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>❌ Session Cancelled</h1>
            </div>
            <div class="content">
              <p>Hi ${data.studentName},</p>
              <div class="cancel-box">
                <p>We regret to inform you that the following session has been cancelled:</p>
                <p><strong>${data.topic}</strong></p>
                <p><strong>Originally scheduled:</strong> ${data.date} at ${data.time}</p>
                ${data.reason ? `<p><strong>Reason:</strong> ${data.reason}</p>` : ''}
              </div>

              ${data.alternatives ? `<p>Alternative sessions available:<br/>${data.alternatives}</p>` : ''}
              ${data.refund ? `<p><em>You will receive an automatic refund within 3-5 business days.</em></p>` : ''}
            </div>
          </div>
        </body>
      </html>
    `,
  },

  PASSWORD_RESET: {
    subject: () => 'Reset Your EduBridge Password',
    body: (data) => `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #4f46e5; color: white; padding: 20px; text-align: center; }
            .content { background: #f9fafb; padding: 30px; }
            .reset-box { background: #dbeafe; padding: 20px; margin: 20px 0; border-radius: 8px; text-align: center; }
            .cta-button { display: inline-block; background: #4f46e5; color: white; padding: 14px 40px; text-decoration: none; border-radius: 6px; margin: 15px 0; font-weight: bold; }
            .warning { background: #fef3c7; padding: 15px; margin: 20px 0; border-left: 4px solid #f59e0b; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Password Reset Request</h1>
            </div>
            <div class="content">
              <p>Hi,</p>
              <p>We received a request to reset your password for your EduBridge account (<strong>${data.email}</strong>).</p>
              
              <div class="reset-box">
                <p>Click the button below to reset your password:</p>
                <a href="${data.resetLink}" class="cta-button">Reset Password</a>
                <p style="margin-top: 20px; font-size: 14px; color: #6b7280;">This link will expire in <strong>1 hour</strong></p>
              </div>

              <div class="warning">
                <p><strong>⚠️ Security Notice:</strong></p>
                <p>If you didn't request this password reset, please ignore this email. Your password will remain unchanged.</p>
              </div>

              <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
                If the button doesn't work, copy and paste this link into your browser:<br/>
                <a href="${data.resetLink}" style="color: #4f46e5; word-break: break-all;">${data.resetLink}</a>
              </p>
            </div>
            <div class="footer">
              <p>EduBridge Learning Platform</p>
              <p>If you have any questions, please contact our support team.</p>
            </div>
          </div>
        </body>
      </html>
    `,
  },

  EMAIL_VERIFICATION: {
    subject: () => 'Verify Your Email Address',
    body: (data) => `
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: #10b981; color: white; padding: 20px; text-align: center; }
            .content { background: #f9fafb; padding: 30px; }
            .verify-box { background: #d1fae5; padding: 20px; margin: 20px 0; border-radius: 8px; text-align: center; }
            .cta-button { display: inline-block; background: #10b981; color: white; padding: 14px 40px; text-decoration: none; border-radius: 6px; margin: 15px 0; font-weight: bold; }
            .footer { text-align: center; padding: 20px; color: #6b7280; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✉️ Verify Your Email</h1>
            </div>
            <div class="content">
              <p>Hi ${data.firstName},</p>
              <p>Welcome to EduBridge! Please verify your email address to get started.</p>
              
              <div class="verify-box">
                <p>Click the button below to verify your email:</p>
                <a href="${data.verifyLink}" class="cta-button">Verify Email Address</a>
              </div>

              <p style="margin-top: 30px; font-size: 14px; color: #6b7280;">
                If the button doesn't work, copy and paste this link into your browser:<br/>
                <a href="${data.verifyLink}" style="color: #10b981; word-break: break-all;">${data.verifyLink}</a>
              </p>
            </div>
            <div class="footer">
              <p>EduBridge Learning Platform</p>
            </div>
          </div>
        </body>
      </html>
    `,
  },
};

/**
 * Generate ICS calendar file content
 */
function generateCalendarFile(sessionData) {
  const { topic, scheduledStart, scheduledEnd, tutorName, meetingLink, description } = sessionData;
  
  // Format dates for ICS (YYYYMMDDTHHmmssZ)
  const formatDate = (date) => {
    return new Date(date).toISOString().replace(/[-:]/g, '').split('.')[0] + 'Z';
  };

  const icsContent = `BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//EduConnect//Tutoring Session//EN
BEGIN:VEVENT
UID:${Date.now()}@educonnect.com
DTSTAMP:${formatDate(new Date())}
DTSTART:${formatDate(scheduledStart)}
DTEND:${formatDate(scheduledEnd)}
SUMMARY:${topic} with ${tutorName}
DESCRIPTION:${description || 'Tutoring session scheduled through EduConnect'}
LOCATION:${meetingLink || 'Online'}
STATUS:CONFIRMED
BEGIN:VALARM
TRIGGER:-PT1H
ACTION:DISPLAY
DESCRIPTION:Session starting in 1 hour
END:VALARM
END:VEVENT
END:VCALENDAR`;

  return icsContent;
}

/**
 * Send email notification
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.type - Email type (INVITATION, REMINDER, UPDATE, CANCELLATION)
 * @param {Object} options.data - Template data
 * @param {Object} options.session - Session data for calendar file
 * @returns {Promise<Object>} Email sending result
 */
async function sendEmail({ to, type, data, session }) {
  try {
    const template = EMAIL_TEMPLATES[type];
    if (!template) {
      throw new Error(`Unknown email template type: ${type}`);
    }

    const subject = template.subject(data);
    const htmlBody = template.body(data);

    console.log('📧 Preparing to send email:', {
      to,
      subject,
      type,
    });

    // Generate calendar attachment if session data provided
    let attachments = [];
    if (session && (type === 'SESSION_INVITATION' || type === 'SESSION_REMINDER')) {
      const calendarAttachment = generateCalendarFile(session);
      attachments.push({
        filename: 'session.ics',
        content: calendarAttachment,
        contentType: 'text/calendar',
      });
    }

    // Create transporter if not configured (for Ethereal test email)
    let emailTransporter = transporter;
    if (!emailTransporter) {
      const testAccount = await nodemailer.createTestAccount();
      emailTransporter = nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false,
        auth: {
          user: testAccount.user,
          pass: testAccount.pass,
        },
      });
    }

    // Send email
    const info = await emailTransporter.sendMail({
      from: process.env.EMAIL_FROM || '"EduBridge" <noreply@edubridge.com>',
      to,
      subject,
      html: htmlBody,
      attachments,
    });

    console.log('✅ Email sent successfully:', info.messageId);
    
    // If using Ethereal (test), log preview URL
    if (!transporter) {
      const previewUrl = nodemailer.getTestMessageUrl(info);
      console.log('📬 Preview email at:', previewUrl);
    }

    return {
      success: true,
      messageId: info.messageId,
      sentAt: new Date(),
      previewUrl: !transporter ? nodemailer.getTestMessageUrl(info) : null,
    };
  } catch (error) {
    console.error('❌ Error sending email:', error);
    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Track email sending in database
 */
async function trackEmailSending(sessionId, studentId, emailType, result) {
  try {
    await prisma.sessionEmailTracking.create({
      data: {
        sessionId,
        studentId,
        emailType,
        sentAt: result.sentAt || new Date(),
        emailServiceId: result.messageId,
        responseStatus: 'PENDING',
        deliveredAt: result.success ? new Date() : null,
        failureReason: result.success ? null : result.error,
        bounceType: result.success ? null : 'SEND_FAILED',
      },
    });
  } catch (error) {
    console.error('Error tracking email:', error);
  }
}

/**
 * Send session invitation to enrolled students
 */
async function sendSessionInvitations(sessionId, studentIds) {
  try {
    // Fetch session details with tutor information
    const session = await prisma.tutoringSession.findUnique({
      where: { id: sessionId },
      include: {
        tutor: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
      },
    });

    if (!session) {
      throw new Error('Session not found');
    }

    // Fetch student details and their preferences
    const students = await prisma.user.findMany({
      where: {
        id: { in: studentIds },
        status: 'ACTIVE',
        emailVerified: true,
      },
      include: {
        emailPreferences: true,
      },
    });

    const results = [];

    for (const student of students) {
      // Check if student has email notifications enabled
      const prefs = student.emailPreferences;
      if (prefs && !prefs.sessionInvitations) {
        console.log(`Student ${student.email} has disabled session invitations`);
        continue;
      }

      // Prepare email data
      const emailData = {
        studentName: student.firstName,
        tutorName: `${session.tutor.firstName} ${session.tutor.lastName}`,
        courseName: session.subject,
        topic: session.subject,
        date: new Date(session.scheduledStart).toLocaleDateString(),
        time: new Date(session.scheduledStart).toLocaleTimeString(),
        duration: `${Math.round((new Date(session.scheduledEnd) - new Date(session.scheduledStart)) / 60000)} minutes`,
        sessionType: session.sessionType.replace('_', ' '),
        objectives: null, // TODO: Add learning objectives field to session
        confirmLink: `${process.env.CLIENT_URL}/student/sessions/${sessionId}/confirm`,
        viewDetailsLink: `${process.env.CLIENT_URL}/student/sessions/${sessionId}`,
        rescheduleLink: `${process.env.CLIENT_URL}/student/sessions/${sessionId}/reschedule`,
        unsubscribeLink: `${process.env.CLIENT_URL}/settings/notifications`,
      };

      // Send email
      const result = await sendEmail({
        to: student.email,
        type: 'SESSION_INVITATION',
        data: emailData,
        session,
      });

      // Track in database
      await trackEmailSending(sessionId, student.id, 'INVITATION', result);

      results.push({
        studentId: student.id,
        email: student.email,
        success: result.success,
        messageId: result.messageId,
      });
    }

    return {
      success: true,
      sent: results.filter(r => r.success).length,
      failed: results.filter(r => !r.success).length,
      results,
    };
  } catch (error) {
    console.error('Error sending session invitations:', error);
    throw error;
  }
}

/**
 * Send session reminder
 */
async function sendSessionReminder(sessionId, timeframe) {
  try {
    // Fetch session with confirmed students
    const session = await prisma.tutoringSession.findUnique({
      where: { id: sessionId },
      include: {
        tutor: {
          select: { firstName: true, lastName: true },
        },
        sessionResponses: {
          where: { responseType: 'CONFIRMED' },
          include: {
            student: {
              select: { id: true, email: true, firstName: true },
            },
          },
        },
      },
    });

    if (!session) {
      throw new Error('Session not found');
    }

    const results = [];

    for (const response of session.sessionResponses) {
      const student = response.student;

      const emailData = {
        studentName: student.firstName,
        tutorName: `${session.tutor.firstName} ${session.tutor.lastName}`,
        topic: session.subject,
        date: new Date(session.scheduledStart).toLocaleDateString(),
        time: new Date(session.scheduledStart).toLocaleTimeString(),
        timeframe,
        meetingLink: session.videoRoomId || '#',
        preparation: null, // TODO: Add preparation field
      };

      const result = await sendEmail({
        to: student.email,
        type: 'SESSION_REMINDER',
        data: emailData,
        session,
      });

      await trackEmailSending(sessionId, student.id, 'REMINDER', result);

      results.push({ studentId: student.id, success: result.success });
    }

    return { success: true, results };
  } catch (error) {
    console.error('Error sending reminders:', error);
    throw error;
  }
}

/**
 * Send password reset email
 */
async function sendPasswordResetEmail(email, resetToken) {
  try {
    const resetLink = `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`;
    
    const result = await sendEmail({
      to: email,
      type: 'PASSWORD_RESET',
      data: {
        email,
        resetLink,
      },
    });

    return result;
  } catch (error) {
    console.error('Error sending password reset email:', error);
    throw error;
  }
}

/**
 * Send email verification
 */
async function sendVerificationEmail(user, verificationToken) {
  try {
    const verifyLink = `${process.env.CLIENT_URL}/verify-email?token=${verificationToken}`;
    
    const result = await sendEmail({
      to: user.email,
      type: 'EMAIL_VERIFICATION',
      data: {
        firstName: user.firstName,
        verifyLink,
      },
    });

    return result;
  } catch (error) {
    console.error('Error sending verification email:', error);
    throw error;
  }
}

module.exports = {
  sendEmail,
  sendSessionInvitations,
  sendSessionReminder,
  sendPasswordResetEmail,
  sendVerificationEmail,
  trackEmailSending,
  generateCalendarFile,
};
