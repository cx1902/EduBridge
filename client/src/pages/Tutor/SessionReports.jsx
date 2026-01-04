import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuthStore } from '../../store/authStore';
import './TutorDashboard.css';

const SessionReports = () => {
  const { token } = useAuthStore();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchSessionStats();
  }, []);

  const fetchSessionStats = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      const response = await axios.get(`${API_URL}/tutor/analytics/sessions`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setStats(response.data);
      }
    } catch (err) {
      console.error('Failed to fetch session stats:', err);
      setError('Failed to load session reports.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="tutor-dashboard">
        <div className="loading">Loading reports...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="tutor-dashboard">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  return (
    <div className="tutor-dashboard">
      <div className="dashboard-header">
        <h1>Session Statistics</h1>
        <p className="dashboard-subtitle">Overview of your tutoring performance and earnings</p>
      </div>

      {/* Overview Cards */}
      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon sessions">
            <i className="fas fa-video"></i>
          </div>
          <div className="stat-info">
            <h3>{stats?.overview?.totalSessions || 0}</h3>
            <p>Total Sessions</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--success-light)', color: 'var(--success-color)' }}>
            <i className="fas fa-check-circle"></i>
          </div>
          <div className="stat-info">
            <h3>{stats?.overview?.completionRate || '0%'}</h3>
            <p>Completion Rate</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon rating">
            <i className="fas fa-star"></i>
          </div>
          <div className="stat-info">
            <h3>{stats?.overview?.averageRating || '0.0'}</h3>
            <p>Average Rating</p>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'var(--info-light)', color: 'var(--info-color)' }}>
            <i className="fas fa-dollar-sign"></i>
          </div>
          <div className="stat-info">
            <h3>${stats?.overview?.totalEarnings || '0.00'}</h3>
            <p>Total Earnings</p>
          </div>
        </div>
      </div>

      <div className="dashboard-content">
        {/* Recent Session History */}
        <div className="dashboard-section" style={{ gridColumn: '1 / -1' }}>
          <div className="section-header">
            <h2>Recent Completed Sessions</h2>
          </div>

          {stats?.recentHistory?.length === 0 ? (
            <div className="empty-state">
              <i className="fas fa-history"></i>
              <p>No completed sessions yet.</p>
            </div>
          ) : (
            <div className="table-responsive">
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid var(--color-border)', textAlign: 'left' }}>
                    <th style={{ padding: '1rem' }}>Topic</th>
                    <th style={{ padding: '1rem' }}>Date Completed</th>
                    <th style={{ padding: '1rem' }}>Attendees</th>
                    <th style={{ padding: '1rem' }}>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {stats?.recentHistory?.map(session => (
                    <tr key={session.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: '1rem', fontWeight: 500 }}>{session.topic}</td>
                      <td style={{ padding: '1rem', color: 'var(--color-text-secondary)' }}>
                        {new Date(session.date).toLocaleString()}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <i className="fas fa-user-friends" style={{ marginRight: '0.5rem', color: 'var(--color-text-muted)' }}></i>
                        {session.attendees}
                      </td>
                      <td style={{ padding: '1rem' }}>
                        <span className="badge" style={{ background: 'var(--success-light)', color: 'var(--success-color)' }}>
                          Completed
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SessionReports;
