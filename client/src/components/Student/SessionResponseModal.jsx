import React, { useState } from 'react';
import './SessionResponseModal.css';

const SessionResponseModal = ({ session, type, onClose }) => {
  const [reason, setReason] = useState('');
  const [preferredTimes, setPreferredTimes] = useState(['']);
  const [loading, setLoading] = useState(false);

  const handleAddTimeSlot = () => {
    setPreferredTimes([...preferredTimes, '']);
  };

  const handleTimeChange = (index, value) => {
    const newTimes = [...preferredTimes];
    newTimes[index] = value;
    setPreferredTimes(newTimes);
  };

  const handleRemoveTimeSlot = (index) => {
    setPreferredTimes(preferredTimes.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let endpoint = '';
      let body = {};

      switch (type) {
        case 'confirm':
          endpoint = `/api/sessions/${session.id}/confirm`;
          break;
        case 'decline':
          endpoint = `/api/sessions/${session.id}/decline`;
          body = { reason };
          break;
        case 'reschedule':
          endpoint = `/api/sessions/${session.id}/reschedule`;
          body = {
            reason,
            preferredTimes: preferredTimes.filter(t => t),
          };
          break;
        default:
          throw new Error('Invalid action type');
      }

      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
        },
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (data.success) {
        alert(data.message || 'Action completed successfully');
        onClose();
      } else {
        alert('Error: ' + data.message);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('An error occurred. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const getModalTitle = () => {
    switch (type) {
      case 'confirm':
        return '✓ Confirm Attendance';
      case 'decline':
        return '✕ Decline Invitation';
      case 'reschedule':
        return '🔄 Request Reschedule';
      default:
        return 'Session Response';
    }
  };

  const getModalDescription = () => {
    switch (type) {
      case 'confirm':
        return 'By confirming, you commit to attending this session. Your tutor will be notified.';
      case 'decline':
        return 'Let your tutor know why you cannot attend this session.';
      case 'reschedule':
        return 'Provide your preferred alternative times and a reason for the reschedule request.';
      default:
        return '';
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>{getModalTitle()}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>

        <div className="modal-body">
          {/* Session Details Summary */}
          <div className="session-summary">
            <h4>{session.subject}</h4>
            <div className="summary-details">
              <p>
                <strong>Date:</strong> {new Date(session.scheduledStart).toLocaleDateString()}
              </p>
              <p>
                <strong>Time:</strong> {new Date(session.scheduledStart).toLocaleTimeString()}
              </p>
              <p>
                <strong>Type:</strong> {session.sessionType.replace('_', ' ').toLowerCase()}
              </p>
            </div>
          </div>

          <p className="modal-description">{getModalDescription()}</p>

          <form onSubmit={handleSubmit}>
            {/* Confirm Form */}
            {type === 'confirm' && (
              <div className="confirm-section">
                <div className="info-box success">
                  <p>📅 A calendar invite has been sent to your email</p>
                  <p>🔔 You'll receive a reminder before the session</p>
                </div>
              </div>
            )}

            {/* Decline Form */}
            {type === 'decline' && (
              <div className="form-group">
                <label htmlFor="decline-reason">
                  Reason for declining (optional)
                </label>
                <textarea
                  id="decline-reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="e.g., Schedule conflict, not feeling well..."
                  rows="3"
                />
              </div>
            )}

            {/* Reschedule Form */}
            {type === 'reschedule' && (
              <>
                <div className="form-group">
                  <label htmlFor="reschedule-reason">
                    Reason for reschedule request *
                  </label>
                  <textarea
                    id="reschedule-reason"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Explain why you need to reschedule..."
                    rows="2"
                    required
                  />
                </div>

                <div className="form-group">
                  <label>Preferred alternative times</label>
                  <small className="text-muted">
                    Suggest times when you're available
                  </small>
                  
                  {preferredTimes.map((time, index) => (
                    <div key={index} className="time-slot-input">
                      <input
                        type="datetime-local"
                        value={time}
                        onChange={(e) => handleTimeChange(index, e.target.value)}
                        min={new Date().toISOString().slice(0, 16)}
                      />
                      {preferredTimes.length > 1 && (
                        <button
                          type="button"
                          className="btn-icon"
                          onClick={() => handleRemoveTimeSlot(index)}
                        >
                          ✕
                        </button>
                      )}
                    </div>
                  ))}
                  
                  <button
                    type="button"
                    className="btn btn-link"
                    onClick={handleAddTimeSlot}
                  >
                    + Add another time slot
                  </button>
                </div>
              </>
            )}

            {/* Action Buttons */}
            <div className="modal-actions">
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className={`btn ${type === 'confirm' ? 'btn-success' : type === 'decline' ? 'btn-danger' : 'btn-primary'}`}
                disabled={loading}
              >
                {loading ? 'Processing...' : type === 'confirm' ? 'Confirm Attendance' : type === 'decline' ? 'Decline Session' : 'Send Request'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default SessionResponseModal;
