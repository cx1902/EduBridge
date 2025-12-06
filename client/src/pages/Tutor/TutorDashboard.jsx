import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuthStore } from '../../store/authStore';
import './TutorDashboard.css';

const TutorDashboard = () => {
  const [stats, setStats] = useState(null);
  const [todaysSessions, setTodaysSessions] = useState([]);
  const [recentEnrollments, setRecentEnrollments] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { user, token } = useAuthStore();

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const config = {
        headers: { Authorization: `Bearer ${token}` },
      };

      const [statsRes, sessionsRes, enrollmentsRes, notificationsRes] = await Promise.all([
        axios.get(`${import.meta.env.VITE_API_URL}/api/tutor/dashboard/stats`, config),
        axios.get(`${import.meta.env.VITE_API_URL}/api/tutor/dashboard/sessions/today`, config),
        axios.get(`${import.meta.env.VITE_API_URL}/api/tutor/dashboard/enrollments/recent`, config),
        axios.get(`${import.meta.env.VITE_API_URL}/api/tutor/dashboard/notifications`, config),
      ]);

      setStats(statsRes.data);
      setTodaysSessions(sessionsRes.data);
      setRecentEnrollments(enrollmentsRes.data);
      setNotifications(notificationsRes.data);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      setError('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getTimeUntilSession = (scheduledStart) => {
    const now = new Date();
    const start = new Date(scheduledStart);
    const diff = start - now;
    
    if (diff < 0) return 'In Progress';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) return `In ${hours}h ${minutes}m`;
    return `In ${minutes}m`;
  };

  if (loading) {
    return (
      <div className="tutor-dashboard">
        <div className="loading">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="tutor-dashboard">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  return (
    <div className="tutor-dashboard">
      <div className="dashboard-header">
        <h1>Welcome back, {user?.firstName}!</h1>
        <p className="dashboard-subtitle">Here's what's happening with your courses today</p>
      </div>

      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon students">
            <i className="fas fa-users"></i>
          </div>
          <div className="stat-info">
            <h3>{stats?.totalStudents || 0}</h3>
            <p>Total Students</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon courses">
            <i className="fas fa-book"></i>
          </div>
          <div className="stat-info">
            <h3>{stats?.publishedCourses || 0}</h3>
            <p>Published Courses</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon sessions">
            <i className="fas fa-video"></i>
          </div>
          <div className="stat-info">
            <h3>{stats?.upcomingSessions || 0}</h3>
            <p>Upcoming Sessions</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon rating">
            <i className="fas fa-star"></i>
          </div>
          <div className="stat-info">
            <h3>{stats?.averageRating || '0.00'}</h3>
            <p>Average Rating</p>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h2>Quick Actions</h2>
        <div className="action-buttons">
          <Link to="/tutor/courses/new" className="action-btn primary">
            <i className="fas fa-plus"></i>
            Create Course
          </Link>
          <Link to="/tutor/courses" className="action-btn secondary">
            <i className="fas fa-list"></i>
            View All Courses
          </Link>
          <Link to="/tutor/sessions" className="action-btn secondary">
            <i className="fas fa-calendar"></i>
            Schedule Session
          </Link>
        </div>
      </div>

      <div className="dashboard-content">
        {/* Today's Sessions */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2>Today's Sessions</h2>
            {todaysSessions.length > 0 && (
              <Link to="/tutor/sessions" className="view-all">View All</Link>
            )}
          </div>

          {todaysSessions.length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-calendar-check"></i>
              <p>No sessions scheduled for today</p>
            </div>
          ) : (
            <div className="sessions-list">
              {todaysSessions.map((session) => (
                <div key={session.id} className="session-card">
                  <div className="session-time">
                    <div className="time">{formatTime(session.scheduledStart)}</div>
                    <div className="countdown">{getTimeUntilSession(session.scheduledStart)}</div>
                  </div>
                  <div className="session-details">
                    <h4>{session.subject}</h4>
                    <p className="session-info">
                      <i className="fas fa-users"></i>
                      {session.bookings.length} / {session.maxParticipants} students
                    </p>
                    <p className="session-type">{session.sessionType.replace('_', ' ')}</p>
                  </div>
                  <div className="session-actions">
                    {session.status === 'SCHEDULED' && (
                      <button className="btn-start-session">
                        <i className="fas fa-play"></i>
                        Start Session
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Enrollments */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2>Recent Enrollments</h2>
            <span className="badge">{recentEnrollments.length} new</span>
          </div>

          {recentEnrollments.length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-user-plus"></i>
              <p>No new enrollments in the last 7 days</p>
            </div>
          ) : (
            <div className="enrollments-list">
              {recentEnrollments.slice(0, 5).map((enrollment) => (
                <div key={enrollment.id} className="enrollment-card">
                  <div className="student-avatar">
                    {enrollment.user.profilePictureUrl ? (
                      <img src={enrollment.user.profilePictureUrl} alt={enrollment.user.firstName} />
                    ) : (
                      <div className="avatar-placeholder">
                        {enrollment.user.firstName[0]}{enrollment.user.lastName[0]}
                      </div>
                    )}
                  </div>
                  <div className="enrollment-info">
                    <h4>{enrollment.user.firstName} {enrollment.user.lastName}</h4>
                    <p className="course-name">{enrollment.course.title}</p>
                    <p className="enrollment-date">{formatDate(enrollment.enrolledAt)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Notifications */}
      {notifications.length > 0 && (
        <div className="dashboard-section notifications-section">
          <div className="section-header">
            <h2>Notifications</h2>
            <span className="badge">{notifications.length}</span>
          </div>
          <div className="notifications-list">
            {notifications.slice(0, 5).map((notification) => (
              <div key={notification.id} className="notification-item">
                <div className={`notification-icon ${notification.type.toLowerCase()}`}>
                  <i className={`fas fa-${getNotificationIcon(notification.type)}`}></i>
                </div>
                <div className="notification-content">
                  <h4>{notification.title}</h4>
                  <p>{notification.message}</p>
                  <span className="notification-time">{formatDate(notification.createdAt)}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

const getNotificationIcon = (type) => {
  const icons = {
    COURSE_APPROVED: 'check-circle',
    ENROLLMENT: 'user-plus',
    SESSION_BOOKED: 'calendar-check',
    BADGE_EARNED: 'trophy',
    SYSTEM_ANNOUNCEMENT: 'bell',
  };
  return icons[type] || 'info-circle';
};

export default TutorDashboard;
