import api from './axios';

// Student: Get my bookings/sessions
export const getMySessions = async (status) => {
  const params = status ? { status } : {};
  const response = await api.get('/sessions/my-bookings', { params });
  return response.data;
};

// Student: Confirm session
export const confirmSession = async (sessionId) => {
  const response = await api.post(`/sessions/${sessionId}/confirm`);
  return response.data;
};

// Student: Cancel booking
export const cancelBooking = async (bookingId) => {
  const response = await api.post(`/sessions/bookings/${bookingId}/cancel`);
  return response.data;
};

// Tutor: Get my sessions (history + upcoming)
// Note: We'll use getAvailableSessions logic or similar if specific endpoint exists
// Actually, session.controller.js has getTodaySessions, but we want all.
// We might need to rely on getAvailableSessions with query params if it supports tutor filtering
// Or use the /tutor/dashboard/sessions/today logic but expanded.
// However, the backend audit showed `getAvailableSessions` filters by "future only".
// We might need a new endpoint for Tutor Session History.
// But for now, let's assume we can filter by date range on `getAvailableSessions` if we are the tutor?
// No, `getAvailableSessions` is for students to find slots.
// Let's use `getDashboardStats` for overview, and maybe `getTodaySessions`.
// Wait, `session.controller.js` has `getTodaySessions` for Tutor.
// We need `getTutorSessions` (All).
// I'll add `getTutorSessions` to `client/src/api/sessions.js` assuming I might need to add it to backend or use what's available.
// Actually, `tutor.controller.js` has `getSessionStatistics` which returns recent history.
// Let's stick to what we have or add what's missing. 
// I'll add `getTutorSessions` to `session.controller.js` if needed, but for now let's try to reuse `getAvailableSessions` or similar?
// No, `getAvailableSessions` returns `TutoringSession` with `status=SCHEDULED`.
// I'll add `getTutorSessions` to `client/src/api/sessions.js` and if it fails I'll fix backend.
// Actually, let's implement `getTutorSessions` in backend properly if it's missing.
// Checking `session.controller.js`: it has `getTodaySessions`.
// Checking `tutor.controller.js`: it has `getSessionStatistics`.
// I'll add `getTutorSessions` to `session.controller.js` (Backend) in next step if needed. 
// For now, I'll write the API function expecting the endpoint `/sessions/tutor` (which I should create).

export const getTutorSessions = async (params) => {
  const response = await api.get('/sessions/tutor', { params });
  return response.data;
};

// Tutor: Update session status
export const updateSessionStatus = async (sessionId, status) => {
  const response = await api.patch(`/sessions/${sessionId}/status`, { status });
  return response.data;
};
