const prisma = require('../utils/prisma');
const { sendEmail } = require('../utils/emailService');

/**
 * Search for tutors
 * GET /api/bookings/tutors/search
 */
exports.searchTutors = async (req, res) => {
    try {
        const { name, subject, level, maxPrice } = req.query;

        const where = {
            role: 'TUTOR',
            status: 'ACTIVE',
            tutorProfile: {
                isNot: null
            }
        };

        // Build filter conditions
        const tutorProfileWhere = {};

        if (maxPrice) {
            tutorProfileWhere.hourlyRate = {
                lte: parseFloat(maxPrice)
            };
        }

        // Search by name
        if (name) {
            const terms = name.trim().split(/\s+/);
            if (terms.length > 1) {
                // If multiple terms, try to match first name AND last name
                // or just standard contains for single fields
                where.OR = [
                    {
                        AND: [
                            { firstName: { contains: terms[0], mode: 'insensitive' } },
                            { lastName: { contains: terms.slice(1).join(' '), mode: 'insensitive' } }
                        ]
                    },
                    { firstName: { contains: name, mode: 'insensitive' } },
                    { lastName: { contains: name, mode: 'insensitive' } }
                ];
            } else {
                where.OR = [
                    { firstName: { contains: name, mode: 'insensitive' } },
                    { lastName: { contains: name, mode: 'insensitive' } }
                ];
            }
        }

        // Search by subject
        let tutorSubjectsWhere = {};
        if (subject) {
            tutorSubjectsWhere = {
                some: {
                    subject: {
                        name: { contains: subject, mode: 'insensitive' }
                    }
                }
            };
        }

        const tutors = await prisma.user.findMany({
            where,
            include: {
                tutorProfile: {
                    where: Object.keys(tutorProfileWhere).length > 0 ? tutorProfileWhere : undefined
                },
                tutorSubjects: {
                    where: Object.keys(tutorSubjectsWhere).length > 0 ? tutorSubjectsWhere : undefined,
                    include: {
                        subject: true
                    }
                }
            }
        });

        // Filter out tutors that don't match profile criteria
        const filteredTutors = tutors.filter(tutor => tutor.tutorProfile !== null);

        res.json({
            success: true,
            data: filteredTutors.map(tutor => ({
                id: tutor.id,
                user: {
                    firstName: tutor.firstName,
                    lastName: tutor.lastName,
                    profilePictureUrl: tutor.profilePictureUrl,
                    id: tutor.id,
                    email: tutor.email,
                    phoneNumber: tutor.phoneNumber
                },
                bio: tutor.tutorProfile?.bio,
                hourlyRate: tutor.tutorProfile?.hourlyRate,
                averageRating: tutor.tutorProfile?.averageRating,
                reviewCount: 0, // TODO: Calculate from reviews
                tutorSubjects: tutor.tutorSubjects
            }))
        });
    } catch (error) {
        console.error('Search tutors error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to search tutors'
        });
    }
};

/**
 * Create booking request
 * POST /api/bookings/request
 */
