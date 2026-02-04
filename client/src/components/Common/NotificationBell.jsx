import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { FaBell, FaEnvelope, FaCheckCircle } from 'react-icons/fa';
import { toast } from 'react-hot-toast';
import { useAuthStore } from '../../store/authStore';
import { getNotifications, markAsRead, getUnreadCount, markAllAsRead } from '../../api/notifications';
import './NotificationBell.css';

const NotificationBell = () => {
    const navigate = useNavigate();
    const location = useLocation();
    const queryClient = useQueryClient();
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef(null);
    const { user } = useAuthStore();

    // Determine role based on user profile first, logic fallback to path
    const role = user?.role || (location.pathname.startsWith('/tutor') ? 'TUTOR' : location.pathname.startsWith('/admin') ? 'ADMIN' : 'STUDENT');

    // Fetch unread count
    const { data: unreadCount = 0 } = useQuery({
        queryKey: ['unreadCount', role, user?.id],
        queryFn: () => getUnreadCount({ role }),
        refetchInterval: 60000,
        enabled: !!user?.id,
    });

    // Fetch recent notifications
    const { data: notificationsData, isLoading } = useQuery({
        queryKey: ['recentNotifications', role, user?.id],
        queryFn: () => getNotifications({ limit: 5, offset: 0, role }),
        enabled: isOpen && !!user?.id,
    });

    const notifications = notificationsData?.data?.notifications || [];

    // Mark as read mutation
    // Mark all as read mutation
    const markAllReadMutation = useMutation({
        mutationFn: markAllAsRead,
        onSuccess: () => {
            queryClient.invalidateQueries(['recentNotifications']);
            queryClient.invalidateQueries(['notifications']);
            queryClient.invalidateQueries(['unreadCount']);
            toast.success('All notifications marked as read');
        },
        onError: (error) => {
            toast.error(error.response?.data?.message || 'Failed to mark all as read');
        }
    });

    const markReadMutation = useMutation({
        mutationFn: markAsRead,
        onSuccess: () => {
            queryClient.invalidateQueries(['recentNotifications']);
            queryClient.invalidateQueries(['notifications']);
            queryClient.invalidateQueries(['unreadCount']);
        },
    });

    // Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const handleNotificationClick = (notification) => {
        if (!notification.read) {
            markReadMutation.mutate(notification.id);
        }
        setIsOpen(false);
        // You can add navigation logic here based on notification type
    };

    const formatTimestamp = (timestamp) => {
        const date = new Date(timestamp);
        const now = new Date();
        const diff = now - date;

        // Less than 1 minute
        if (diff < 60000) return 'Just now';
        // Less than 1 hour
        if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
        // Less than 1 day
        if (diff < 86400000) return `${Math.floor(diff / 3600000)}h ago`;
        // Less than 1 week
        if (diff < 604800000) return `${Math.floor(diff / 86400000)}d ago`;

        return date.toLocaleDateString();
    };

    return (
        <div className="notification-bell-container" ref={dropdownRef}>
            <button
                className="notification-bell-button"
                onClick={() => setIsOpen(!isOpen)}
                aria-label="Notifications"
            >
                <FaBell className="bell-icon" />
                {unreadCount > 0 && (
                    <span className="notification-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>
                )}
            </button>

            {isOpen && (
                <div className="notification-dropdown">
                    <div className="dropdown-header">
                        <h3>Notifications</h3>
                        <button
                            className="view-all-btn"
                            onClick={() => markAllReadMutation.mutate()}
                            disabled={markAllReadMutation.isPending || unreadCount === 0}
                        >
                            Mark as Read
                        </button>
                    </div>

                    <div className="notification-list">
                        {isLoading ? (
                            <div className="loading-state">Loading...</div>
                        ) : notifications.length > 0 ? (
                            notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={`notification-item ${notification.read ? 'read' : 'unread'}`}
                                    onClick={() => handleNotificationClick(notification)}
                                >
                                    <div className="notification-icon">
                                        {notification.read ? <FaCheckCircle /> : <FaEnvelope />}
                                    </div>
                                    <div className="notification-content">
                                        <p className="notification-message">{notification.message}</p>
                                        <span className="notification-time">{formatTimestamp(notification.createdAt)}</span>
                                    </div>
                                    {!notification.read && <span className="unread-dot"></span>}
                                </div>
                            ))
                        ) : (
                            <div className="empty-state">
                                <FaBell className="empty-icon" />
                                <p>No notifications yet</p>
                            </div>
                        )}
                    </div>

                    {notifications.length > 0 && (
                        <div className="dropdown-footer">
                            <button
                                className="footer-btn"
                                onClick={() => {
                                    navigate('/mailbox');
                                    setIsOpen(false);
                                }}
                            >
                                See All Notifications
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
