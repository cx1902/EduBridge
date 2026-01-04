const prisma = require('../utils/prisma');
const { findMatchesForRequest } = require('../services/tutoring.service');

// Create Tutoring Request
const createRequest = async (req, res) => {
  try {
    const studentId = req.user.id;
    const {
      subjectId,
      preferredLevel,
      budgetMax,
      preferredLanguage,
      preferredStart,
      preferredEnd
    } = req.body;

    if (!subjectId || !preferredLevel) {
      return res.status(400).json({ error: 'Subject and Level are required' });
    }

    const request = await prisma.tutoringRequest.create({
      data: {
        studentId,
        subjectId,
        preferredLevel,
        budgetMax: budgetMax ? parseFloat(budgetMax) : null,
        preferredLanguage,
        preferredStart: preferredStart ? new Date(preferredStart) : null,
        preferredEnd: preferredEnd ? new Date(preferredEnd) : null,
        status: 'PENDING'
      }
    });

    res.status(201).json({
      success: true,
      data: request,
      message: 'Request submitted successfully'
    });
  } catch (error) {
    console.error('Error creating request:', error);
    res.status(500).json({ error: 'Failed to submit request' });
  }
};

// Get Matches for Request
const getMatches = async (req, res) => {
  try {
    const { id } = req.params;
    const studentId = req.user.id;

    // Verify ownership
    const request = await prisma.tutoringRequest.findUnique({
      where: { id }
    });

    if (!request) {
      return res.status(404).json({ error: 'Request not found' });
    }

    if (request.studentId !== studentId) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const matches = await findMatchesForRequest(id);

    res.json({
      success: true,
      data: matches
    });
  } catch (error) {
    console.error('Error fetching matches:', error);
    res.status(500).json({ error: 'Failed to find matches' });
  }
};

// Book a Tutor (Transaction)
const bookTutor = async (req, res) => {
  try {
    const { id: requestId } = req.params;
    const studentId = req.user.id;
    const { tutorId, slotId } = req.body;

    if (!tutorId || !slotId) {
      return res.status(400).json({ error: 'Tutor ID and Slot ID are required' });
    }

    // Use Prisma Transaction for safety
    const result = await prisma.$transaction(async (tx) => {
      // 1. Verify Request
      const request = await tx.tutoringRequest.findUnique({
        where: { id: requestId }
      });

      if (!request || request.studentId !== studentId) {
        throw new Error('Request invalid or access denied');
      }

      if (['BOOKED', 'CANCELLED'].includes(request.status)) {
        throw new Error('Request is already closed');
      }

      // 2. Verify Slot Availability (Locking row conceptually via check)
      const slot = await tx.availabilitySlot.findUnique({
        where: { id: slotId }
      });

      if (!slot) throw new Error('Slot not found');
      if (slot.tutorId !== tutorId) throw new Error('Slot does not belong to this tutor');
      if (slot.isBooked) {
        // Return specific error for 409
        const error = new Error('Slot already booked');
        error.code = 'SLOT_BOOKED';
        throw error;
      }

      // 3. Execute Booking
      
      // Update Slot
      await tx.availabilitySlot.update({
        where: { id: slotId },
        data: { isBooked: true }
      });

      // Update Request
      await tx.tutoringRequest.update({
        where: { id: requestId },
        data: {
          status: 'BOOKED',
          matchedTutorId: tutorId
        }
      });

      // Create Session
      const session = await tx.tutoringSession.create({
        data: {
          tutorId,
          subject: 'Tutoring Session', // Or fetch subject name
          educationLevel: request.preferredLevel,
          scheduledStart: slot.startTime,
          scheduledEnd: slot.endTime,
          maxParticipants: 1,
          sessionType: 'ONE_ON_ONE',
          status: 'SCHEDULED',
          // Link for tracking
          requestId: requestId,
          slotId: slotId,
          bookings: {
            create: {
              studentId,
              status: 'CONFIRMED'
            }
          }
        },
        include: {
          bookings: true
        }
      });

      return session;
    });

    res.json({
      success: true,
      message: 'Booking confirmed successfully',
      data: result
    });

  } catch (error) {
    console.error('Error booking tutor:', error);
    if (error.code === 'SLOT_BOOKED') {
      return res.status(409).json({ error: 'This slot has just been booked by someone else.' });
    }
    res.status(400).json({ error: error.message || 'Failed to book session' });
  }
};

// Get All Subjects (Public)
const getSubjects = async (req, res) => {
  try {
    const subjects = await prisma.subject.findMany({
      orderBy: { name: 'asc' }
    });
    res.json({ success: true, data: subjects });
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch subjects' });
  }
};

module.exports = {
  createRequest,
  getMatches,
  bookTutor,
  getSubjects
};