import React from 'react';
import { Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useTranslation } from 'react-i18next';
import ScheduleSessionCard from '../../components/Tutor/ScheduleSessionCard';
import TodaySchedulePanel from '../../components/Tutor/TodaySchedulePanel';
import TutorVerificationPending from '../../components/TutorVerificationPending';

const TutorDashboard = () => {
  const { user } = useAuthStore();
  const { t } = useTranslation('dashboard');

  // Check if tutor is verified
  const isVerified = user?.tutorVerification?.status === 'APPROVED';

  // If not verified, show verification pending screen
  if (!isVerified) {
    return <TutorVerificationPending />;
  }

  return (
    <div className="container">
      <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>{t('tutor.title')}</h1>
          <p>{t('tutor.welcome', { name: user?.firstName })}</p>
        </div>
        <Link to="/tutor/courses/create" className="btn btn-primary">
          + {t('tutor.createCourse')}
        </Link>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 mt-lg gap-md">
        <div className="card">
          <h4>{t('tutor.activeCourses')}</h4>
          <p className="stat-number">0</p>
          <p className="text-secondary">{t('tutor.publishedCourses')}</p>
        </div>
        <div className="card">
          <h4>{t('tutor.totalStudents')}</h4>
          <p className="stat-number">0</p>
          <p className="text-secondary">{t('tutor.acrossAllCourses')}</p>
        </div>
        <div className="card">
          <h4>{t('tutor.todaysSessions')}</h4>
          <p className="stat-number">0</p>
          <p className="text-secondary">{t('tutor.scheduledForToday')}</p>
        </div>
      </div>

      {/* Quick Action Cards - My Courses, Session Management, Session Statistics */}
      <div className="grid grid-cols-3 mt-lg gap-md">
        <div className="card">
          <h3>{t('tutor.myCourses')}</h3>
          <p className="text-secondary">{t('tutor.myCoursesDesc')}</p>
          <Link to="/tutor/courses" className="btn btn-link mt-md">{t('tutor.viewAllCourses')}</Link>
        </div>
        <div className="card">
          <h3>Session Management</h3>
          <p className="text-secondary">Manage your upcoming and past sessions</p>
          <Link to="/tutor/sessions" className="btn btn-link mt-md">Manage Sessions &rarr;</Link>
        </div>
        <div className="card">
          <h3>{t('tutor.sessionStatistics')}</h3>
          <p className="text-secondary">{t('tutor.sessionStatisticsDesc')}</p>
          <Link to="/tutor/reports" className="btn btn-link mt-md">{t('tutor.viewReports')}</Link>
        </div>
        <div className="card">
          <h3>My Availability</h3>
          <p className="text-secondary">Set your available hours for booking</p>
          <Link to="/tutor/schedule" className="btn btn-link mt-md">Manage Availability &rarr;</Link>
        </div>
      </div>

      {/* Main Content Area - Schedule Session & Today's Schedule */}
      <div className="dashboard-grid mt-lg">
        {/* Left Column - Schedule Session */}
        <div className="dashboard-main">
          <ScheduleSessionCard />
        </div>

        {/* Right Column - Today's Schedule */}
        <div className="dashboard-sidebar">
          <TodaySchedulePanel />
        </div>
      </div>
    </div>
  );
};

export default TutorDashboard;
