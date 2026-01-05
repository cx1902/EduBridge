import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getMySessions, cancelBooking } from '../../api/sessions';
import { Link } from 'react-router-dom';
import { format } from 'date-fns';
import './SessionHistory.css'; // I'll create this CSS next

const SessionHistory = () => {
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState('ALL'); // ALL, UPCOMING, COMPLETED, CANCELLED

  const { data: bookings, isLoading, error } = useQuery({
    queryKey: ['mySessions'],
    queryFn: () => getMySessions(),
  });

  const cancelMutation = useMutation({
    mutationFn: cancelBooking,
    onSuccess: () => {
      queryClient.invalidateQueries(['mySessions']);
      alert('Session cancelled successfully');
    },
    onError: (err) => {
      alert(err.response?.data?.error?.message || 'Failed to cancel session');
    }
  });

  const handleCancel = (bookingId) => {
    if (window.confirm('Are you sure you want to cancel this session?')) {
      cancelMutation.mutate(bookingId);
    }
  };

  if (isLoading) return <div className="loading-spinner">Loading...</div>;
  if (error) return <div className="error-message">Error loading sessions: {error.message}</div>;

  const filteredBookings = bookings?.filter(booking => {
    if (filter === 'ALL') return true;
    if (filter === 'UPCOMING') {
      return booking.status === 'CONFIRMED' && new Date(booking.session.scheduledStart) > new Date();
    }
    if (filter === 'COMPLETED') return booking.status === 'COMPLETED';
    if (filter === 'CANCELLED') return booking.status === 'CANCELLED';
    return true;
  }) || [];

  return (
    <div className="session-history-container">
      <div className="header-section">
        <h1>My Sessions</h1>
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

      <div className="sessions-list">
        {filteredBookings.length > 0 ? (
          filteredBookings.map(booking => {
            const session = booking.session;
            const isUpcoming = new Date(session.scheduledStart) > new Date() && booking.status === 'CONFIRMED';
            
            return (
              <div key={booking.id} className={`session-card ${booking.status.toLowerCase()}`}>
                <div className="session-card-header">
                  <div className="tutor-info">
                    <img 
                      src={session.tutor.profilePictureUrl || '/default-avatar.png'} 
                      alt="Tutor" 
                      className="tutor-avatar"
                    />
                    <div>
                      <h3>{session.subject}</h3>
                      <p>with {session.tutor.firstName} {session.tutor.lastName}</p>
                    </div>
                  </div>
                  <div className={`status-badge ${booking.status.toLowerCase()}`}>
                    {booking.status}
                  </div>
                </div>

                <div className="session-details">
                  <div className="detail-item">
                    <i className="fas fa-calendar"></i>
                    <span>{format(new Date(session.scheduledStart), 'PPP')}</span>
                  </div>
                  <div className="detail-item">
                    <i className="fas fa-clock"></i>
                    <span>
                      {format(new Date(session.scheduledStart), 'p')} - {format(new Date(session.scheduledEnd), 'p')}
                    </span>
                  </div>
                  {session.sessionType && (
                    <div className="detail-item">
                      <i className="fas fa-video"></i>
                      <span>{session.sessionType.replace('_', ' ')}</span>
                    </div>
                  )}
                </div>

                <div className="session-actions">
                  <Link to={`/sessions/${session.id}`} className="btn-view">
                    View Details
                  </Link>
                  {isUpcoming && (
                    <button 
                      className="btn-cancel"
                      onClick={() => handleCancel(booking.id)}
                      disabled={cancelMutation.isPending}
                    >
                      {cancelMutation.isPending ? 'Cancelling...' : 'Cancel'}
                    </button>
                  )}
                </div>
              </div>
            );
          })
        ) : (
          <div className="empty-state">
            <i className="fas fa-calendar-times"></i>
            <p>No sessions found in this category.</p>
            <Link to="/tutors" className="btn-primary">Find a Tutor</Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default SessionHistory;
