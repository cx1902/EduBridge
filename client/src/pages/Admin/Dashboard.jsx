import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

const AdminDashboard = () => {
  const { user } = useAuthStore();
  const { t } = useTranslation('dashboard');
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeUsers: 0,
    totalCourses: 0,
    pendingApplications: 0,
    activeReports: 0,
    recentActions: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const [usersRes, coursesRes, applicationsRes, reportsRes, auditRes] = await Promise.all([
        axios.get('/api/admin/users', { params: { limit: 1 } }),
        axios.get('/api/admin/courses', { params: { limit: 1 } }),
        axios.get('/api/admin/tutor-applications', { params: { status: 'PENDING', limit: 1 } }),
        axios.get('/api/admin/reports', { params: { status: 'NEW', limit: 1 } }),
        axios.get('/api/admin/audit-logs', { params: { limit: 10 } }),
      ]);

      const activeUsersRes = await axios.get('/api/admin/users', {
        params: { status: 'ACTIVE', limit: 1 },
      });

      setStats({
        totalUsers: usersRes.data.pagination?.total || 0,
        activeUsers: activeUsersRes.data.pagination?.total || 0,
        totalCourses: coursesRes.data.pagination?.total || 0,
        pendingApplications: applicationsRes.data.pagination?.total || 0,
        activeReports: reportsRes.data.pagination?.total || 0,
        recentActions: auditRes.data.pagination?.total || 0,
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    { title: t('admin.actions.createCourse'), path: '/tutor/courses/create', icon: '➕', description: t('admin.actions.createCourseDesc') },
    { title: t('admin.actions.userManagement'), path: '/admin/users', icon: '👥', description: t('admin.actions.userManagementDesc') },
    { title: t('admin.actions.courseApproval'), path: '/admin/courses', icon: '📚', description: t('admin.actions.courseApprovalDesc') },
    { title: t('admin.actions.tutorVerification'), path: '/admin/tutor-applications', icon: '✅', description: t('admin.actions.tutorVerificationDesc') },
    { title: t('admin.actions.contentReports'), path: '/admin/reports', icon: '⚠️', description: t('admin.actions.contentReportsDesc') },
    { title: t('admin.actions.systemSettings'), path: '/admin/settings', icon: '⚙️', description: t('admin.actions.systemSettingsDesc') },
    { title: t('admin.actions.auditLogs'), path: '/admin/audit-logs', icon: '📝', description: t('admin.actions.auditLogsDesc') },
    { title: t('admin.actions.analytics'), path: '/admin/analytics', icon: '📈', description: t('admin.actions.analyticsDesc') },
  ];

  return (
    <div className="container">
      <h1>{t('admin.title')}</h1>
      <p>{t('admin.welcome', { name: user?.firstName })}</p>

      {/* Statistics Overview */}
      <div className="grid grid-cols-4 mt-lg" style={{ gap: '1rem' }}>
        <div className="card" style={{ textAlign: 'center' }}>
          <h3 style={{ fontSize: '2rem', margin: '0.5rem 0', color: '#3b82f6' }}>
            {loading ? '...' : stats.totalUsers}
          </h3>
          <p className="text-secondary" style={{ margin: 0 }}>{t('admin.totalUsers')}</p>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <h3 style={{ fontSize: '2rem', margin: '0.5rem 0', color: '#10b981' }}>
            {loading ? '...' : stats.activeUsers}
          </h3>
          <p className="text-secondary" style={{ margin: 0 }}>{t('admin.activeUsers')}</p>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <h3 style={{ fontSize: '2rem', margin: '0.5rem 0', color: '#8b5cf6' }}>
            {loading ? '...' : stats.totalCourses}
          </h3>
          <p className="text-secondary" style={{ margin: 0 }}>{t('admin.totalCourses')}</p>
        </div>
        <div className="card" style={{ textAlign: 'center' }}>
          <h3 style={{ fontSize: '2rem', margin: '0.5rem 0', color: '#f59e0b' }}>
            {loading ? '...' : stats.recentActions}
          </h3>
          <p className="text-secondary" style={{ margin: 0 }}>{t('admin.recentActions')}</p>
        </div>
      </div>

      {/* Alerts */}
      {(stats.pendingApplications > 0 || stats.activeReports > 0) && (
        <div className="card mt-lg" style={{ backgroundColor: '#fef3c7', borderLeft: '4px solid #f59e0b' }}>
          <h3 style={{ margin: '0 0 0.5rem 0' }}>{t('admin.attentionRequired')}</h3>
          <ul style={{ margin: 0, paddingLeft: '1.5rem' }}>
            {stats.pendingApplications > 0 && (
              <li>
                <strong>{stats.pendingApplications}</strong> {t('admin.pendingApplications')}
                {' '}<Link to="/admin/tutor-applications">{t('admin.reviewNow')}</Link>
              </li>
            )}
            {stats.activeReports > 0 && (
              <li>
                <strong>{stats.activeReports}</strong> {t('admin.newReports')}
                {' '}<Link to="/admin/reports">{t('admin.viewReports')}</Link>
              </li>
            )}
          </ul>
        </div>
      )}

      {/* Quick Actions */}
      <div className="mt-lg">
        <h2>{t('admin.quickActions')}</h2>
        <div className="grid grid-cols-4" style={{ gap: '1rem', marginTop: '1rem' }}>
          {quickActions.map((action) => (
            <Link
              key={action.path}
              to={action.path}
              className="card"
              style={{
                textDecoration: 'none',
                color: 'inherit',
                transition: 'transform 0.2s, box-shadow 0.2s',
                cursor: 'pointer',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'translateY(-4px)';
                e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'translateY(0)';
                e.currentTarget.style.boxShadow = 'none';
              }}
            >
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>{action.icon}</div>
              <h3 style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem' }}>{action.title}</h3>
              <p className="text-secondary" style={{ margin: 0, fontSize: '0.875rem' }}>
                {action.description}
              </p>
            </Link>
          ))}
        </div>
      </div>

      {/* System Health */}
      <div className="card mt-lg">
        <h3>{t('admin.systemHealth')}</h3>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem' }}>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span>{t('admin.database')}</span>
              <span style={{ color: '#10b981', fontWeight: '500' }}>{t('admin.healthy')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span>{t('admin.apiServer')}</span>
              <span style={{ color: '#10b981', fontWeight: '500' }}>{t('admin.running')}</span>
            </div>
          </div>
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span>{t('admin.emailService')}</span>
              <span style={{ color: '#10b981', fontWeight: '500' }}>{t('admin.operational')}</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <span>{t('admin.fileStorage')}</span>
              <span style={{ color: '#10b981', fontWeight: '500' }}>{t('admin.available')}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
