import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './TodaySchedulePanel.css';

const TodaySchedulePanel = () => {
  const { t } = useTranslation('tutor');
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedSession, setExpandedSession] = useState(null);

  useEffect(() => {
    fetchTodaySessions();
  }, []);

  const fetchTodaySessions = async () => {
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) return;

      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      const response = await fetch(`${API_URL}/tutor/dashboard/sessions/today`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setSessions(data.data);
      } else if (Array.isArray(data)) {
        // Handle case where API returns array directly (legacy)
        setSessions(data);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    } finally {
      setLoading(false);
    }
  };

  const getEmailStatusIcon = (status) => {
    const icons = {
      CONFIRMED: { icon: '✅', color: '#10b981', label: 'Confirmed' },
      PENDING: { icon: '⏳', color: '#f59e0b', label: 'Pending' },
      DECLINED: { icon: '❌', color: '#ef4444', label: 'Declined' },
      NO_RESPONSE: { icon: '⚪', color: '#9ca3af', label: 'No Response' },
    };
    return icons[status] || icons.NO_RESPONSE;
  };

  const getEmailDeliveryIcon = (emailTracking) => {
    if (!emailTracking) return { icon: '⚪', label: 'Not sent', color: '#9ca3af' };
    if (emailTracking.failureReason) return { icon: '⚠️', label: 'Failed', color: '#ef4444' };
    if (emailTracking.clickedAt) return { icon: '✅', label: 'Clicked', color: '#10b981' };
    if (emailTracking.openedAt) return { icon: '👁️', label: 'Opened', color: '#3b82f6' };
    if (emailTracking.deliveredAt) return { icon: '📧', label: 'Delivered', color: '#6b7280' };
    return { icon: '📤', label: 'Sent', color: '#9ca3af' };
  };

  const handleResendInvitation = async (sessionId, studentId) => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}/resend`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ studentId }),
      });
      const data = await response.json();
      if (data.success) {
        alert('Invitation resent successfully');
        fetchTodaySessions();
      }
    } catch (error) {
      console.error('Error resending invitation:', error);
      alert('Failed to resend invitation');
    }
  };

  const handleSendReminder = async (sessionId) => {
    try {
      const response = await fetch(`/api/sessions/${sessionId}/remind`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify({ timeframe: '1 hour' }),
      });
      const data = await response.json();
      if (data.success) {
        alert('Reminders sent successfully');
      }
    } catch (error) {
      console.error('Error sending reminder:', error);
      alert('Failed to send reminder');
    }
  };

  const formatTime = (dateString) => {
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDuration = (start, end) => {
    const duration = (new Date(end) - new Date(start)) / 60000;
    return `${duration} min`;
  };

  const toggleSessionDetails = (sessionId) => {
    setExpandedSession(expandedSession === sessionId ? null : sessionId);
  };

  if (loading) {
    return (
      <div className="today-schedule-panel card">
        <h3>📅 {t('todaySchedule.title')}</h3>
        <div className="loading-state">Loading sessions...</div>
      </div>
    );
  }

  if (sessions.length === 0) {
    return (
      <div className="today-schedule-panel card">
        <h3>📅 {t('todaySchedule.title')}</h3>
        <div className="empty-state">
          <p>{t('todaySchedule.noSessions')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="today-schedule-panel card">
      <h3>📅 {t('todaySchedule.title')}</h3>
      <p className="text-secondary">{sessions.length} session(s) scheduled</p>

      <div className="sessions-list">
        {sessions.map((session) => {
          const isExpanded = expandedSession === session.id;
          const confirmedCount = session.emailTracking?.filter(
            t => t.responseStatus === 'CONFIRMED'
          ).length || 0;
          const totalInvited = session.emailTracking?.length || 0;

          return (
            <div key={session.id} className={`session-card ${session.status.toLowerCase()}`}>
              {/* Session Header */}
              <div className="session-header" onClick={() => toggleSessionDetails(session.id)}>
                <div className="session-time">
                  <span className="time-badge">
                    {formatTime(session.scheduledStart)}
                  </span>
                  <span className="duration">{formatDuration(session.scheduledStart, session.scheduledEnd)}</span>
                </div>
                
                <div className="session-info">
                  <h4>{session.subject}</h4>
                  <div className="session-meta">
                    <span className="session-type">{session.sessionType.replace('_', ' ')}</span>
                    <span className="participant-count">
                      {confirmedCount}/{totalInvited} confirmed
                    </span>
                  </div>
                </div>

                <div className="session-status">
                  <span className={`status-badge ${session.status.toLowerCase()}`}>
                    {session.status}
                  </span>
                  <button className="expand-btn">
                    {isExpanded ? '▼' : '▶'}
                  </button>
                </div>
              </div>

              {/* Expanded Details */}
              {isExpanded && (
                <div className="session-details">
                  <div className="session-actions">
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={() => window.open(session.videoRoomId, '_blank')}
                      disabled={session.status !== 'SCHEDULED'}
                    >
                      🎥 Join Session
                    </button>
                    <button
                      className="btn btn-sm btn-secondary"
                      onClick={() => handleSendReminder(session.id)}
                    >
                      🔔 Send Reminder
                    </button>
                  </div>

                  {/* Participant List */}
                  <div className="participants-section">
                    <h5>Participants ({totalInvited})</h5>
                    <div className="participants-list">
                      {session.emailTracking?.map((tracking) => {
                        const responseIcon = getEmailStatusIcon(tracking.responseStatus);
                        const deliveryIcon = getEmailDeliveryIcon(tracking);

                        return (
                          <div key={tracking.id} className="participant-item">
                            <div className="participant-info">
                              <div className="participant-name">
                                {tracking.student.firstName} {tracking.student.lastName}
                              </div>
                              <div className="participant-email">
                                {tracking.student.email}
                              </div>
                            </div>

                            <div className="tracking-indicators">
                              <span
                                className="status-indicator"
                                style={{ color: deliveryIcon.color }}
                                title={deliveryIcon.label}
                              >
                                {deliveryIcon.icon}
                              </span>
                              <span
                                className="status-indicator"
                                style={{ color: responseIcon.color }}
                                title={responseIcon.label}
                              >
                                {responseIcon.icon}
                              </span>
                            </div>

                            <div className="participant-actions">
                              {tracking.responseStatus === 'PENDING' && (
                                <button
                                  className="btn-icon"
                                  onClick={() => handleResendInvitation(session.id, tracking.studentId)}
                                  title="Resend invitation"
                                >
                                  📧
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Email Statistics */}
                  <div className="email-stats">
                    <div className="stat-item">
                      <span className="stat-label">Sent:</span>
                      <span className="stat-value">{totalInvited}</span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Opened:</span>
                      <span className="stat-value">
                        {session.emailTracking?.filter(t => t.openedAt).length || 0}
                      </span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Clicked:</span>
                      <span className="stat-value">
                        {session.emailTracking?.filter(t => t.clickedAt).length || 0}
                      </span>
                    </div>
                    <div className="stat-item">
                      <span className="stat-label">Confirmed:</span>
                      <span className="stat-value">{confirmedCount}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default TodaySchedulePanel;
