const { findMatchesForRequest } = require('../services/tutoring.service');
const prisma = require('../utils/prisma');

// Mock Prisma
jest.mock('../utils/prisma', () => ({
  tutoringRequest: {
    findUnique: jest.fn()
  },
  user: {
    findMany: jest.fn()
  },
  availabilitySlot: {
    findMany: jest.fn(),
    findFirst: jest.fn()
  },
  courseReview: {
    aggregate: jest.fn()
  },
  review: {
    aggregate: jest.fn()
  }
}));

describe('Tutor Matching Algorithm', () => {
  const mockRequest = {
    id: 'req-1',
    subjectId: 'sub-math',
    preferredLevel: 'SECONDARY',
    preferredLanguage: 'English',
    preferredStart: new Date('2026-01-10T10:00:00Z'),
    budgetMax: 50,
    subject: { name: 'Mathematics' }
  };

  const mockTutor = {
    id: 'tutor-1',
    firstName: 'John',
    lastName: 'Doe',
    profilePictureUrl: 'url',
    tutorSubjects: [
      { subjectId: 'sub-math', skillLevel: 'ADVANCED' }
    ],
    tutorProfile: {
      levelsSupported: ['SECONDARY', 'UNIVERSITY'],
      hourlyRate: 40,
      languages: ['English']
    }
  };

  beforeEach(() => {
    jest.clearAllMocks();
    
    // Default mocks
    prisma.tutoringRequest.findUnique.mockResolvedValue(mockRequest);
    prisma.user.findMany.mockResolvedValue([mockTutor]);
    
    // Mock Availability (Match)
    prisma.availabilitySlot.findMany.mockResolvedValue([{ id: 'slot-1' }]); // Has slot
    prisma.availabilitySlot.findFirst.mockResolvedValue({ id: 'slot-1' }); // Next slot
    
    // Mock Ratings (4.0 Average)
    prisma.courseReview.aggregate.mockResolvedValue({ _avg: { rating: 4 }, _count: { rating: 5 } });
    prisma.review.aggregate.mockResolvedValue({ _avg: { rating: 0 }, _count: { rating: 0 } });
  });

  test('calculates correct score for perfect match', async () => {
    const matches = await findMatchesForRequest('req-1');
    const match = matches[0];

    // Breakdown:
    // Subject: 40 (Match) + 5 (Advanced) = 45
    // Level: 20 (Secondary supported)
    // Availability: 20 (Slot found)
    // Rating: 8 (4.0/5 * 10)
    // Budget: 10 (40 <= 50)
    // Total: 45 + 20 + 20 + 8 + 10 = 103 -> Capped at 100
    
    expect(match.score).toBe(100);
    expect(match.explanation).toContain('Matches subject');
    expect(match.explanation).toContain('Expert in this subject');
  });

  test('penalizes for budget mismatch', async () => {
    // Increase tutor rate to 60 (Budget is 50)
    const expensiveTutor = { ...mockTutor, tutorProfile: { ...mockTutor.tutorProfile, hourlyRate: 60 } };
    prisma.user.findMany.mockResolvedValue([expensiveTutor]);

    const matches = await findMatchesForRequest('req-1');
    const match = matches[0];

    // Budget: 0 points (60 > 50 * 1.2 is false? 60 <= 60 is true, so 5 points for "near")
    // Wait, logic: rate <= budget * 1.2 (60 <= 60) -> 5 points.
    
    // Score: 103 - 10 + 5 = 98 -> 98
    expect(match.score).toBeLessThan(100);
    expect(match.score).toBe(98); 
  });

  test('filters out language mismatch', async () => {
    const frenchTutor = { 
      ...mockTutor, 
      tutorProfile: { ...mockTutor.tutorProfile, languages: ['French'] } 
    };
    prisma.user.findMany.mockResolvedValue([frenchTutor]);

    const matches = await findMatchesForRequest('req-1');
    expect(matches.length).toBe(0);
  });
});