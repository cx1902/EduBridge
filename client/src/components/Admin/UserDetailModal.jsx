import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import './UserDetailModal.css';

const UserDetailModal = ({ userId, onClose }) => {
  const { t } = useTranslation(['admin', 'common']);
  const [activeTab, setActiveTab] = useState('overview');
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (userId) {
      fetchUserDetails();
    }
  }, [userId]);

  const fetchUserDetails = async (tab = null) => {
    try {
      setLoading(true);
      const response = await axios.get(`/api/admin/users/${userId}/details`, {
        params: tab ? { tab } : {}
      });
      
      if (response.data.success) {
        setUserData(response.data.user);
      }
    } catch (err) {
      console.error('Error fetching user details:', err);
      setError(err.response?.data?.message || 'Failed to load user details');
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    // Fetch specific tab data if not already loaded
    if (tab !== 'overview' && !userData?.[getTabDataKey(tab)]) {
      fetchUserDetails(tab);
    }
  };

  const getTabDataKey = (tab) => {
    const mapping = {
      activity: 'pointsTransactions',
      courses: 'enrollments',
      sessions: 'sessionBookings',
      warnings: 'warningsReceived',
      audit: 'auditHistory',
      badges: 'userBadges'
    };
    return mapping[tab];
  };

  const formatDate = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleDateString();
  };

  const formatDateTime = (date) => {
    if (!date) return '-';
    return new Date(date).toLocaleString();
  };

  if (!userId) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="user-detail-modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{t('admin:userManagement.modal.userDetails')}</h2>
          <button className="close-button" onClick={onClose}>×</button>
        </div>

        {loading && !userData ? (
          <div className="modal-body">
            <div className="loading-state">{t('common:message.loading')}</div>
          </div>
        ) : error ? (
          <div className="modal-body">
            <div className="error-state">{error}</div>
          </div>
        ) : userData ? (
          <>
            <div className="user-header">
              {userData.profilePictureUrl && (
                <img src={userData.profilePictureUrl} alt={`${userData.firstName} ${userData.lastName}`} className="user-avatar" />
              )}
              <div className="user-info">
                <h3>{userData.firstName} {userData.lastName}</h3>
                <p className="user-email">{userData.email}</p>
                <div className="user-badges-inline">
                  <span className={`badge badge-${userData.role.toLowerCase()}`}>
                    {t(`common:role.${userData.role.toLowerCase()}`)}
                  </span>
                  <span className={`badge badge-${userData.status.toLowerCase()}`}>
                    {t(`common:status.${userData.status.toLowerCase()}`)}
                  </span>
                  {userData.emailVerified && (
                    <span className="badge badge-success">✓ {t('admin:userManagement.filters.emailVerified')}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="tabs">
              {['overview', 'activity', 'courses', 'sessions', 'warnings', 'audit'].map(tab => (
                <button
                  key={tab}
                  className={`tab ${activeTab === tab ? 'active' : ''}`}
                  onClick={() => handleTabChange(tab)}
                >
                  {t(`admin:userManagement.modal.tabs.${tab}`)}
                </button>
              ))}
            </div>

            <div className="modal-body">
              {activeTab === 'overview' && (
                <div className="overview-tab">
                  <div className="info-grid">
                    <div className="info-section">
                      <h4>{t('common:label.basicInfo', 'Basic Information')}</h4>
                      <div className="info-row">
                        <span className="info-label">{t('common:label.email')}:</span>
                        <span>{userData.email}</span>
                      </div>
                      <div className="info-row">
                        <span className="info-label">{t('common:label.phoneNumber')}:</span>
                        <span>{userData.phoneNumber || '-'}</span>
                      </div>
                      <div className="info-row">
                        <span className="info-label">{t('common:label.dateOfBirth')}:</span>
                        <span>{formatDate(userData.dateOfBirth)}</span>
                      </div>
                      <div className="info-row">
                        <span className="info-label">{t('common:label.bio')}:</span>
                        <span>{userData.bio || '-'}</span>
                      </div>
                    </div>

                    <div className="info-section">
                      <h4>{t('common:label.accountStatus', 'Account Status')}</h4>
                      <div className="info-row">
                        <span className="info-label">{t('common:label.createdAt')}:</span>
                        <span>{formatDateTime(userData.createdAt)}</span>
                      </div>
                      <div className="info-row">
                        <span className="info-label">{t('common:label.lastLogin')}:</span>
                        <span>{formatDateTime(userData.lastLogin)}</span>
                      </div>
                      <div className="info-row">
                        <span className="info-label">{t('common:label.emailVerified', 'Email Verified')}:</span>
                        <span>{userData.emailVerified ? '✓ Yes' : '✗ No'}</span>
                      </div>
                    </div>

                    <div className="info-section">
                      <h4>{t('common:label.preferences', 'Preferences')}</h4>
                      <div className="info-row">
                        <span className="info-label">{t('common:label.language')}:</span>
                        <span>{t(`common:language.${userData.preferredLanguage}`)}</span>
                      </div>
                      <div className="info-row">
                        <span className="info-label">{t('common:label.theme')}:</span>
                        <span>{t(`common:theme.${userData.themePreference?.toLowerCase()}`)}</span>
                      </div>
                      <div className="info-row">
                        <span className="info-label">{t('common:label.fontSize')}:</span>
                        <span>{t(`common:fontSize.${userData.fontSize?.toLowerCase()}`)}</span>
                      </div>
                      <div className="info-row">
                        <span className="info-label">{t('common:label.timezone')}:</span>
                        <span>{userData.timezone}</span>
                      </div>
                    </div>

                    <div className="info-section">
                      <h4>{t('common:label.gamification', 'Gamification')}</h4>
                      <div className="info-row">
                        <span className="info-label">{t('common:label.points')}:</span>
                        <span className="highlight">{userData.totalPoints}</span>
                      </div>
                      <div className="info-row">
                        <span className="info-label">{t('common:label.currentStreak', 'Current Streak')}:</span>
                        <span>{userData.currentStreak} {t('common:time.days')}</span>
                      </div>
                      <div className="info-row">
                        <span className="info-label">{t('common:label.longestStreak', 'Longest Streak')}:</span>
                        <span>{userData.longestStreak} {t('common:time.days')}</span>
                      </div>
                      <div className="info-row">
                        <span className="info-label">{t('common:label.streakFreezes', 'Streak Freezes')}:</span>
                        <span>{userData.streakFreezesAvailable} available</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {activeTab === 'activity' && (
                <div className="activity-tab">
                  <h4>{t('common:label.pointsHistory', 'Points History')}</h4>
                  {userData.pointsTransactions?.length > 0 ? (
                    <table className="data-table">
                      <thead>
                        <tr>
                          <th>{t('common:label.date', 'Date')}</th>
                          <th>{t('common:label.activity', 'Activity')}</th>
                          <th>{t('common:label.points')}</th>
                          <th>{t('common:label.description', 'Description')}</th>
                        </tr>
                      </thead>
                      <tbody>
                        {userData.pointsTransactions.map(transaction => (
                          <tr key={transaction.id}>
                            <td>{formatDateTime(transaction.timestamp)}</td>
                            <td>{transaction.activityType}</td>
                            <td className={transaction.pointsAmount > 0 ? 'positive' : 'negative'}>
                              {transaction.pointsAmount > 0 ? '+' : ''}{transaction.pointsAmount}
                            </td>
                            <td>{transaction.description}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  ) : (
                    <p className="no-data">{t('common:message.noData')}</p>
                  )}
                </div>
              )}

              {activeTab === 'courses' && (
                <div className="courses-tab">
                  {userData.role === 'STUDENT' || userData.role === 'ADMIN' ? (
                    <>
                      <h4>{t('common:label.enrolledCourses', 'Enrolled Courses')}</h4>
                      {userData.enrollments?.length > 0 ? (
                        <div className="course-list">
                          {userData.enrollments.map(enrollment => (
                            <div key={enrollment.id} className="course-card">
                              <h5>{enrollment.course.title}</h5>
                              <p>Progress: {enrollment.progressPercentage}%</p>
                              <p>Enrolled: {formatDate(enrollment.enrolledAt)}</p>
                              {enrollment.completedAt && <p>Completed: {formatDate(enrollment.completedAt)}</p>}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="no-data">{t('common:message.noData')}</p>
                      )}
                    </>
                  ) : null}
                  
                  {(userData.role === 'TUTOR' || userData.role === 'ADMIN') && (
                    <>
                      <h4>{t('common:label.createdCourses', 'Created Courses')}</h4>
                      {userData.createdCourses?.length > 0 ? (
                        <div className="course-list">
                          {userData.createdCourses.map(course => (
                            <div key={course.id} className="course-card">
                              <h5>{course.title}</h5>
                              <p>Status: {t(`common:status.${course.status.toLowerCase()}`)}</p>
                              <p>Enrollments: {course.enrollmentCount}</p>
                              {course.averageRating && <p>Rating: {course.averageRating}/5</p>}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="no-data">{t('common:message.noData')}</p>
                      )}
                    </>
                  )}
                </div>
              )}

              {activeTab === 'warnings' && (
                <div className="warnings-tab">
                  <h4>{t('admin:userManagement.table.warnings')}</h4>
                  {userData.warningsReceived?.length > 0 ? (
                    <div className="warnings-list">
                      {userData.warningsReceived.map(warning => (
                        <div key={warning.id} className={`warning-card severity-${warning.severity.toLowerCase()}`}>
                          <div className="warning-header">
                            <span className="warning-severity">{warning.severity}</span>
                            <span className="warning-date">{formatDateTime(warning.createdAt)}</span>
                          </div>
                          <p className="warning-reason">{warning.reason}</p>
                          <p className="warning-issuer">
                            Issued by: {warning.issuer.firstName} {warning.issuer.lastName}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="no-data">{t('common:message.noData')}</p>
                  )}
                </div>
              )}
            </div>
          </>
        ) : null}
      </div>
    </div>
  );
};

export default UserDetailModal;
