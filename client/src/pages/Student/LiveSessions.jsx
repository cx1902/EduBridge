import React, { useState } from 'react';
import { getMySessions, confirmSession, declineInvitation } from '../../api/sessions';
import { getMyBookingRequests } from '../../api/bookings';
import { format } from 'date-fns';
import { FiCalendar, FiClock, FiUser, FiVideo, FiInfo, FiExternalLink, FiLayout, FiFileText, FiCheck, FiX, FiPlus, FiSearch } from 'react-icons/fi';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import './LiveSessions.css';

const LiveSessions = () => {
  const { user } = useAuthStore();
  const isStudent = user?.role === 'STUDENT';
  const [activeTab, setActiveTab] = useState('upcoming');
  const [selectedSession, setSelectedSession] = useState(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const queryClient = useQueryClient();

  // Helper for safe date formatting
  const safeFormat = (date, formatStr) => {
    if (!date) return 'TBA';
    const d = new Date(date);
    if (isNaN(d.getTime())) return 'Invalid Date';
    return format(d, formatStr);
  };

  // Robust session details parser
  const getSessionDetails = (session) => {
    let platform = session.status === 'CONFIRMED' ? 'Google Meet' : 'To be determined';
    let tutorNotes = null;
    let studentInquiry = null;

    const platformWhitelist = [
      'google meet', 'zoom', 'microsoft teams', 'teams', 'discord', 'skype', 'in person',
      'whatsapp', 'telegram', 'webex', 'slack', 'other'
    ];

    if (session.sessionNotes && session.sessionNotes.startsWith('{')) {
      try {
        const parsed = JSON.parse(session.sessionNotes);
        if (parsed.platform) platform = parsed.platform;
        if (parsed.notes) tutorNotes = parsed.notes;
        if (parsed.studentInquiry) studentInquiry = parsed.studentInquiry;
      } catch (e) {
        // Fallback if JSON is malformed
        studentInquiry = session.sessionNotes;
      }
    } else if (session.sessionNotes) {
      const lowerNotes = session.sessionNotes.toLowerCase().trim();
      const isWhitelisted = platformWhitelist.some(p => lowerNotes === p || lowerNotes.includes(p));

      if (isWhitelisted && session.sessionNotes.length < 25) {
        platform = session.sessionNotes;
      } else {
        // It's likely a sentence/inquiry
        studentInquiry = session.sessionNotes;
      }
    }

    return { platform, tutorNotes, studentInquiry };
  };

  const { data: bookingData, isLoading: bookingsLoading } = useQuery({
    queryKey: ['myBookings'],
    queryFn: () => getMySessions(),
    enabled: isStudent, // Only fetch if user is a student
  });

  const { data: requestData, isLoading: requestsLoading } = useQuery({
    queryKey: ['myRequests'],
    queryFn: () => getMyBookingRequests(),
    enabled: isStudent, // Only fetch if user is a student
  });

  const confirmMutation = useMutation({
    mutationFn: (sessionId) => confirmSession(sessionId),
    onSuccess: () => {
      queryClient.invalidateQueries(['myBookings']);
      toast.success('Session confirmed!');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to confirm session');
    }
  });

  const declineMutation = useMutation({
    mutationFn: ({ sessionId, reason }) => declineInvitation(sessionId, reason),
    onSuccess: () => {
      queryClient.invalidateQueries(['myBookings']);
      toast.success('Invitation declined');
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || 'Failed to decline invitation');
    }
  });

  const handleDecline = (sessionId) => {
    if (window.confirm('Are you sure you want to decline this session invitation?')) {
      declineMutation.mutate({ sessionId, reason: 'Declined by student' });
    }
  };

  const openDetails = (session) => {
    setSelectedSession(session);
    setShowDetailsModal(true);
  };

  const bookings = bookingData?.data || [];
  const requests = requestData?.data || [];

  const isLoading = bookingsLoading || requestsLoading;

  if (isLoading) {
    return (
      <div className="live-sessions-container">
        <div className="loading-spinner">Loading your sessions...</div>
      </div>
    );
  }

  // Flatten bookings into a friendlier session format
  const sessions = bookings.map(b => ({
    ...b.session,
    id: b.sessionId, // Important: use the session ID for details/joining
    bookingId: b.id,
    bookingStatus: b.status,
    subject: b.session?.subject || 'Unnamed Session',
    scheduledStart: b.session?.scheduledStart,
    scheduledEnd: b.session?.scheduledEnd,
    tutor: b.session?.tutor,
    status: b.session?.status || 'SCHEDULED' // The overall session status
  }));

  const upcomingSessions = sessions.filter(s =>
    // Show if the session is scheduled/confirmed and hasn't ended yet
    // OR if the student is explicitly confirmed/pending for it
    (s.bookingStatus === 'CONFIRMED' || s.bookingStatus === 'PENDING') &&
    new Date(s.scheduledEnd) > new Date()
  );

  const pendingRequests = requests.filter(r => r.status === 'PENDING');

  const pastSessions = sessions.filter(s =>
    s.bookingStatus === 'COMPLETED' || new Date(s.scheduledEnd) < new Date()
  );

  return (
    <div className="live-sessions-container">
      <div className="sessions-header">
        <h1>My Tutoring Sessions</h1>
        <Link to="/student/find-tutor" className="btn-book-now">
          <FiPlus /> Book a New Session
        </Link>
      </div>

      <div className="sessions-tabs">
        <button
          className={`tab-btn ${activeTab === 'upcoming' ? 'active' : ''}`}
          onClick={() => setActiveTab('upcoming')}
        >
          Upcoming ({upcomingSessions.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          Pending Requests ({pendingRequests.length})
        </button>
        <button
          className={`tab-btn ${activeTab === 'past' ? 'active' : ''}`}
          onClick={() => setActiveTab('past')}
        >
          Past Sessions
        </button>
      </div>

      <div className="sessions-grid">
        {activeTab === 'upcoming' && (
          upcomingSessions.length > 0 ? (
            upcomingSessions.map(session => (
              <div key={session.id} className="session-card">
                <div className="session-card-header">
                  <span className="subject-badge">{session.subject}</span>
                  <span className={`status-badge ${session.bookingStatus.toLowerCase()}`}>
                    {session.bookingStatus === 'PENDING' ? 'ACTION REQUIRED' : session.bookingStatus}
                  </span>
                </div>
                <div className="session-card-body">
                  <h3>{session.subject} Session</h3>
                  <div className="session-info">
                    <div className="info-item">
                      <FiUser /> <span>Tutor: {session.tutor?.firstName} {session.tutor?.lastName}</span>
                    </div>
                    <div className="info-item">
                      <FiCalendar /> <span>{safeFormat(session.scheduledStart, 'MMMM d, yyyy')}</span>
                    </div>
                    <div className="info-item">
                      <FiClock /> <span>{safeFormat(session.scheduledStart, 'p')} - {safeFormat(session.scheduledEnd, 'p')}</span>
                    </div>
                    {(() => {
                      const { platform, tutorNotes, studentInquiry } = getSessionDetails(session);
                      return (
                        <>

                          {tutorNotes && (
                            <div className="info-item tutor-notes">
                              <FiFileText className="icon-main" />
                              <div className="notes-content">
                                <label>Tutor Notes</label>
                                <p>{tutorNotes}</p>
                              </div>
                            </div>
                          )}
                          {studentInquiry && (
                            <div className="info-item student-inquiry">
                              <FiInfo className="icon-main" />
                              <div className="notes-content">
                                <label>Your Inquiry</label>
                                <p>{studentInquiry}</p>
                              </div>
                            </div>
                          )}
                        </>
                      );
                    })()}
                  </div>
                </div>
                <div className="session-card-footer">
                  {session.bookingStatus === 'PENDING' ? (
                    <div className="action-buttons">
                      <button
                        className="btn-confirm"
                        onClick={() => confirmMutation.mutate(session.id)}
                        disabled={confirmMutation.isPending}
                      >
                        <FiCheck /> Accept
                      </button>
                      <button
                        className="btn-decline"
                        onClick={() => handleDecline(session.id)}
                        disabled={declineMutation.isPending}
                      >
                        <FiX /> Decline
                      </button>
                    </div>
                  ) : (
                    <>
                      {session.videoRoomId ? (
                        <a href={session.videoRoomId} target="_blank" rel="noopener noreferrer" className="btn-join">
                          <FiVideo /> Join Session
                        </a>
                      ) : (
                        <button className="btn-join" disabled>
                          <FiClock /> Waiting for Link
                        </button>
                      )}
                    </>
                  )}
                  <button className="btn-details" onClick={() => openDetails(session)}>
                    Details
                  </button>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">
              <FiCalendar />
              <h2>No upcoming sessions</h2>
              <p>You don't have any confirmed tutoring sessions scheduled yet.</p>
              <Link to="/student/find-tutor" className="btn-book-now">
                <FiSearch /> Find a Tutor
              </Link>
            </div>
          )
        )}

        {activeTab === 'pending' && (
          pendingRequests.length > 0 ? (
            pendingRequests.map(request => (
              <div key={request.id} className="session-card">
                <div className="session-card-header">
                  <span className="subject-badge">{request.subject}</span>
                  <span className="status-badge pending">PENDING</span>
                </div>
                <div className="session-card-body">
                  <h3>Request for {request.subject}</h3>
                  <div className="session-info">
                    <div className="info-item">
                      <FiUser /> <span>Tutor: {request.tutor?.firstName} {request.tutor?.lastName}</span>
                    </div>
                    <div className="info-item">
                      <FiCalendar /> <span>Preferred: {safeFormat(request.preferredDate, 'MMMM d, yyyy')}</span>
                    </div>
                    <div className="info-item">
                      <FiClock /> <span>{request.preferredTime} ({request.duration} min)</span>
                    </div>
                  </div>
                </div>
                <div className="session-card-footer">
                  <span className="text-muted"><FiInfo /> Waiting for tutor to accept</span>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">
              <FiClock />
              <h2>No pending requests</h2>
              <p>All your booking requests have been processed.</p>
            </div>
          )
        )}

        {activeTab === 'past' && (
          pastSessions.length > 0 ? (
            pastSessions.map(session => (
              <div key={session.id} className="session-card">
                <div className="session-card-header">
                  <span className="subject-badge">{session.subject}</span>
                  <span className="status-badge completed">COMPLETED</span>
                </div>
                <div className="session-card-body">
                  <h3>{session.subject} Session</h3>
                  <div className="session-info">
                    <div className="info-item">
                      <FiUser /> <span>Tutor: {session.tutor?.firstName} {session.tutor?.lastName}</span>
                    </div>
                    <div className="info-item">
                      <FiCalendar /> <span>{safeFormat(session.scheduledStart, 'MMMM d, yyyy')}</span>
                    </div>
                  </div>
                </div>
                <div className="session-card-footer">
                  <button className="btn-details" onClick={() => openDetails(session)}>Review Session</button>
                </div>
              </div>
            ))
          ) : (
            <div className="empty-state">
              <FiCalendar />
              <h2>No past sessions</h2>
              <p>Your completed tutoring sessions will appear here.</p>
            </div>
          )
        )}
      </div>

      {/* Session Details Modal */}
      {showDetailsModal && selectedSession && (
        <div className="modal-overlay" onClick={() => setShowDetailsModal(false)}>
          <div className="modal-content session-details-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <div className="header-title">
                <span className="subject-tag">{selectedSession.subject}</span>
                <h2>Tutoring Session Details</h2>
              </div>
              <button className="close-btn" onClick={() => setShowDetailsModal(false)}><FiX /></button>
            </div>

            <div className="modal-body glass-mode">
              {(() => {
                const { platform, tutorNotes, studentInquiry } = getSessionDetails(selectedSession);
                return (
                  <>
                    <div className="details-card summary-card">
                      <div className="detail-row">
                        <div className="detail-label"><FiUser /> Tutor</div>
                        <div className="detail-value">
                          <div className="tutor-mini-profile">
                            {selectedSession.tutor?.profilePictureUrl ? (
                              <img src={selectedSession.tutor.profilePictureUrl} alt="Tutor" className="mini-avatar" />
                            ) : (
                              <div className="mini-avatar-placeholder"><FiUser /></div>
                            )}
                            <div>
                              <strong>{selectedSession.tutor?.firstName} {selectedSession.tutor?.lastName}</strong>
                              <span className="role-text">Academic Tutor</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="detail-row">
                        <div className="detail-label"><FiCalendar /> Date</div>
                        <div className="detail-value">{safeFormat(selectedSession.scheduledStart, 'MMMM d, yyyy')}</div>
                      </div>

                      <div className="detail-row">
                        <div className="detail-label"><FiClock /> Time</div>
                        <div className="detail-value">{safeFormat(selectedSession.scheduledStart, 'p')} - {safeFormat(selectedSession.scheduledEnd, 'p')} (60 min)</div>
                      </div>


                    </div>

                    {tutorNotes && (
                      <div className="details-card notes-card tutor-notes-card">
                        <div className="detail-label"><FiFileText /> Tutor Notes</div>
                        <div className="notes-text">{tutorNotes}</div>
                      </div>
                    )}

                    {studentInquiry && (
                      <div className="details-card notes-card inquiry-card">
                        <div className="detail-label"><FiInfo /> Your Inquiry</div>
                        <div className="notes-text">{studentInquiry}</div>
                      </div>
                    )}
                  </>
                );
              })()}

              <div className="details-card link-card">
                <div className="detail-label"><FiVideo /> Meeting Link</div>
                <div className="link-content">
                  {selectedSession.videoRoomId ? (
                    <div className="link-wrapper">
                      <code className="link-code">{selectedSession.videoRoomId}</code>
                      <a href={selectedSession.videoRoomId} target="_blank" rel="noopener noreferrer" className="link-action-btn">
                        <FiExternalLink /> Visit
                      </a>
                    </div>
                  ) : (
                    <div className="link-placeholder">
                      <FiClock /> Waiting for tutor to provide the link
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowDetailsModal(false)}>Close</button>
              {selectedSession.bookingStatus === 'PENDING' ? (
                <button
                  className="btn-primary"
                  onClick={() => {
                    confirmMutation.mutate(selectedSession.id);
                    setShowDetailsModal(false);
                  }}
                >
                  Accept Invitation
                </button>
              ) : selectedSession.videoRoomId && (
                <a href={selectedSession.videoRoomId} target="_blank" rel="noopener noreferrer" className="btn-primary">
                  Join Session
                </a>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LiveSessions;
