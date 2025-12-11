import React from 'react';
import { useAuthStore } from '../../store/authStore';
import { useTranslation } from 'react-i18next';

const StudentDashboard = () => {
  const { user } = useAuthStore();
  const { t } = useTranslation('dashboard');

  return (
    <div className="container">
      <h1>{t('student.welcome', { name: user?.firstName })}</h1>
      <div className="grid grid-cols-3 mt-lg">
        <div className="card">
          <h3>{t('student.myCourses')}</h3>
          <p className="text-secondary">{t('student.myCoursesDesc')}</p>
          <div className="mt-md">
            <p className="text-muted">{t('student.noCoursesEnrolled')}</p>
          </div>
        </div>
        <div className="card">
          <h3>{t('student.progress')}</h3>
          <p className="text-secondary">{t('student.progressDesc')}</p>
          <div className="mt-md">
            <p>{t('student.points')}: {user?.totalPoints || 0}</p>
            <p>{t('student.streak')}: {user?.currentStreak || 0} {t('student.days')}</p>
          </div>
        </div>
        <div className="card">
          <h3>{t('student.upcomingSessions')}</h3>
          <p className="text-secondary">{t('student.upcomingSessionsDesc')}</p>
          <div className="mt-md">
            <p className="text-muted">{t('student.noUpcomingSessions')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StudentDashboard;
