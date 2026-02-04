const prisma = require('../utils/prisma');

// Add availability slots
exports.addSlots = async (req, res) => {
    try {
        const { slots } = req.body; // Array of { startTime, endTime }
        const tutorId = req.user.id;

        if (!slots || !Array.isArray(slots) || slots.length === 0) {
            return res.status(400).json({ success: false, message: 'Invalid slots data' });
        }

        // Create slots in bulk
        const createdSlots = await prisma.$transaction(
            slots.map(slot =>
                prisma.availabilitySlot.create({
                    data: {
                        tutorId,
                        startTime: new Date(slot.startTime),
                        endTime: new Date(slot.endTime),
                        isBooked: false
                    }
                })
            )
        );

        res.json({ success: true, count: createdSlots.length, message: 'Slots added successfully' });
    } catch (error) {
        console.error('Add Slots Error:', error);
        res.status(500).json({ success: false, message: 'Failed to add slots' });
    }
};

// Get slots for a tutor
exports.getSlots = async (req, res) => {
    try {
        const { tutorId, startDate, endDate } = req.query;

        if (!tutorId) {
            return res.status(400).json({ success: false, message: 'Tutor ID is required' });
        }

        const where = {
            tutorId,
            isBooked: false,
        };

        if (startDate || endDate) {
            where.startTime = {};
            if (startDate) where.startTime.gte = new Date(startDate);
            if (endDate) where.startTime.lte = new Date(endDate);
        }

        const slots = await prisma.availabilitySlot.findMany({
            where,
            orderBy: { startTime: 'asc' }
        });

        res.json({ success: true, data: slots });
    } catch (error) {
        console.error('Get Slots Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch slots' });
    }
};

// Get 1-hour bookable slots for students (generates from availability windows)
exports.getBookableSlots = async (req, res) => {
    try {
        const { tutorId, date } = req.query;

        if (!tutorId) {
            return res.status(400).json({ success: false, message: 'Tutor ID is required' });
        }

        // Parse the date or use today
        const targetDate = date ? new Date(date) : new Date();
        const startOfDay = new Date(targetDate);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(targetDate);
        endOfDay.setHours(23, 59, 59, 999);

        // Get tutor's availability slots for the date range
        const availabilitySlots = await prisma.availabilitySlot.findMany({
            where: {
                tutorId,
                isBooked: false,
                startTime: {
                    gte: startOfDay,
                    lte: endOfDay
                }
            },
            orderBy: { startTime: 'asc' }
        });

        // Get existing booked sessions to check conflicts
        const bookedSessions = await prisma.tutoringSession.findMany({
            where: {
                tutorId,
                scheduledStart: {
                    gte: startOfDay,
                    lte: endOfDay
                },
                status: {
                    in: ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS']
                }
            }
        });

        // Generate 1-hour slots from each availability window
        const oneHourSlots = [];
        const now = new Date(); // Current time for filtering past slots

        for (const slot of availabilitySlots) {
            const slotStart = new Date(slot.startTime);
            const slotEnd = new Date(slot.endTime);
            const durationMinutes = (slotEnd - slotStart) / (1000 * 60);

            // Generate 1-hour slots at 1-hour intervals (not overlapping)
            const numberOfSlots = Math.floor(durationMinutes / 60);

            for (let i = 0; i < numberOfSlots; i++) {
                const oneHourStart = new Date(slotStart.getTime() + (i * 60 * 60 * 1000));
                const oneHourEnd = new Date(oneHourStart.getTime() + (60 * 60 * 1000));

                // Check if end time exceeds availability window
                if (oneHourEnd > slotEnd) continue;

                // FILTER OUT PAST TIME SLOTS - Skip if slot has already started or ended
                if (oneHourStart <= now) {
                    continue; // Skip this slot as it's in the past
                }

                // Check if this slot conflicts with any booked session
                const hasConflict = bookedSessions.some(session => {
                    const sessionStart = new Date(session.scheduledStart);
                    const sessionEnd = new Date(session.scheduledEnd);

                    // Check for overlap
                    return (oneHourStart < sessionEnd && oneHourEnd > sessionStart);
                });

                // Only include available (non-conflicting) slots
                if (!hasConflict) {
                    oneHourSlots.push({
                        id: `${slot.id}-${i}`, // Unique ID for each 1-hour slot
                        availabilitySlotId: slot.id, // Reference to parent availability
                        tutorId,
                        startTime: oneHourStart.toISOString(),
                        endTime: oneHourEnd.toISOString(),
                        isBooked: false
                    });
                }
            }
        }

        res.json({ success: true, data: oneHourSlots });
    } catch (error) {
        console.error('Get Bookable Slots Error:', error);
        res.status(500).json({ success: false, message: 'Failed to fetch bookable slots' });
    }
};

