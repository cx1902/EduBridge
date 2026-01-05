import api from './axios';

// Search Tutors
export const searchTutors = async (filters) => {
  const response = await api.get('/tutors/search', { params: filters });
  return response.data;
};

// Get Tutor Profile (Public)
// We need a public endpoint for this?
// `tutor.controller.js` has `getTutorProfile` but it gets *my* profile (req.user.id).
// We need `getTutorById`.
// `tutoring.controller.js` has `getMatches` which returns tutor details.
// I should add `getTutorById` to `tutor.controller.js` (publicly accessible).
export const getTutorById = async (tutorId) => {
  const response = await api.get(`/tutors/profile/${tutorId}`);
  return response.data;
};

// Get Tutor Availability (Public)
export const getTutorAvailability = async (tutorId, start, end) => {
  const response = await api.get('/tutors/availability', { 
    params: { tutorId, start, end } 
  });
  return response.data;
};
