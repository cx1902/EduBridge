import React, { useState, useEffect } from 'react';
import SessionResponseModal from './SessionResponseModal';
import './SessionInvitations.css';

const SessionInvitations = () => {
  const [invitations, setInvitations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState(null);
  const [modalType, setModalType] = useState(null);

  useEffect(() => {
    fetchInvitations();
  }, []);

  const fetchInvitations = async () => {
    try {
      const response = await fetch('/api/sessions/invitations', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
      });
      const data = await response.json();
      if (data.success) {
        setInvitations(data.data);
      }
    } catch (error) {
      console.error('Error fetching invitations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (session, type) => {
    setSelectedSession(session);
    setModalType(type);
  };

  const handleCloseModal = () => {
    setSelectedSession(null);
    setModalType(null);
    fetchInvitations(); // Refresh invitations after action
  };

  const formatDateTime = (dateString) => {
    const date = new Date(dateString);
    return {
      date: date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      }),
      time: date.toLocaleTimeString('en-US', { 
        hour: '2-digit', 
        minute: '2-digit' 
      }),
    };
  };

  const calculateDuration = (start, end) => {
    const duration = (new Date(end) - new Date(start)) / 60000;
    if (duration < 60) return `${duration} min`;
    return `${Math.floor(duration / 60)}h ${duration % 60}m`;
  };

  if (loading) {
    return (
      <div className="session-invitations card">
        <h3>📬 Session Invitations</h3>
        <div className="loading-state">Loading invitations...</div>
      </div>
    );
  }

  if (invitations.length === 0) {
    return (
      <div className="session-invitations card">
        <h3>📬 Session Invitations</h3>
        <div className="empty-state">
          <p>✨ No pending session invitations</p>
          <small>You'll be notified when tutors schedule sessions for you</small>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="session-invitations card">
        <h3>📬 Session Invitations</h3>
        <p className="text-secondary">{invitations.length} pending invitation(s)</p>

        <div className="invitations-list">
          {invitations.map((invitation) => {
            const session = invitation.session;
            const tutor = session.tutor;
            const dateTime = formatDateTime(session.scheduledStart);
            const duration = calculateDuration(session.scheduledStart, session.scheduledEnd);

            return (
              <div key={invitation.id} className="invitation-card">
                {/* Tutor Info */}
                <div className="invitation-header">
                  <div className="tutor-avatar">
                    {tutor.profilePictureUrl ? (
                      <img src={tutor.profilePictureUrl} alt={tutor.firstName} />
                    ) : (
                      <div className="avatar-placeholder">
                        {tutor.firstName[0]}{tutor.lastName[0]}
                      </div>
                    )}
                  </div>
                  <div className="tutor-info">
                    <h4>{tutor.firstName} {tutor.lastName}</h4>
                    <span className="invitation-badge">New Invitation</span>
                  </div>
                </div>

                {/* Session Details */}
                <div className="session-details">
                  <h5>{session.subject}</h5>
                  
                  <div className="detail-row">
                    <span className="detail-icon">📅</span>
                    <span className="detail-text">{dateTime.date} at {dateTime.time}</span>
                  </div>

                  <div className="detail-row">
                    <span className="detail-icon">⏱️</span>
                    <span className="detail-text">Duration: {duration}</span>
                  </div>

                  <div className="detail-row">
                    <span className="detail-icon">👥</span>
                    <span className="detail-text">
                      Type: {session.sessionType.replace('_', ' ').toLowerCase()}
                    </span>
                  </div>

                  <div className="detail-row">
                    <span className="detail-icon">📚</span>
                    <span className="detail-text">
                      Level: {session.educationLevel.toLowerCase()}
                    </span>
                  </div>
                </div>

                {/* Email Tracking Info */}
                <div className="tracking-info">
                  <small className="text-muted">
                    Sent: {new Date(invitation.sentAt).toLocaleDateString()}
                    {invitation.openedAt && ` • Opened: ${new Date(invitation.openedAt).toLocaleTimeString()}`}
                  </small>
                </div>

                {/* Action Buttons */}
                <div className="invitation-actions">
                  <button
                    className="btn btn-primary btn-block"
                    onClick={() => handleOpenModal(session, 'confirm')}
                  >
                    ✓ Confirm Attendance
                  </button>
                  <div className="secondary-actions">
                    <button
                      className="btn btn-link"
                      onClick={() => handleOpenModal(session, 'reschedule')}
                    >
                      🔄 Request Reschedule
                    </button>
                    <button
                      className="btn btn-link text-danger"
                      onClick={() => handleOpenModal(session, 'decline')}
                    >
                      ✕ Decline
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Response Modal */}
      {selectedSession && (
        <SessionResponseModal
          session={selectedSession}
          type={modalType}
          onClose={handleCloseModal}
        />
      )}
    </>
  );
};

export default SessionInvitations;
