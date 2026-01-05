const request = require('supertest');
const express = require('express');
const { bookTutor } = require('../controllers/tutoring.controller');
const prisma = require('../utils/prisma');

// Mock Prisma
jest.mock('../utils/prisma', () => ({
  $transaction: jest.fn((callback) => callback(prisma)),
  tutoringRequest: {
    findUnique: jest.fn(),
    update: jest.fn()
  },
  availabilitySlot: {
    findUnique: jest.fn(),
    update: jest.fn()
  },
  tutoringSession: {
    create: jest.fn()
  }
}));

const app = express();
app.use(express.json());
// Mock auth middleware
app.use((req, res, next) => {
  req.user = { id: 'student-1', role: 'STUDENT' };
  next();
});
app.post('/api/tutoring/requests/:id/book', bookTutor);

describe('Double Booking Prevention', () => {
  const mockRequest = {
    id: 'req-1',
    studentId: 'student-1',
    status: 'MATCHED'
  };

  const mockSlot = {
    id: 'slot-1',
    tutorId: 'tutor-1',
    isBooked: false,
    startTime: new Date(),
    endTime: new Date()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    prisma.tutoringRequest.findUnique.mockResolvedValue(mockRequest);
    prisma.availabilitySlot.findUnique.mockResolvedValue(mockSlot);
  });

  test('successfully books an available slot', async () => {
    const res = await request(app)
      .post('/api/tutoring/requests/req-1/book')
      .send({ tutorId: 'tutor-1', slotId: 'slot-1' });

    expect(res.status).toBe(200);
    expect(prisma.availabilitySlot.update).toHaveBeenCalledWith({
      where: { id: 'slot-1' },
      data: { isBooked: true }
    });
  });

  test('fails if slot is already booked', async () => {
    // Simulate race condition or pre-booked slot
    prisma.availabilitySlot.findUnique.mockResolvedValue({ ...mockSlot, isBooked: true });

    const res = await request(app)
      .post('/api/tutoring/requests/req-1/book')
      .send({ tutorId: 'tutor-1', slotId: 'slot-1' });

    expect(res.status).toBe(409);
    expect(res.body.error).toBe('This slot has just been booked by someone else.');
    expect(prisma.availabilitySlot.update).not.toHaveBeenCalled();
  });

  test('fails if request belongs to another student', async () => {
    prisma.tutoringRequest.findUnique.mockResolvedValue({ ...mockRequest, studentId: 'other-student' });

    const res = await request(app)
      .post('/api/tutoring/requests/req-1/book')
      .send({ tutorId: 'tutor-1', slotId: 'slot-1' });

    expect(res.status).toBe(400);
    expect(res.body.error).toContain('access denied');
  });
});