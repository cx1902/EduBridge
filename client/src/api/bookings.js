import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

// Get auth token
const getToken = () => {
    const authStorage = localStorage.getItem('auth-storage') || sessionStorage.getItem('auth-storage');
    if (authStorage) {
        try {
            const parsed = JSON.parse(authStorage);
            return parsed.state?.token || parsed.token;
        } catch (e) {
            return null;
        }
    }
    return null;
};

// Get auth headers
const getAuthHeaders = () => {
    const token = getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
};

/**
 * Search for tutors
 */
export const searchTutors = async (filters = {}) => {
    const params = new URLSearchParams();

    if (filters.name) params.append('name', filters.name);
    if (filters.subject) params.append('subject', filters.subject);
    if (filters.level) params.append('level', filters.level);
    if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);

    const response = await axios.get(`${API_URL}/bookings/tutors/search?${params.toString()}`, {
        headers: getAuthHeaders()
    });

    return response.data;
};

/**
 * Create booking request
 */
export const createBookingRequest = async (bookingData) => {
    const response = await axios.post(`${API_URL}/bookings/request`, bookingData, {
        headers: getAuthHeaders()
    });
    return response.data;
};

/**
 * Get my booking requests (student)
 */
export const getMyBookingRequests = async () => {
    const response = await axios.get(`${API_URL}/bookings/my-requests`, {
        headers: getAuthHeaders()
    });
    return response.data;
};

/**
 * Get received booking requests (tutor)
 */
export const getReceivedBookingRequests = async (status) => {
    const params = status ? `?status=${status}` : '';
    const response = await axios.get(`${API_URL}/bookings/received${params}`, {
        headers: getAuthHeaders()
    });
    return response.data;
};

/**
 * Accept booking request (tutor)
 */
export const acceptBooking = async (bookingId) => {
    const response = await axios.post(`${API_URL}/bookings/${bookingId}/accept`, {}, {
        headers: getAuthHeaders()
    });
    return response.data;
};

/**
 * Decline booking request (tutor)
 */
export const declineBooking = async (bookingId, reason) => {
    const response = await axios.post(`${API_URL}/bookings/${bookingId}/decline`,
        { reason },
        {
            headers: getAuthHeaders()
        }
    );
    return response.data;
};

/**
 * Cancel booking request (student)
 */
export const cancelBooking = async (bookingId) => {
    const response = await axios.delete(`${API_URL}/bookings/${bookingId}/cancel`, {
        headers: getAuthHeaders()
    });
    return response.data;
};
