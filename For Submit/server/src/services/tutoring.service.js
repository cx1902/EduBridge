const prisma = require('../utils/prisma');

/**
 * Weighted Scoring Algorithm for Tutor Matching
 * 
 * Criteria & Weights:
 * 1. Subject Match: 40% (Already filtered, but skill level adds bonus)
 * 2. Level Fit: 20% (Tutor supports student's level)
 * 3. Availability: 20% (Has slot near preferred time)
 * 4. Rating: 10% (Normalized 0-10)
 * 5. Budget Fit: 10% (Hourly rate <= Budget)
 * 
 * Score Range: 0 - 100
 */
const calculateMatchScore = async (request, tutor) => {
  let score = 0;
  const explanation = [];

  // 1. Subject Match (Base 40 points for having the subject)
  // Check skill level for bonus
  const tutorSubject = tutor.tutorSubjects.find(s => s.subjectId === request.subjectId);
  if (tutorSubject) {
    score += 40;
    explanation.push("Matches subject");
    
    // Bonus for Advanced skill
    if (tutorSubject.skillLevel === 'ADVANCED') {
      score += 5; // Extra bonus, capped at 100 total later
      explanation.push("Expert in this subject");
    }
  }

  // 2. Level Fit (20 points)
  if (tutor.tutorProfile.levelsSupported.includes(request.preferredLevel)) {
    score += 20;
    explanation.push(`Supports ${request.preferredLevel} level`);
  }

  // 3. Availability Closeness (20 points)
  // Check if tutor has a slot within ±3 days of preferredStart
  let hasCloseSlot = false;
  if (request.preferredStart) {
    const preferredTime = new Date(request.preferredStart).getTime();
    const threeDaysMs = 3 * 24 * 60 * 60 * 1000;
    
    // Check available slots
    // We assume availabilitySlots are loaded on the tutor object
    const slots = await prisma.availabilitySlot.findMany({
      where: {
        tutorId: tutor.id,
        isBooked: false,
        startTime: {
          gte: new Date(preferredTime - threeDaysMs),
          lte: new Date(preferredTime + threeDaysMs)
        }
      },
      take: 1
    });

    if (slots.length > 0) {
      hasCloseSlot = true;
      score += 20;
      explanation.push("Available near your preferred time");
    }
  } else {
    // If no preferred time, give partial points for having *any* future availability
    const anySlot = await prisma.availabilitySlot.findFirst({
      where: {
        tutorId: tutor.id,
        isBooked: false,
        startTime: { gte: new Date() }
      }
    });
    if (anySlot) {
      score += 10;
      explanation.push("Has upcoming availability");
    }
  }

  // 4. Rating (10 points)
  // Normalize averageRating (1-5) to 0-10 scale.
  // We fetch average rating from Tutor's Course Reviews + Direct Tutor Reviews
  const courseReviews = await prisma.courseReview.aggregate({
    where: { course: { tutorId: tutor.id } },
    _avg: { rating: true },
    _count: { rating: true }
  });

  const tutorReviews = await prisma.review.aggregate({
    where: { tutorId: tutor.id },
    _avg: { rating: true },
    _count: { rating: true }
  });

  // Combine weighted average if both exist
  let avgRating = 0;
  let totalCount = (courseReviews._count.rating || 0) + (tutorReviews._count.rating || 0);

  if (totalCount > 0) {
    const courseSum = (courseReviews._avg.rating || 0) * (courseReviews._count.rating || 0);
    const tutorSum = (tutorReviews._avg.rating || 0) * (tutorReviews._count.rating || 0);
    avgRating = (courseSum + tutorSum) / totalCount;
  }

  // If no reviews, default to neutral 3.5 stars -> 7 points
  const ratingScore = totalCount > 0 ? (avgRating / 5) * 10 : 7; 
  score += ratingScore;
  if (avgRating > 4.5) explanation.push("Top rated tutor");

  // 5. Budget Fit (10 points)
  if (request.budgetMax) {
    const rate = parseFloat(tutor.tutorProfile.hourlyRate);
    const budget = parseFloat(request.budgetMax);
    
    if (rate <= budget) {
      score += 10;
      explanation.push("Within your budget");
    } else if (rate <= budget * 1.2) {
      // Within 20% of budget
      score += 5;
    }
  } else {
    // No budget constraint -> neutral points
    score += 5;
  }

  return {
    score: Math.min(Math.round(score), 100),
    explanation: explanation.join(", ")
  };
};

const findMatchesForRequest = async (requestId) => {
  const request = await prisma.tutoringRequest.findUnique({
    where: { id: requestId },
    include: { subject: true }
  });

  if (!request) throw new Error('Request not found');

  // 1. Filter Tutors by Subject (Mandatory)
  // Also fetch necessary profile data for scoring
  const potentialTutors = await prisma.user.findMany({
    where: {
      role: 'TUTOR',
      tutorSubjects: {
        some: {
          subjectId: request.subjectId
        }
      }
    },
    include: {
      tutorProfile: true,
      tutorSubjects: true,
      // We don't include availabilitySlots here to avoid fetching too much data,
      // we'll query them individually or optimize later
    }
  });

  // 2. Score Tutors
  const scoredTutors = await Promise.all(potentialTutors.map(async (tutor) => {
    // Basic Filtering: Language (Optional strictness)
    if (request.preferredLanguage && 
        !tutor.tutorProfile.languages.includes(request.preferredLanguage)) {
      return null; // Strict filter? Or just low score? Let's filter out for now.
    }

    const { score, explanation } = await calculateMatchScore(request, tutor);
    
    // Get next available slot for display
    const nextSlot = await prisma.availabilitySlot.findFirst({
      where: {
        tutorId: tutor.id,
        isBooked: false,
        startTime: { gte: new Date() }
      },
      orderBy: { startTime: 'asc' }
    });

    return {
      tutorId: tutor.id,
      name: `${tutor.firstName} ${tutor.lastName}`,
      photoUrl: tutor.profilePictureUrl,
      hourlyRate: tutor.tutorProfile.hourlyRate,
      languages: tutor.tutorProfile.languages,
      levelsSupported: tutor.tutorProfile.levelsSupported,
      score,
      explanation,
      nextAvailableSlot: nextSlot
    };
  }));

  // Filter nulls and sort by score
  return scoredTutors
    .filter(t => t !== null)
    .sort((a, b) => b.score - a.score)
    .slice(0, 10); // Return top 10
};

module.exports = {
  findMatchesForRequest
};