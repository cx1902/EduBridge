import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import api from '../../api/axios';
import { useThemeStore } from '../../store/themeStore';

const UserDetailModal = ({ userId, onClose }) => {
  const { t } = useTranslation(['admin', 'common']);
  const { theme } = useThemeStore();
  const isDark = theme === 'dark';

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
      // Use configured api client
      const response = await api.get(`/admin/users/${userId}/details`, {
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

  // Inline Styles for Modern Design with Dark Mode Support
  const styles = {
    overlay: {
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      backdropFilter: 'blur(5px)'
    },
    modal: {
      backgroundColor: isDark ? '#1e293b' : '#fff',
      color: isDark ? '#f8fafc' : '#111827',
      borderRadius: '12px',
      width: '900px',
      maxWidth: '95%',
      maxHeight: '90vh',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)',
      overflow: 'hidden',
      border: isDark ? '1px solid #334155' : 'none'
    },
    header: {
      padding: '1.5rem',
      borderBottom: isDark ? '1px solid #334155' : '1px solid #e5e7eb',
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      backgroundColor: isDark ? '#0f172a' : '#f9fafb'
    },
    closeBtn: {
      background: 'none',
      border: 'none',
      fontSize: '1.5rem',
      cursor: 'pointer',
      color: isDark ? '#94a3b8' : '#6b7280',
      padding: '0.5rem'
    },
    content: {
      flex: 1,
      overflowY: 'auto',
      padding: '0'
    },
    profileHeader: {
      background: 'linear-gradient(to right, #4f46e5, #818cf8)',
      padding: '2rem',
      color: 'white',
      display: 'flex',
      alignItems: 'center',
      gap: '2rem'
    },
    avatar: {
      width: '100px',
      height: '100px',
      borderRadius: '50%',
      border: '4px solid white',
      objectFit: 'cover',
      backgroundColor: '#e0e7ff'
    },
    badges: {
      display: 'flex',
      gap: '0.5rem',
      marginTop: '0.5rem'
    },
    badge: {
      padding: '0.25rem 0.75rem',
      borderRadius: '9999px',
      fontSize: '0.75rem',
      fontWeight: '600',
      textTransform: 'uppercase',
      backgroundColor: 'rgba(255,255,255,0.2)',
      backdropFilter: 'blur(4px)'
    },
    tabBar: {
      display: 'flex',
      borderBottom: isDark ? '1px solid #334155' : '1px solid #e5e7eb',
      padding: '0 1rem',
      backgroundColor: isDark ? '#1e293b' : 'white',
      position: 'sticky',
      top: 0
    },
    tab: (active) => ({
      padding: '1rem',
      border: 'none',
      background: 'none',
      borderBottom: active ? '2px solid #4f46e5' : '2px solid transparent',
      color: active ? (isDark ? '#818cf8' : '#4f46e5') : (isDark ? '#94a3b8' : '#6b7280'),
      fontWeight: active ? '600' : '500',
      cursor: 'pointer',
      transition: 'all 0.2s'
    }),
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
      gap: '1.5rem',
      padding: '1.5rem'
    },
    section: {
      backgroundColor: isDark ? '#0f172a' : '#fff',
      padding: '1.5rem',
      borderRadius: '8px',
      border: isDark ? '1px solid #334155' : '1px solid #e5e7eb'
    },
    sectionTitle: {
      fontSize: '1.1rem',
      fontWeight: '600',
      marginBottom: '1rem',
      color: isDark ? '#f8fafc' : '#111827',
      display: 'flex',
      alignItems: 'center',
      gap: '0.5rem'
    },
    row: {
      display: 'flex',
      justifyContent: 'space-between',
      padding: '0.5rem 0',
      borderBottom: isDark ? '1px solid #334155' : '1px solid #f3f4f6'
    },
    label: {
      color: isDark ? '#94a3b8' : '#6b7280',
      fontWeight: '500'
    },
    value: {
      color: isDark ? '#e2e8f0' : '#111827',
      fontWeight: '500'
    }
  };

  return (
    <div style={styles.overlay} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <h2 style={{ margin: 0, fontSize: '1.25rem', color: '#111827' }}>{t('admin:userManagement.modal.userDetails')}</h2>
          <button style={styles.closeBtn} onClick={onClose}>×</button>
        </div>

        <div style={styles.content}>
          {loading && !userData ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: '#6b7280' }}>
              <div className="spinner"></div> {t('common:message.loading')}
            </div>
          ) : error ? (
            <div style={{ padding: '2rem', color: '#ef4444', textAlign: 'center' }}>{error}</div>
          ) : userData ? (
            <>
              {/* Profile Header */}
              <div style={styles.profileHeader}>
                {userData.profilePictureUrl ? (
                  <img src={userData.profilePictureUrl} alt="Avatar" style={styles.avatar} />
                ) : (
                  <div style={{ ...styles.avatar, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem', color: '#4f46e5' }}>
                    {userData.firstName?.[0]}
                  </div>
                )}
                <div>
                  <h2 style={{ margin: 0, fontSize: '1.75rem' }}>{userData.firstName} {userData.lastName}</h2>
                  <p style={{ margin: '0.25rem 0 0.5rem', opacity: 0.9 }}>{userData.email}</p>
                  <div style={styles.badges}>
                    <span style={styles.badge}>{userData.role}</span>
                    <span style={styles.badge}>{userData.status}</span>
                    {userData.emailVerified && <span style={styles.badge}>VERIFIED</span>}
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div style={styles.tabBar}>
                {['overview', 'activity', 'courses', 'warnings'].map(tab => (
                  <button
                    key={tab}
                    style={styles.tab(activeTab === tab)}
                    onClick={() => handleTabChange(tab)}
                  >
                    {t(`admin:userManagement.modal.tabs.${tab}`)}
                  </button>
                ))}
              </div>

              {/* Overview Tab Content */}
              {activeTab === 'overview' && (
                <div style={styles.grid}>
                  <div style={styles.section}>
                    <div style={styles.sectionTitle}>👤 {t('common:label.basicInfo')}</div>
                    <div style={styles.row}><span style={styles.label}>Email</span><span style={styles.value}>{userData.email}</span></div>
                    <div style={styles.row}><span style={styles.label}>Phone</span><span style={styles.value}>{userData.phoneNumber || '-'}</span></div>
                    <div style={styles.row}><span style={styles.label}>Since</span><span style={styles.value}>{formatDate(userData.createdAt)}</span></div>
                  </div>

                  <div style={styles.section}>
                    <div style={styles.sectionTitle}>🏆 {t('common:label.gamification')}</div>
                    <div style={styles.row}><span style={styles.label}>Points</span><span style={styles.value}>{userData.totalPoints}</span></div>
                    <div style={styles.row}><span style={styles.label}>Streak</span><span style={styles.value}>{userData.currentStreak} Days</span></div>
                    <div style={styles.row}><span style={styles.label}>Longest</span><span style={styles.value}>{userData.longestStreak} Days</span></div>
                  </div>

                  <div style={styles.section}>
                    <div style={styles.sectionTitle}>⚙️ {t('common:label.preferences')}</div>
                    <div style={styles.row}><span style={styles.label}>Language</span><span style={styles.value}>{userData.preferredLanguage}</span></div>
                    <div style={styles.row}><span style={styles.label}>Timezone</span><span style={styles.value}>{userData.timezone}</span></div>
                  </div>
                </div>
              )}

              {/* Other Tabs (Placeholder for strict implementation) */}
              {activeTab !== 'overview' && (
                <div style={{ padding: '2rem' }}>
                  <p style={{ color: '#6b7280' }}>Feature specific details for {activeTab} will appear here.</p>
                  {/* Reuse existing logic for tables if needed */}
                </div>
              )}

            </>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default UserDetailModal;
