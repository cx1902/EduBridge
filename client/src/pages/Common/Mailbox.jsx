import React, { useState, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
    FaEnvelope,
    FaEnvelopeOpen,
    FaTrash,
    FaCheckDouble,
    FaGraduationCap,
    FaCalendarAlt,
    FaBell,
    FaTimes,
    FaVideo,
    FaStickyNote,
    FaUser
} from 'react-icons/fa';
import {
    getNotifications,
    markAsRead,
    markAllAsRead,
    deleteNotification
} from '../../api/notifications';
import { getSession } from '../../api/sessions';
import { useAuthStore } from '../../store/authStore';
import './Mailbox.css';

const Mailbox = () => {
    const { user } = useAuthStore();
    const queryClient = useQueryClient();
    const [filter, setFilter] = useState('all'); // all, unread
    const [page, setPage] = useState(0);
    const limit = 20;

    // Drawer state
    const [selectedNotification, setSelectedNotification] = useState(null);
    const [isDrawerOpen, setIsDrawerOpen] = useState(false);
    const [sessionDetails, setSessionDetails] = useState(null);
    const [isLoadingDetails, setIsLoadingDetails] = useState(false);

    // Fetch details when a notification is selected
    useEffect(() => {
        const fetchDetails = async () => {
            if (!selectedNotification) return;

            // Clear previous details
            setSessionDetails(null);

            // Check if it's a session-related notification with a link
            if (selectedNotification.link && selectedNotification.link.includes('/sessions/')) {
                const sessionId = selectedNotification.link.split('/').pop();
                if (sessionId) {
                    setIsLoadingDetails(true);
                    try {
                        const data = await getSession(sessionId);
                        setSessionDetails(data.data);
                    } catch (error) {
                        console.error("Failed to fetch session details", error);
                    } finally {
                        setIsLoadingDetails(false);
                    }
                }
            } else {
                setSessionDetails(null);
            }
        };

        if (isDrawerOpen) {
            fetchDetails();
        }
    }, [selectedNotification, isDrawerOpen]);

    const handleNotificationClick = (notification) => {
        setSelectedNotification(notification);
        setIsDrawerOpen(true);
        if (!notification.read) {
            markReadMutation.mutate(notification.id);
        }
    };

    const closeDrawer = () => {
        setIsDrawerOpen(false);
        setSelectedNotification(null);
    };

    const location = useLocation();

    // Determine role based on user profile first, then fall back to path
    const role = user?.role || (location.pathname.startsWith('/tutor') ? 'TUTOR' : location.pathname.startsWith('/admin') ? 'ADMIN' : 'STUDENT');

    // Fetch notifications
    const { data: notificationsData, isLoading, error } = useQuery({
        queryKey: ['notifications', filter, page, role, user?.id],
        queryFn: () => getNotifications({
            limit,
            offset: page * limit,
            unreadOnly: filter === 'unread',
            role
        }),
        enabled: !!user?.id, // Only fetch when user is authenticated
    });

    const notifications = notificationsData?.data?.notifications || [];
    const pagination = notificationsData?.data?.pagination || {};
    const unreadCount = notificationsData?.data?.unreadCount || 0;

    // Mark as read mutation
    const markReadMutation = useMutation({
        mutationFn: markAsRead,
        onSuccess: () => {
            queryClient.invalidateQueries(['notifications']);
            queryClient.invalidateQueries(['recentNotifications']);
            queryClient.invalidateQueries(['unreadCount']);
        },
    });

    // Mark all as read mutation
    const markAllReadMutation = useMutation({
        mutationFn: markAllAsRead,
        onSuccess: () => {
            queryClient.invalidateQueries(['notifications']);
            queryClient.invalidateQueries(['recentNotifications']);
            queryClient.invalidateQueries(['unreadCount']);
        },
    });

    // Delete notification mutation
    const deleteMutation = useMutation({
        mutationFn: deleteNotification,
        onSuccess: () => {
            queryClient.invalidateQueries(['notifications']);
            queryClient.invalidateQueries(['recentNotifications']);
            queryClient.invalidateQueries(['unreadCount']);
        },
    });

    const formatTimestamp = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;

        if (diff < 60000) return 'Just now';
        if (diff < 3600000) return `${Math.floor(diff / 60000)} minutes ago`;
        if (diff < 86400000) return `${Math.floor(diff / 3600000)} hours ago`;
        if (diff < 604800000) return `${Math.floor(diff / 86400000)} days ago`;

        return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined
        });
    };

    const getNotificationIcon = (notification) => {
        const message = notification.message.toLowerCase();
        if (message.includes('course') || message.includes('lesson') || message.includes('quiz')) {
            return <FaGraduationCap className="notif-type-icon course" />;
        }
        if (message.includes('session') || message.includes('booking')) {
            return <FaCalendarAlt className="notif-type-icon session" />;
        }
        return <FaBell className="notif-type-icon general" />;
    };

    const handleMarkAllRead = () => {
        if (window.confirm('Mark all notifications as read?')) {
            markAllReadMutation.mutate();
        }
    };

    const handleDelete = (id) => {
        if (window.confirm('Delete this notification?')) {
            deleteMutation.mutate(id);
        }
    };

    if (error) {
        return (
            <div className="mailbox-container">
                <div className="error-message">
                    Failed to load notifications. Please try again later.
                </div>
            </div>
        );
    }

    return (
        <div className="mailbox-container">
            <div className="mailbox-header">
                <div className="header-left">
                    <h1><FaEnvelope /> Mailbox</h1>
                    <p className="header-subtitle">
                        {unreadCount > 0 ? `${unreadCount} unread notification${unreadCount > 1 ? 's' : ''}` : 'All caught up!'}
                    </p>
                </div>
                <div className="header-actions">
                    {unreadCount > 0 && (
                        <button
                            className="btn-mark-all-read"
                            onClick={handleMarkAllRead}
                            disabled={markAllReadMutation.isPending}
                        >
                            <FaCheckDouble /> Mark All Read
                        </button>
                    )}
                </div>
            </div>

            <div className="mailbox-filters">
                <button
                    className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
                    onClick={() => {
                        setFilter('all');
                        setPage(0);
                    }}
                >
                    All
                </button>
                <button
                    className={`filter-btn ${filter === 'unread' ? 'active' : ''}`}
                    onClick={() => {
                        setFilter('unread');
                        setPage(0);
                    }}
                >
                    Unread {unreadCount > 0 && `(${unreadCount})`}
                </button>
            </div>

            <div className="mailbox-content">
                {isLoading ? (
                    <div className="loading-state">
                        <div className="spinner"></div>
                        <p>Loading notifications...</p>
                    </div>
                ) : notifications.length > 0 ? (
                    <>
                        <div className="notifications-list">
                            {notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={`notification-card ${notification.read ? 'read' : 'unread'}`}
                                    onClick={() => handleNotificationClick(notification)}
                                >
                                    <div className="notification-indicator">
                                        {!notification.read && <span className="unread-indicator"></span>}
                                    </div>

                                    <div className="notification-icon-wrapper">
                                        {getNotificationIcon(notification)}
                                    </div>

                                    <div className="notification-body">
                                        <p className="notification-message">{notification.message}</p>
                                        <span className="notification-timestamp">
                                            {formatTimestamp(notification.createdAt)}
                                        </span>
                                    </div>

                                    <div className="notification-actions">
                                        {!notification.read && (
                                            <button
                                                className="action-btn read-btn"
                                                onClick={() => markReadMutation.mutate(notification.id)}
                                                title="Mark as read"
                                                disabled={markReadMutation.isPending}
                                            >
                                                <FaEnvelopeOpen />
                                            </button>
                                        )}
                                        <button
                                            className="action-btn delete-btn"
                                            onClick={() => handleDelete(notification.id)}
                                            title="Delete"
                                            disabled={deleteMutation.isPending}
                                        >
                                            <FaTrash />
                                            <span className="btn-label">Delete</span>
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Pagination */}
                        {pagination.total > limit && (
                            <div className="pagination">
                                <button
                                    className="pagination-btn"
                                    onClick={() => setPage(p => Math.max(0, p - 1))}
                                    disabled={page === 0}
                                >
                                    Previous
                                </button>
                                <span className="pagination-info">
                                    Page {page + 1} of {Math.ceil(pagination.total / limit)}
                                </span>
                                <button
                                    className="pagination-btn"
                                    onClick={() => setPage(p => p + 1)}
                                    disabled={(page + 1) * limit >= pagination.total}
                                >
                                    Next
                                </button>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="empty-state">
                        <FaEnvelope className="empty-icon" />
                        <h3>No notifications</h3>
                        <p>
                            {filter === 'unread'
                                ? "You're all caught up! No unread notifications."
                                : "You don't have any notifications yet."}
                        </p>
                    </div>
                )}
            </div>

            {/* Notification Drawer */}
            <div className={`notification-drawer-overlay ${isDrawerOpen ? 'open' : ''}`} onClick={closeDrawer}></div>
            <div className={`notification-drawer ${isDrawerOpen ? 'open' : ''}`}>
                <div className="drawer-header">
                    <h2>Notification Details</h2>
                    <button className="close-drawer-btn" onClick={closeDrawer}>
                        <FaTimes />
                    </button>
                </div>

                {selectedNotification && (
                    <div className="drawer-content">
                        <div className="drawer-section main-info">
                            <div className="drawer-icon-large">
                                {getNotificationIcon(selectedNotification)}
                            </div>
                            <h3>{selectedNotification.title || "Notification"}</h3>
                            <p className="drawer-message">{selectedNotification.message}</p>
                            <span className="drawer-time">{formatTimestamp(selectedNotification.createdAt)}</span>
                        </div>

                        {/* Session Details Section */}
                        {isLoadingDetails ? (
                            <div className="drawer-loading">
                                <div className="spinner-small"></div>
                                <p>Loading details...</p>
                            </div>
                        ) : sessionDetails ? (
                            <div className="drawer-section details-card">
                                <h4>Session Details</h4>
                                <div className="detail-row">
                                    <span className="detail-label"><FaGraduationCap /> Subject</span>
                                    <span className="detail-value">{sessionDetails.subject} ({sessionDetails.educationLevel})</span>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-label"><FaUser /> {user?.role?.toUpperCase() === 'TUTOR' ? 'Student' : 'Tutor'}</span>
                                    <span className="detail-value">
                                        {user?.role?.toUpperCase() === 'TUTOR'
                                            ? (sessionDetails.bookings && sessionDetails.bookings.length > 0
                                                ? `${sessionDetails.bookings[0].student.firstName} ${sessionDetails.bookings[0].student.lastName}`
                                                : 'Student')
                                            : `${sessionDetails.tutor?.firstName} ${sessionDetails.tutor?.lastName}`
                                        }
                                    </span>
                                </div>
                                <div className="detail-row">
                                    <span className="detail-label"><FaCalendarAlt /> Time</span>
                                    <span className="detail-value">
                                        {new Date(sessionDetails.scheduledStart).toLocaleString()}
                                    </span>
                                </div>

                                {sessionDetails.sessionNotes && (
                                    (() => {
                                        try {
                                            if (sessionDetails.sessionNotes.startsWith('{')) {
                                                const parsed = JSON.parse(sessionDetails.sessionNotes);
                                                return (
                                                    <>
                                                        {parsed.platform && (
                                                            <div className="detail-row">
                                                                <span className="detail-label"><FaVideo /> Platform</span>
                                                                <span className="detail-value">{parsed.platform}</span>
                                                            </div>
                                                        )}
                                                        {parsed.notes && (
                                                            <div className="detail-block">
                                                                <span className="detail-label"><FaStickyNote /> Tutor Notes</span>
                                                                <div className="detail-value-box">
                                                                    {parsed.notes}
                                                                </div>
                                                            </div>
                                                        )}
                                                    </>
                                                );
                                            }
                                            return (
                                                <div className="detail-block">
                                                    <span className="detail-label"><FaStickyNote /> Notes</span>
                                                    <div className="detail-value-box">
                                                        {sessionDetails.sessionNotes}
                                                    </div>
                                                </div>
                                            );
                                        } catch (e) {
                                            return (
                                                <div className="detail-block">
                                                    <span className="detail-label"><FaStickyNote /> Notes</span>
                                                    <div className="detail-value-box">
                                                        {sessionDetails.sessionNotes}
                                                    </div>
                                                </div>
                                            );
                                        }
                                    })()
                                )}

                                {(sessionDetails.videoRoomId || sessionDetails.meetingLink) && (
                                    <div className="detail-block">
                                        <span className="detail-label"><FaVideo /> Meeting Link</span>
                                        <div className="detail-value-box link-box">
                                            {sessionDetails.videoRoomId || sessionDetails.meetingLink || "No link provided"}
                                        </div>
                                        <a
                                            href={user?.role === 'TUTOR' ? '/tutor/sessions' : '/student/sessions'}
                                            className="join-session-btn"
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                // If keeping within app, use navigate, but href works for now
                                            }}
                                        >
                                            View Session Page
                                        </a>
                                    </div>
                                )}
                            </div>
                        ) : selectedNotification.link && (
                            <div className="drawer-section">
                                {/* Fallback if no session details or generic link */}
                                <a
                                    href={selectedNotification.link}
                                    className="view-link-btn"
                                >
                                    Open Related Page
                                </a>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default Mailbox;
