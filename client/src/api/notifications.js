import api from './axios';

/**
 * Get user notifications with pagination and filtering
 * @param {Object} params - Query parameters
 * @param {number} params.limit - Number of notifications to fetch
 * @param {number} params.offset - Offset for pagination
 * @param {boolean} params.unreadOnly - Filter only unread notifications
 * @returns {Promise} Response with notifications and metadata
 */
export const getNotifications = async (params = {}) => {
    const { limit = 20, offset = 0, unreadOnly = false, role } = params;
    const response = await api.get('/notifications', {
        params: { limit, offset, unreadOnly, role }
    });
    return response.data;
};

/**
 * Get count of unread notifications
 * @returns {Promise<number>} Unread count
 */
export const getUnreadCount = async (params = {}) => {
    const { role } = params;
    const response = await api.get('/notifications/unread-count', {
        params: { role }
    });
    return response.data.data.unreadCount || 0;
};

/**
 * Mark a single notification as read
 * @param {string} notificationId - ID of the notification
 * @returns {Promise} Updated notification
 */
export const markAsRead = async (notificationId) => {
    const response = await api.put(`/notifications/${notificationId}/read`);
    return response.data;
};

/**
 * Mark all notifications as read
 * @returns {Promise} Success response
 */
export const markAllAsRead = async () => {
    const response = await api.put('/notifications/read-all');
    return response.data;
};

/**
 * Delete a notification
 * @param {string} notificationId - ID of the notification
 * @returns {Promise} Success response
 */
export const deleteNotification = async (notificationId) => {
    const response = await api.delete(`/notifications/${notificationId}`);
    return response.data;
};