exports.createBookingRequest = async (req, res) => {
    try {
        const studentId = req.user.id;
        const { tutorId, subject, preferredDate, preferredTime, duration, message } = req.body;

        // Validate required fields
        if (!tutorId || !subject || !preferredDate || !preferredTime || !duration) {
            return res.status(400).json({
                success: false,
                error: 'Missing required fields'
            });
        }

        // Check if tutor exists
        const tutor = await prisma.user.findUnique({
            where: { id: tutorId, role: 'TUTOR', status: 'ACTIVE' },
            select: {
                id: true,
                email: true,
                firstName: true,
                lastName: true
            }
        });

        if (!tutor) {
            return res.status(404).json({
                success: false,
                error: 'Tutor not found'
            });
        }

        // Get student info
        const student = await prisma.user.findUnique({
            where: { id: studentId },
            select: {
                firstName: true,
                lastName: true,
                email: true
            }
        });

        // Create booking request
        const bookingRequest = await prisma.bookingRequest.create({
            data: {
                studentId,
                tutorId,
                subject,
                preferredDate: new Date(preferredDate),
                preferredTime,
                duration: parseInt(duration),
                message: message || null,
                status: 'PENDING'
            },
            include: {
                student: {
                    select: {
                        firstName: true,
                        lastName: true,
                        email: true
                    }
                },
                tutor: {
                    select: {
                        firstName: true,
                        lastName: true,
                        email: true
                    }
                }
            }
        });

        // Send email notification to tutor
        try {
            await sendEmail({
                to: tutor.email,
                subject: `New Booking Request from ${student.firstName} ${student.lastName}`,
                html: `
          <h2>New 1-on-1 Session Request</h2>
          <p><strong>${student.firstName} ${student.lastName}</strong> has requested a session with you.</p>
          <p><strong>Subject:</strong> ${subject}</p>
          <p><strong>Preferred Date:</strong> ${new Date(preferredDate).toLocaleDateString()}</p>
          <p><strong>Preferred Time:</strong> ${preferredTime}</p>
          <p><strong>Duration:</strong> ${duration} minutes</p>
          ${message ? `<p><strong>Message:</strong> ${message}</p>` : ''}
          <p>Please log in to your EduBridge account to accept or decline this request.</p>
        `
            });
        } catch (emailError) {
            console.error('Failed to send email notification:', emailError);
            // Continue anyway - booking request is created
        }

        res.status(201).json({
            success: true,
            data: bookingRequest,
            message: 'Booking request sent successfully'
        });
    } catch (error) {
        console.error('Create booking request error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to create booking request'
        });
    }
};

/**
 * Get student's booking requests
 * GET /api/bookings/my-requests
 */
