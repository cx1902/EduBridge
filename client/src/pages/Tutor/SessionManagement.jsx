import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios'; // Import direct api instance
import { getTutorSessions, updateSessionStatus, declineBookingRequest, deleteSession } from '../../api/sessions';
import { format } from 'date-fns';
import './SessionManagement.css';

const SessionManagement = () => {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('ALL'); // ALL, UPCOMING, COMPLETED, CANCELLED
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [inviteData, setInviteData] = useState({
    subject: '',
    scheduledStart: '',
    scheduledEnd: '',
    notes: '',
    link: ''
  });

  const { data: sessionsResponse, isLoading, error } = useQuery({
    queryKey: ['tutorSessions'],
    queryFn: () => getTutorSessions(),
  });

  const sessions = sessionsResponse?.data || [];

  const statusMutation = useMutation({
    mutationFn: ({ sessionId, status }) => updateSessionStatus(sessionId, status),
    onSuccess: () => {
      queryClient.invalidateQueries(['tutorSessions']);
    },
    onError: (err) => {
      alert(err.response?.data?.message || 'Failed to update status');
    }
  });

  const declineMutation = useMutation({
    mutationFn: ({ sessionId, reason }) => declineBookingRequest(sessionId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries(['tutorSessions']);
      alert('Booking declined successfully');
    },
    onError: (err) => {
      alert(err.response?.data?.message || 'Failed to decline booking');
    }
  });

  const deleteMutation = useMutation({
    mutationFn: (sessionId) => deleteSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries(['tutorSessions']);
      alert('Session deleted successfully');
    },
    onError: (err) => {
      alert(err.response?.data?.message || 'Failed to delete session');
    }
  });

  const updateMutation = useMutation({
    mutationFn: ({ sessionId, data }) => api.patch(`/sessions/${sessionId}`, data), // Assuming this endpoint will exist
    onSuccess: () => {
      queryClient.invalidateQueries(['tutorSessions']);
    },
    onError: (err) => {
      alert(err.response?.data?.message || 'Failed to update session');
    }
  });

  const handleUpdateSession = (sessionId, data) => {
    updateMutation.mutate({ sessionId, data });
  };

  const handleDeleteSession = (sessionId) => {
    if (window.confirm('Are you sure you want to delete this session? This action cannot be undone.')) {
      deleteMutation.mutate(sessionId);
    }
  };

  const handleStatusUpdate = (sessionId, status, reason) => {
    if (status === 'DECLINE') {
      declineMutation.mutate({ sessionId, reason });
      return;
    }

    if (status === 'CANCELLED' && !window.confirm('Are you sure you want to cancel this session?')) {
      return;
    }
    statusMutation.mutate({ sessionId, status });
  };

  const openInviteModal = (session) => {
    setSelectedSession(session);
    let notes = '';
    try {
      if (session.sessionNotes && session.sessionNotes.startsWith('{')) {
        const parsed = JSON.parse(session.sessionNotes);
        notes = parsed.notes || '';
      }
    } catch (e) {
      notes = session.sessionNotes || '';
    }

    setInviteData({
      subject: session.subject,
      scheduledStart: format(new Date(session.scheduledStart), "yyyy-MM-dd'T'HH:mm"),
      scheduledEnd: format(new Date(session.scheduledEnd), "yyyy-MM-dd'T'HH:mm"),
      notes,
      link: session.videoRoomId || ''
    });
    setIsInviteModalOpen(true);
  };

  const handleSendInvitation = async (e) => {
    e.preventDefault();
    if (!inviteData.link) {
      alert('Please provide a meeting link.');
      return;
    }

    try {
      // 1. Update session details
      await updateMutation.mutateAsync({
        sessionId: selectedSession.id,
        data: {
          subject: inviteData.subject,
          scheduledStart: inviteData.scheduledStart,
          scheduledEnd: inviteData.scheduledEnd,
          sessionNotes: JSON.stringify({
            notes: inviteData.notes
          }),
          videoRoomId: inviteData.link
        }
      });

      // 2. Confirm session (triggers backend invitations)
      await statusMutation.mutateAsync({
        sessionId: selectedSession.id,
        status: 'CONFIRMED'
      });

      setIsInviteModalOpen(false);
      alert('Invitation sent successfully!');
    } catch (err) {
      console.error('Invitation flow error:', err);
    }
  };

  const renderStudentInfo = (session) => {
    if (session.request?.student) {
      return (
        <div>
          <div>{session.request.student.firstName} {session.request.student.lastName}</div>
          <span className="badge badge-info">Request</span>
        </div>
      );
    }

    if (session.bookings && session.bookings.length > 0) {
      return (
        <div className="student-list">
          {session.bookings.map(booking => (
            <div key={booking.id} className="student-item">
              <span className="student-name">
                {booking.student.firstName} {booking.student.lastName}
              </span>
              <span className={`booking-status ${booking.status.toLowerCase()}`}>
                {booking.status === 'CONFIRMED' ? 'Accepted' : booking.status}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return <span className="text-muted">No students yet</span>;
  };

  if (isLoading) return <div className="loading-spinner">Loading...</div>;
  if (error) return <div className="error-message">Error loading sessions: {error.message}</div>;

  const filteredSessions = sessions?.filter(session => {
    if (filter === 'ALL') return true;
    if (filter === 'UPCOMING') {
      return (session.status === 'SCHEDULED' || session.status === 'CONFIRMED') && new Date(session.scheduledStart) > new Date();
    }
    if (filter === 'COMPLETED') return session.status === 'COMPLETED';
    if (filter === 'CANCELLED') return session.status === 'CANCELLED';
    return true;
  }) || [];

  return (
    <div className="session-management-container">
      <div className="header-section">
        <h1>Session Management</h1>
        <div className="filter-tabs">
          {['ALL', 'UPCOMING', 'COMPLETED', 'CANCELLED'].map(f => (
            <button
              key={f}
              className={`filter-tab ${filter === f ? 'active' : ''}`}
              onClick={() => setFilter(f)}
            >
              {f.charAt(0) + f.slice(1).toLowerCase()}
            </button>
          ))}
        </div>
      </div>

      <div className="sessions-table-container">
        <table className="sessions-table">
          <thead>
            <tr>
              <th>Date & Time</th>
              <th>Subject</th>
              <th>Student(s)</th>
              <th>Note</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredSessions.length > 0 ? (
              filteredSessions.map(session => (
                <tr key={session.id}>
                  <td>
                    <div className="datetime-cell">
                      <span className="date">{format(new Date(session.scheduledStart), 'MMM d, yyyy')}</span>
                      <span className="time">
                        {format(new Date(session.scheduledStart), 'p')} - {format(new Date(session.scheduledEnd), 'p')}
                      </span>
                    </div>
                  </td>
                  <td>
                    <div className="subject-cell">
                      <span className="subject-name">{session.subject}</span>
                      <span className="session-type">{session.sessionType?.replace('_', ' ')}</span>
                    </div>
                  </td>
                  <td>
                    <div className="student-cell">
                      {renderStudentInfo(session)}
                    </div>
                  </td>
                  <td>
                    <div className="note-cell" title={session.sessionNotes || 'No note provided'}>
                      {session.sessionNotes ? (
                        <span className="note-text">{session.sessionNotes}</span>
                      ) : (
                        <span className="note-empty">No note</span>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className={`status-badge ${session.status.toLowerCase()}`}>
                      {session.status}
                    </span>
                  </td>
                  <td>
                    <div className="actions-cell">
                      {session.status === 'SCHEDULED' && (
                        <div className="status-actions">
                          <button
                            className="btn-action invite"
                            onClick={() => openInviteModal(session)}
                            disabled={statusMutation.isPending || updateMutation.isPending}
                          >
                            Send Invitation
                          </button>
                          <button
                            className="btn-action decline"
                            onClick={() => {
                              const reason = window.prompt('Reason for declining (optional):', '');
                              if (reason !== null) {
                                handleStatusUpdate(session.id, 'DECLINE', reason);
                              }
                            }}
                            disabled={statusMutation.isPending}
                          >
                            Decline
                          </button>
                          {(!session.bookings || session.bookings.length === 0) && (
                            <button
                              className="btn-action delete"
                              onClick={() => handleDeleteSession(session.id)}
                              disabled={deleteMutation.isPending}
                              title="Delete Session"
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          )}
                        </div>
                      )}
                      {session.status === 'CONFIRMED' && (
                        <div className="status-actions">
                          <button
                            className="btn-action complete"
                            onClick={() => handleStatusUpdate(session.id, 'COMPLETED')}
                            disabled={statusMutation.isPending}
                          >
                            Complete
                          </button>
                          <button
                            className="btn-action cancel"
                            onClick={() => handleStatusUpdate(session.id, 'CANCELLED')}
                            disabled={statusMutation.isPending}
                          >
                            Cancel
                          </button>
                        </div>
                      )}
                      {session.status === 'COMPLETED' && (
                        <div className="status-actions">
                          <span className="text-success" style={{ marginRight: '8px' }}>Completed</span>
                          <button
                            className="btn-action delete"
                            onClick={() => handleDeleteSession(session.id)}
                            disabled={deleteMutation.isPending}
                            title="Delete Record"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      )}
                      {session.status === 'CANCELLED' && (
                        <div className="status-actions">
                          <span className="text-muted" style={{ marginRight: '8px' }}>Cancelled</span>
                          <button
                            className="btn-action delete"
                            onClick={() => handleDeleteSession(session.id)}
                            disabled={deleteMutation.isPending}
                            title="Delete Record"
                          >
                            <i className="fas fa-trash"></i>
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="empty-state-cell">
                  No sessions found in this category.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {isInviteModalOpen && (
        <div className="modal-overlay">
          <div className="invite-modal">
            <div className="modal-header">
              <h2>Send Session Invitation</h2>
              <button className="btn-close" onClick={() => setIsInviteModalOpen(false)}>&times;</button>
            </div>
            <form onSubmit={handleSendInvitation} className="invite-form">
              <div className="form-group">
                <label>Course / Subject</label>
                <input
                  type="text"
                  value={inviteData.subject}
                  onChange={(e) => setInviteData({ ...inviteData, subject: e.target.value })}
                  required
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Start Time</label>
                  <input
                    type="datetime-local"
                    value={inviteData.scheduledStart}
                    onChange={(e) => setInviteData({ ...inviteData, scheduledStart: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>End Time</label>
                  <input
                    type="datetime-local"
                    value={inviteData.scheduledEnd}
                    onChange={(e) => setInviteData({ ...inviteData, scheduledEnd: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label>Meeting Link URL</label>
                <input
                  type="url"
                  placeholder="e.g. https://meet.google.com/abc-defg-hij"
                  value={inviteData.link}
                  onChange={(e) => setInviteData({ ...inviteData, link: e.target.value })}
                  required
                />
                <small className="form-helper">This link will be visible to the student only after they accept the invitation.</small>
              </div>
              <div className="form-group">
                <label>Tutor Notes / Requirements</label>
                <textarea
                  placeholder="e.g. Please bring your textbook and prepare questions regarding Chapter 2..."
                  value={inviteData.notes}
                  onChange={(e) => setInviteData({ ...inviteData, notes: e.target.value })}
                  rows={3}
                  className="form-textarea"
                />
              </div>
              <div className="modal-actions">
                <button
                  type="button"
                  className="btn-secondary"
                  onClick={() => setIsInviteModalOpen(false)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-primary"
                  disabled={statusMutation.isPending || updateMutation.isPending}
                >
                  {statusMutation.isPending || updateMutation.isPending ? 'Sending...' : 'Send Invitation'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default SessionManagement;
