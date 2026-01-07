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
        const { subject, note, duration } = req.body;
        const studentId = req.user.id;

        // Start transaction
        const result = await prisma.$transaction(async (prisma) => {
            // 1. Get and lock slot
            const slot = await prisma.availabilitySlot.findUnique({ where: { id: slotId } });

            if (!slot) throw new Error('Slot not found');
            if (slot.isBooked) throw new Error('Slot is already booked');

            // 2. Mark slot as booked
            await prisma.availabilitySlot.update({
                where: { id: slotId },
                data: { isBooked: true }
            });

            // 3. Create Tutoring Session
            const session = await prisma.tutoringSession.create({
                data: {
                    tutorId: slot.tutorId,
                    subject: subject || 'General Tutoring',
                    educationLevel: 'UNIVERSITY', // Default or from request
                    scheduledStart: slot.startTime,
                    scheduledEnd: slot.endTime,
                    maxParticipants: 1,
                    sessionType: 'ONE_ON_ONE',
                    status: 'SCHEDULED',
                    slotId: slot.id,
                    sessionNotes: note
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

            return { session, booking };
        });

        res.json({ success: true, data: result });
    } catch (error) {
        console.error('Book Slot Error:', error);
        res.status(400).json({ success: false, message: error.message || 'Booking failed' });
    }
};