exports.getMyBookingRequests = async (req, res) => {
    try {
        const studentId = req.user.id;

        const bookings = await prisma.bookingRequest.findMany({
            where: { studentId },
            include: {
                tutor: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        profilePictureUrl: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        res.json({
            success: true,
            data: bookings
        });
    } catch (error) {
        console.error('Get my booking requests error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch booking requests'
        });
    }
};

/**
 * Get tutor's received booking requests
 * GET /api/bookings/received
 */
exports.getReceivedBookingRequests = async (req, res) => {
    try {
        const tutorId = req.user.id;
        const { status } = req.query;

        const where = { tutorId };
        if (status) {
            where.status = status;
        }

        const bookings = await prisma.bookingRequest.findMany({
            where,
            include: {
                student: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        profilePictureUrl: true,
                        email: true
                    }
                }
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        res.json({
            success: true,
            data: bookings
        });
    } catch (error) {
        console.error('Get received booking requests error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch booking requests'
        });
    }
};

/**
 * Accept booking request
 * POST /api/bookings/:id/accept
 */
exports.acceptBooking = async (req, res) => {
    try {
        const tutorId = req.user.id;
        const { id } = req.params;

        // Find booking request
        const booking = await prisma.bookingRequest.findUnique({
            where: { id },
            include: {
                student: {
                    select: {
                        email: true,
                        firstName: true,
                        lastName: true
                    }
                },
                tutor: {
                    select: {
                        firstName: true,
                        lastName: true
                    }
                }
            }
        });

        if (!booking) {
            return res.status(404).json({
                success: false,
                error: 'Booking request not found'
            });
        }

        // Verify ownership
        if (booking.tutorId !== tutorId) {
            return res.status(403).json({
                success: false,
                error: 'Not authorized'
            });
        }

        // Check if already responded
        if (booking.status !== 'PENDING') {
            return res.status(400).json({
                success: false,
                error: `Booking already ${booking.status.toLowerCase()}`
            });
        }

        // Update booking request
        const updatedBooking = await prisma.bookingRequest.update({
            where: { id },
            data: {
                status: 'ACCEPTED',
                respondedAt: new Date()
            }
        });

        // Send email to student
        try {
            await sendEmail({
                to: booking.student.email,
                subject: `Booking Confirmed with ${booking.tutor.firstName} ${booking.tutor.lastName}`,
                html: `
          <h2>Your Booking Has Been Accepted!</h2>
          <p><strong>${booking.tutor.firstName} ${booking.tutor.lastName}</strong> has accepted your session request.</p>
          <p><strong>Subject:</strong> ${booking.subject}</p>
          <p><strong>Date & Time:</strong> ${booking.preferredDate.toLocaleDateString()} at ${booking.preferredTime}</p>
          <p>We look forward to a productive session!</p>
        `
            });
        } catch (emailError) {
            console.error('Failed to send acceptance email:', emailError);
        }

        res.json({
            success: true,
            data: updatedBooking,
            message: 'Booking request accepted'
        });
    } catch (error) {
        console.error('Accept booking error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to accept booking request'
        });
    }
};

/**
 * Decline booking request
 * POST /api/bookings/:id/decline
 */
exports.declineBooking = async (req, res) => {
    try {
        const tutorId = req.user.id;
        const { id } = req.params;
        const { reason } = req.body;

        // Find booking request
        const booking = await prisma.bookingRequest.findUnique({
            where: { id },
            include: {
                student: {
                    select: {
                        email: true,
                        firstName: true,
                        lastName: true
                    }
                },
                tutor: {
                    select: {
                        firstName: true,
                        lastName: true
                    }
                }
            }
        });

        if (!booking) {
            return res.status(404).json({
                success: false,
                error: 'Booking request not found'
            });
        }

        // Verify ownership
        if (booking.tutorId !== tutorId) {
            return res.status(403).json({
                success: false,
                error: 'Not authorized'
            });
        }

        // Check if already responded
        if (booking.status !== 'PENDING') {
            return res.status(400).json({
                success: false,
                error: `Booking already ${booking.status.toLowerCase()}`
            });
        }

        // Update booking request
        const updatedBooking = await prisma.bookingRequest.update({
            where: { id },
            data: {
                status: 'DECLINED',
                declineReason: reason || null,
                respondedAt: new Date()
            }
        });

        // Send email to student
        try {
            await sendEmail({
                to: booking.student.email,
                subject: `Booking Update from ${booking.tutor.firstName} ${booking.tutor.lastName}`,
                html: `
          <h2>Booking Request Update</h2>
          <p><strong>${booking.tutor.firstName} ${booking.tutor.lastName}</strong> is unable to accept your session request at this time.</p>
          ${reason ? `<p><strong>Reason:</strong> ${reason}</p>` : ''}
          <p>You can browse other available tutors or try requesting a different time.</p>
        `
            });
        } catch (emailError) {
            console.error('Failed to send decline email:', emailError);
        }

        res.json({
            success: true,
            data: updatedBooking,
            message: 'Booking request declined'
        });
    } catch (error) {
        console.error('Decline booking error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to decline booking request'
        });
    }
};

/**
 * Cancel booking request (student)
 * DELETE /api/bookings/:id/cancel
 */
exports.cancelBooking = async (req, res) => {
    try {
        const userId = req.user.id;
        const { id } = req.params;

        const booking = await prisma.bookingRequest.findUnique({
            where: { id }
        });

        if (!booking) {
            return res.status(404).json({
                success: false,
                error: 'Booking request not found'
            });
        }

        // Verify ownership (student can cancel their own requests)
        if (booking.studentId !== userId) {
            return res.status(403).json({
                success: false,
                error: 'Not authorized'
            });
        }

        // Can only cancel pending requests
        if (booking.status !== 'PENDING') {
            return res.status(400).json({
                success: false,
                error: 'Can only cancel pending requests'
            });
        }

        // Delete the booking request
        await prisma.bookingRequest.delete({
            where: { id }
        });

        res.json({
            success: true,
            message: 'Booking request cancelled'
        });
    } catch (error) {
        console.error('Cancel booking error:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to cancel booking request'
        });
    }
};
