import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import './TodaySchedulePanel.css';

const MySchedulePanel = () => {
  const { t } = useTranslation('tutor');
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('TODAY'); // 'TODAY' | 'UPCOMING'
  const [expandedSession, setExpandedSession] = useState(null);

  useEffect(() => {
    fetchSessions(activeTab);
  }, [activeTab]);

  const fetchSessions = async (tab) => {
    setLoading(true);
    try {
      const token = localStorage.getItem('token') || sessionStorage.getItem('token');
      if (!token) return;

      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

      let query = '';
      const now = new Date();

      if (tab === 'TODAY') {
        const startOfDay = new Date(now);
        startOfDay.setHours(0, 0, 0, 0);
        const endOfDay = new Date(now);
        endOfDay.setHours(23, 59, 59, 999);
        query = `?startDate=${startOfDay.toISOString()}&endDate=${endOfDay.toISOString()}`;
      } else {
        // UPCOMING: Wide range for debugging/visibility
        // Start from way back to catch everything
        const startOfRange = new Date('2025-01-01');
        startOfRange.setHours(0, 0, 0, 0);

        // Fetch long into future
        const futureDate = new Date(now);
        futureDate.setDate(futureDate.getDate() + 90); // 3 months

        query = `?startDate=${startOfRange.toISOString()}&endDate=${futureDate.toISOString()}`;
      }

      // We use the same 'today' endpoint which now supports ranges, effectively becoming a 'getSessionsByRange' endpoint
      const response = await fetch(`${API_URL}/tutor/dashboard/sessions/today${query}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setSessions(data.data);
      } else if (Array.isArray(data)) {
        setSessions(data);
      } else {
        setSessions([]);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
      setSessions([]);
    } finally {
      setLoading(false);
    }
  };

  // ... (helper functions status icons)

  const renderParticipants = (session) => {
    if (!session.bookings || session.bookings.length === 0) {
      return <span className="text-muted text-sm">No students yet</span>;
    }
    return (
      <div className="mini-participant-list">
        {session.bookings.map(booking => (
          <div key={booking.id} className="mini-participant-item">
            <span className="name">{booking.student.firstName} {booking.student.lastName}</span>
            <span className={`status-pill ${booking.status.toLowerCase()}`}>
              {booking.status === 'CONFIRMED' ? 'Accepted' : booking.status}
            </span>
          </div>
        ))}
      </div>
    );
  };

  // ... inside render:
  // In the session-info div:

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
        fetchSessions(activeTab);
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

  const formatDate = (dateString, tab) => {
    const date = new Date(dateString);
    if (tab === 'TODAY') {
      // For Today, we might just want the time? Or "Today, 10:00 AM"
      // Design shows "10:35 AM - 11:35 AM"
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } else {
      // For Upcoming: "09 Feb 2026"
      return date.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
    }
  };

  const getBorderColorClass = (session) => {
    // Map session types/status to border colors
    if (session.sessionType === 'EXAM') return 'border-red'; // Example
    if (session.status === 'CONFIRMED') return 'border-yellow';
    return 'border-primary';
  };

  return (
    <div className="my-schedule-panel">
      <div className="panel-header">
        <h3>My Schedule</h3>
        <div className="schedule-tabs">
          <button
            className={`schedule-tab-btn ${activeTab === 'TODAY' ? 'active' : ''}`}
            onClick={() => setActiveTab('TODAY')}
          >
            TODAY
          </button>
          <button
            className={`schedule-tab-btn ${activeTab === 'UPCOMING' ? 'active' : ''}`}
            onClick={() => setActiveTab('UPCOMING')}
          >
            UPCOMING
          </button>
        </div>
      </div>

      {/* Sub-filters (optional, static for now as per design) */}
      <div className="sub-filters">
        <span className="filter-chip active">All</span>
        <span className="filter-chip">One-on-One</span>
        <span className="filter-chip">Group</span>
      </div>

      <div className="schedule-list-container">
        {loading ? (
          <div className="schedule-loading-state">Loading...</div>
        ) : sessions.length === 0 ? (
          <div className="schedule-empty-state">
            <p>No sessions scheduled for {activeTab.toLowerCase()}</p>
          </div>
        ) : (
          <div className="schedule-list">
            {sessions.map((session) => (
              <div
                key={session.id}
                className={`schedule-item ${getBorderColorClass(session)}`}
                onClick={() => toggleSessionDetails(session.id)}
              >
                <div className="item-main">
                  <div className="item-header">
                    <span className="item-type">{session.sessionType?.replace('_', ' ') || 'Session'}</span>
                    <span className={`date-display ${activeTab === 'UPCOMING' ? 'highlight' : ''}`}>
                      {activeTab === 'TODAY'
                        ? `${formatTime(session.scheduledStart)} - ${formatTime(session.scheduledEnd)}`
                        : formatDate(session.scheduledStart, 'UPCOMING')
                      }
                    </span>
                  </div>
                  <h4 className="item-title">{session.subject}</h4>

                  <div className="item-details">
                    <div className="detail-row">
                      <i className="fas fa-map-marker-alt"></i>
                      <span>{session.videoRoomId ? 'Online Meeting' : 'Physical Location'}</span>
                    </div>
                    {activeTab === 'UPCOMING' && (
                      <div className="detail-row">
                        <i className="fas fa-clock"></i>
                        <span>{formatTime(session.scheduledStart)} - {formatTime(session.scheduledEnd)}</span>
                      </div>
                    )}
                    {/* Mini Participants (Requested Feature) */}
                    <div className="detail-row participants-row">
                      <i className="fas fa-users"></i>
                      {renderParticipants(session)}
                    </div>
                  </div>
                </div>

                {/* Reuse existing expanded details logic if needed, or keep it simple */}
                {expandedSession === session.id && (
                  <div className="item-expanded-actions">
                    <button
                      className="btn btn-sm btn-primary"
                      onClick={(e) => { e.stopPropagation(); window.open(session.videoRoomId, '_blank'); }}
                    >
                      Join
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MySchedulePanel;
