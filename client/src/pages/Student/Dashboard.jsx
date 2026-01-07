import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useTranslation } from 'react-i18next';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getCourseImageUrl } from '../../utils/images';
import './Dashboard.css';

const StudentDashboard = () => {
  const { user } = useAuthStore();
  const { t } = useTranslation('dashboard');
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [enrollments, setEnrollments] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [stats, setStats] = useState({
    totalPoints: 0,
    currentStreak: 0,
    completedCourses: 0,
    inProgress: 0
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = useAuthStore.getState().token || localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) return;

      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

      const headers = { Authorization: `Bearer ${token}` };

      // Parallel data fetching
      const [progressRes, sessionsRes] = await Promise.allSettled([
        axios.get(`${API_URL}/progress/my-progress`, { headers }),
        axios.get(`${API_URL}/sessions/my-bookings`, { headers })
      ]);

      // Handle Progress Data
      if (progressRes.status === 'fulfilled' && progressRes.value.data.success) {
        const data = progressRes.value.data.data;
        setEnrollments(data.enrollments || []);
        setStats({
          totalPoints: data.stats?.totalPoints || 0,
          currentStreak: data.stats?.currentStreak || 0,
          completedCourses: data.stats?.completedCourses || 0,
          inProgress: data.enrollments?.filter(e => e.progressPercentage < 100).length || 0
        });
      }

      // Handle Sessions Data
      if (sessionsRes.status === 'fulfilled' && sessionsRes.value.data.success) {
        // Map bookings to extract session details
        const mappedSessions = (sessionsRes.value.data.data || []).map(booking => ({
          ...booking.session,
          bookingId: booking.id,
          bookingStatus: booking.status
        }));
        setSessions(mappedSessions);
      }

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good Morning';
    if (hour < 18) return 'Good Afternoon';
    return 'Good Evening';
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return {
      day: date.getDate(),
      month: date.toLocaleString('default', { month: 'short' }),
      full: date.toLocaleDateString()
    };
  };

  if (loading) {
    return (
      <div className="student-dashboard loading">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="student-dashboard">
      <div className="dashboard-header">
        <div className="welcome-banner">
          <div className="welcome-content">
            <span className="date-badge">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long' })}
            </span>
            <h1>{getGreeting()}, {user?.firstName}!</h1>
            <p>Ready to continue your learning journey today?</p>
          </div>
          <div className="welcome-decoration"></div>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card stat-purple">
          <div className="stat-content">
            <h3>In Progress</h3>
            <div className="stat-value">{stats.inProgress}</div>
            <p className="stat-desc">Courses currently active</p>
          </div>
          <div className="stat-icon-watermark">
            <i className="fas fa-book-open"></i>
          </div>
        </div>

        <div className="stat-card stat-green">
          <div className="stat-content">
            <h3>Completed</h3>
            <div className="stat-value">{stats.completedCourses}</div>
            <p className="stat-desc">Courses finished</p>
          </div>
          <div className="stat-icon-watermark">
            <i className="fas fa-check-circle"></i>
          </div>
        </div>

        <div className="stat-card stat-orange">
          <div className="stat-content">
            <h3>Total Points</h3>
            <div className="stat-value">{stats.totalPoints}</div>
            <p className="stat-desc">Earned from quizzes</p>
          </div>
          <div className="stat-icon-watermark">
            <i className="fas fa-trophy"></i>
          </div>
        </div>

        <div className="stat-card stat-blue">
          <div className="stat-content">
            <h3>Day Streak</h3>
            <div className="stat-value">{stats.currentStreak}</div>
            <p className="stat-desc">Consecutive learning days</p>
          </div>
          <div className="stat-icon-watermark">
            <i className="fas fa-fire"></i>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        {/* Main Column */}
        <div className="main-column">
          <div className="section-header">
            <h2>My Courses</h2>
            <Link to="/student/my-courses" className="view-all-link">
              View All <i className="fas fa-arrow-right"></i>
            </Link>
          </div>

          <div className="courses-grid">
            {enrollments.length > 0 ? (
              enrollments.slice(0, 3).map(enrollment => (
                <div key={enrollment.id} className="course-progress-card">
                  <img
                    src={getCourseImageUrl(enrollment.courseThumbnail)}
                    alt={enrollment.courseTitle}
                    className="course-thumb"
                  />
                  <div className="course-details">
                    <h3>{enrollment.courseTitle}</h3>
                    <div className="progress-container">
                      <div className="progress-bar-bg">
                        <div
                          className="progress-bar-fill"
                          style={{ width: `${enrollment.progressPercentage}%` }}
                        ></div>
                      </div>
                      <div className="progress-text">
                        <span>{enrollment.progressPercentage}% Complete</span>
                        <span>{enrollment.completedLessons}/{enrollment.totalLessons} Lessons</span>
                      </div>
                    </div>
                  </div>
                  <button
                    className="btn-continue"
                    onClick={() => navigate(`/student/courses/${enrollment.courseId || enrollment.course?.id}/lesson/${enrollment.lastAccessedLessonId || enrollment.nextLessonId || 'first'}`)}
                  >
                    Continue
                  </button>
                </div>
              ))
            ) : (
              <div className="empty-state">
                <i className="fas fa-graduation-cap"></i>
                <p>You haven't enrolled in any courses yet.</p>
                <Link to="/courses" className="btn-continue" style={{ marginTop: '1rem', display: 'inline-block' }}>
                  Browse Courses
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Sidebar Column */}
        <div className="dashboard-sidebar">
          <div className="sidebar-card">
            <h3><i className="fas fa-calendar-alt" style={{ color: '#6366f1' }}></i> Upcoming Sessions</h3>

            <div className="sessions-list">
              {sessions.length > 0 ? (
                sessions.slice(0, 3).map(session => {
                  const date = formatDate(session.scheduledStart);
                  return (
                    <div key={session.id} className="session-item">
                      <div className="session-date">
                        <span className="session-day">{date.day}</span>
                        <span className="session-month">{date.month}</span>
                      </div>
                      <div className="session-info">
                        <h4>{session.subject}</h4>
                        <p>{new Date(session.scheduledStart).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="empty-state">
                  <p>No upcoming sessions scheduled.</p>
                </div>
              )}
            </div>
          </div>

          {/* Quick Actions Card */}
          <div className="sidebar-card">
            <h3>Quick Actions</h3>
            <div className="sessions-list">
              <Link to="/courses" className="session-item" style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="stat-icon icon-blue" style={{ width: '40px', height: '40px', fontSize: '1rem' }}>
                  <i className="fas fa-search"></i>
                </div>
                <div className="session-info">
                  <h4>Browse Courses</h4>
                  <p>Find new skills to learn</p>
                </div>
              </Link>
              <Link to="/student/find-tutor" className="session-item" style={{ textDecoration: 'none', color: 'inherit' }}>
                <div className="stat-icon icon-purple" style={{ width: '40px', height: '40px', fontSize: '1rem' }}>
                  <i className="fas fa-chalkboard-teacher"></i>
                </div>
                <div className="session-info">
                  <h4>Find a Tutor</h4>
                  <p>Book a 1-on-1 session</p>
                </div>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