// Delete a slot
exports.deleteSlot = async (req, res) => {
    try {
        const { slotId } = req.params;
        const tutorId = req.user.id;

        // Verify ownership
        const slot = await prisma.availabilitySlot.findUnique({ where: { id: slotId } });
        if (!slot) return res.status(404).json({ success: false, message: 'Slot not found' });
        if (slot.tutorId !== tutorId) return res.status(403).json({ success: false, message: 'Unauthorized' });
        if (slot.isBooked) return res.status(400).json({ success: false, message: 'Cannot delete booked slot' });

        await prisma.availabilitySlot.delete({ where: { id: slotId } });

        res.json({ success: true, message: 'Slot deleted' });
    } catch (error) {
        console.error('Delete Slot Error:', error);
        res.status(500).json({ success: false, message: 'Failed to delete slot' });
    }
};

// Book a slot
exports.bookSlot = async (req, res) => {
    try {
        const { slotId } = req.params;
        const { subject, note, startTime, endTime } = req.body;
        const studentId = req.user.id;

        // Check if this is a generated slot ID (format: "slotId-index")
        let availabilitySlotId = slotId;
        let sessionStart, sessionEnd;
        let isGeneratedSlot = false; // Track if this is a generated 1-hour slot

        if (slotId.includes('-')) {
            isGeneratedSlot = true;
            // This is a generated 1-hour slot
            availabilitySlotId = slotId.substring(0, slotId.lastIndexOf('-'));
            // Use provided start and end times
            if (!startTime || !endTime) {
                return res.status(400).json({
                    success: false,
                    message: 'Start time and end time are required for bookable slots'
                });
            }
            sessionStart = new Date(startTime);
            sessionEnd = new Date(endTime);
        }

        // Start transaction
        const result = await prisma.$transaction(async (prisma) => {
            // 1. Get availability slot
            const slot = await prisma.availabilitySlot.findUnique({
                where: { id: availabilitySlotId }
            });

            if (!slot) throw new Error('Slot not found');

            // For generated slots, verify the requested time is within availability
            if (slotId.includes('-')) {
                const slotStart = new Date(slot.startTime);
                const slotEnd = new Date(slot.endTime);

                if (sessionStart < slotStart || sessionEnd > slotEnd) {
                    throw new Error('Requested time is outside availability window');
                }

                // Check for conflicts with existing sessions
                const conflictingSession = await prisma.tutoringSession.findFirst({
                    where: {
                        tutorId: slot.tutorId,
                        status: { in: ['SCHEDULED', 'CONFIRMED', 'IN_PROGRESS'] },
                        OR: [
                            {
                                AND: [
                                    { scheduledStart: { lte: sessionStart } },
                                    { scheduledEnd: { gt: sessionStart } }
                                ]
                            },
                            {
                                AND: [
                                    { scheduledStart: { lt: sessionEnd } },
                                    { scheduledEnd: { gte: sessionEnd } }
                                ]
                            }
                        ]
                    }
                });

                if (conflictingSession) {
                    throw new Error('This time slot is already booked');
                }
            } else {
                // Original slot booking - mark as fully booked
                if (slot.isBooked) throw new Error('Slot is already booked');

                await prisma.availabilitySlot.update({
                    where: { id: availabilitySlotId },
                    data: { isBooked: true }
                });

                sessionStart = slot.startTime;
                sessionEnd = slot.endTime;
            }

            // 3. Create Tutoring Session
            const session = await prisma.tutoringSession.create({
                data: {
                    tutorId: slot.tutorId,
                    subject: subject || 'General Tutoring',
                    educationLevel: 'UNIVERSITY',
                    scheduledStart: sessionStart,
                    scheduledEnd: sessionEnd,
                    maxParticipants: 1,
                    sessionType: 'ONE_ON_ONE',
                    status: 'SCHEDULED',
                    slotId: isGeneratedSlot ? null : slot.id, // Only set slotId for full slot bookings
                    sessionNotes: note ? JSON.stringify({ studentInquiry: note }) : null
                }
            });

            // 4. Create Booking
            const booking = await prisma.sessionBooking.create({
                data: {
                    studentId,
                    sessionId: session.id,
                    status: 'CONFIRMED'
                }
            });

            // 5. Create notifications
            await prisma.notification.createMany({
                data: [
                    {
                        userId: studentId,
                        type: 'SESSION_BOOKED',
                        title: 'Session Booked Successfully',
                        message: `You have booked a session on ${sessionStart.toLocaleDateString()}`,
                        link: `/student/sessions/${session.id}`
                    },
                    {
                        userId: slot.tutorId,
                        type: 'SESSION_BOOKED',
                        title: 'New Session Booking',
                        message: `A student has booked a session with you`,
                        link: `/tutor/sessions/${session.id}`
                    }
                ]
            });

            return { session, booking };
        });

        res.json({ success: true, data: result });
    } catch (error) {
        console.error('Book Slot Error:', error);
        res.status(400).json({ success: false, message: error.message || 'Booking failed' });
    }
};
