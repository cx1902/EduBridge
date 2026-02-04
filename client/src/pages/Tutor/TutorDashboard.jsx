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
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

      const [statsRes, sessionsRes, enrollmentsRes, notificationsRes] = await Promise.all([
        axios.get(`${API_URL}/tutor/dashboard/stats`, config),
        axios.get(`${API_URL}/tutor/dashboard/sessions/today`, config),
        axios.get(`${API_URL}/tutor/dashboard/enrollments/recent`, config),
        axios.get(`${API_URL}/tutor/dashboard/notifications`, config),
      ]);

      // Extract data correctly - the API returns data directly, not nested in a data property
      console.log('Stats response:', statsRes.data);
      console.log('Sessions response:', sessionsRes.data);

      setStats(statsRes.data);
      setTodaysSessions(Array.isArray(sessionsRes.data) ? sessionsRes.data : []);
      setRecentEnrollments(Array.isArray(enrollmentsRes.data) ? enrollmentsRes.data : []);
      setNotifications(Array.isArray(notificationsRes.data) ? notificationsRes.data : []);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
      console.error('Error response:', err.response?.data);
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
        <div className="header-content">
          <div>
            <h1>Tutor Dashboard</h1>
            <p className="dashboard-subtitle">Welcome back, {user?.firstName}!</p>
          </div>
          <Link to="/tutor/courses/new" className="btn-create-course-float">
            <i className="fas fa-plus"></i>
            Create Course
          </Link>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon active-courses">
            <i className="fas fa-book"></i>
          </div>
          <div className="stat-info">
            <h3>{stats?.publishedCourses || 0}</h3>
            <p>Active Courses</p>
            <span className="stat-label">Published courses</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon students">
            <i className="fas fa-users"></i>
          </div>
          <div className="stat-info">
            <h3>{stats?.totalStudents || 0}</h3>
            <p>Total Students</p>
            <span className="stat-label">Across all courses</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon sessions">
            <i className="fas fa-calendar-day"></i>
          </div>
          <div className="stat-info">
            <h3>{stats?.upcomingSessions || 0}</h3>
            <p>Today's Sessions</p>
            <span className="stat-label">Scheduled for today</span>
          </div>
        </div>
      </div>

      {/* Quick Access Cards */}
      <div className="quick-access-grid">
        <Link to="/tutor/courses" className="quick-access-card">
          <div className="card-icon">
            <i className="fas fa-book-open"></i>
          </div>
          <div className="card-content">
            <h3>My Courses</h3>
            <p>Manage and edit your courses</p>
          </div>
          <div className="card-action">
            <span>View All Courses →</span>
          </div>
        </Link>

        <Link to="/tutor/sessions" className="quick-access-card">
          <div className="card-icon">
            <i className="fas fa-video"></i>
          </div>
          <div className="card-content">
            <h3>Session Management</h3>
            <p>Manage your upcoming and past sessions</p>
          </div>
          <div className="card-action">
            <span>Manage Sessions →</span>
          </div>
        </Link>

        <Link to="/tutor/reports" className="quick-access-card">
          <div className="card-icon">
            <i className="fas fa-chart-line"></i>
          </div>
          <div className="card-content">
            <h3>Session Statistics</h3>
            <p>Session completion & ratings</p>
          </div>
          <div className="card-action">
            <span>View Reports →</span>
          </div>
        </Link>
      </div>

      {/* Availability Card */}
      <div className="availability-card">
        <div className="availability-header">
          <div className="availability-icon">
            <i className="fas fa-calendar-alt"></i>
          </div>
          <div className="availability-content">
            <h3>My Availability</h3>
            <p>Set your available hours for booking</p>
          </div>
        </div>
        <Link to="/tutor/availability" className="availability-link">
          Manage Availability →
        </Link>
      </div>

      <div className="dashboard-content">
        {/* Today's Sessions */}
        <div className="dashboard-section">
          <div className="section-header">
            <h2>Today's Sessions</h2>
            <Link to="/tutor/sessions" className="view-all">Manage Sessions</Link>
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
