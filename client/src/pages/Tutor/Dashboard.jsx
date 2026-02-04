import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuthStore } from '../../store/authStore';
import { useTranslation } from 'react-i18next';
import ScheduleSessionCard from '../../components/Tutor/ScheduleSessionCard';

import TutorVerificationPending from '../../components/TutorVerificationPending';
import './TutorDashboard.css';

const TutorDashboard = () => {
  const { user, token } = useAuthStore();
  const { t } = useTranslation('dashboard');
  const [stats, setStats] = useState(null);
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      const config = {
        headers: { Authorization: `Bearer ${token}` },
      };

      const response = await axios.get(`${API_URL}/tutor/dashboard/stats`, config);
      if (response.data) {
        setStats(response.data);
      }
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    }
  };

  const handleSessionCreated = () => {
    // Refresh stats
    fetchDashboardStats();
    // Increment key to force re-render of TodaySchedulePanel
    setRefreshKey(prev => prev + 1);
  };

  // Check if tutor is verified
  const isVerified = user?.tutorVerification?.status === 'APPROVED';

  // If not verified, show verification pending screen
  if (!isVerified) {
    return <TutorVerificationPending />;
  }

  return (
    <div className="tutor-dashboard">
      <div className="dashboard-header">
        <div className="header-content">
          <div>
            <h1>Tutor Dashboard</h1>
            <p className="dashboard-subtitle">{t('tutor.welcome', { name: user?.firstName })}</p>
          </div>
          <Link to="/tutor/courses/create" className="btn-create-course-float">
            <i className="fas fa-plus"></i>
            {t('tutor.createCourse')}
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
            <p>{t('tutor.publishedCourses')}</p>
            <span className="stat-label">Currently active</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon students">
            <i className="fas fa-users"></i>
          </div>
          <div className="stat-info">
            <h3>{stats?.totalStudents || 0}</h3>
            <p>{t('tutor.totalStudents')}</p>
            <span className="stat-label">{t('tutor.acrossAllCourses')}</span>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon sessions">
            <i className="fas fa-calendar-day"></i>
          </div>
          <div className="stat-info">
            <h3>{stats?.upcomingSessions || 0}</h3>
            <p>{t('tutor.todaysSessions')}</p>
            <span className="stat-label">{t('tutor.scheduledForToday')}</span>
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
            <h3>{t('tutor.myCourses')}</h3>
            <p>{t('tutor.myCoursesDesc')}</p>
          </div>
          <div className="card-action">
            <span>{t('tutor.viewAllCourses')} →</span>
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
        <Link to="/tutor/schedule" className="availability-link">
          Manage Availability →
        </Link>
      </div>

      {/* Main Content Area - Schedule Session & Today's Schedule */}
      <div className="dashboard-main-content mt-lg" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
        <ScheduleSessionCard onSessionCreated={handleSessionCreated} />
      </div>
    </div>
  );
};

export default TutorDashboard;

