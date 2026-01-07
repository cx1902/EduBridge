import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getTutorSessions, updateSessionStatus } from '../../api/sessions';
import { format } from 'date-fns';
import './SessionManagement.css';

const SessionManagement = () => {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('ALL'); // ALL, UPCOMING, COMPLETED, CANCELLED

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

  const handleStatusUpdate = (sessionId, status) => {
    if (status === 'CANCELLED' && !window.confirm('Are you sure you want to cancel this session?')) {
      return;
    }
    statusMutation.mutate({ sessionId, status });
  };

  const getStudentName = (session) => {
    if (session.request?.student) {
      return `${session.request.student.firstName} ${session.request.student.lastName}`;
    }
    if (session.bookings && session.bookings.length > 0) {
      if (session.bookings.length === 1) {
        const s = session.bookings[0].student;
        return `${s.firstName} ${s.lastName}`;
      }
      return `${session.bookings.length} Students`;
    }
    return 'No students yet';
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
                      <span>{getStudentName(session)}</span>
                    </div>
                  </td>
                  <td>
                    <span className={`status-badge ${session.status.toLowerCase()}`}>
                      {session.status}
                    </span>
                  </td>
                  <td>
                    <div className="actions-cell">
                      {(session.status === 'SCHEDULED' || session.status === 'CONFIRMED') && (
                        <>
                          {session.status === 'SCHEDULED' && (
                            <button
                              className="btn-action confirm"
                              onClick={() => handleStatusUpdate(session.id, 'CONFIRMED')}
                              disabled={statusMutation.isPending}
                            >
                              Confirm
                            </button>
                          )}
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
                        </>
                      )}
                      {session.status === 'COMPLETED' && (
                        <span className="text-muted">Completed</span>
                      )}
                      {session.status === 'CANCELLED' && (
                        <span className="text-muted">Cancelled</span>
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
    </div>
  );
};

export default SessionManagement;
