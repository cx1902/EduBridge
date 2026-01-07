import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuthStore } from '../../store/authStore';
import { FaVideo, FaCheckCircle, FaStar, FaHistory, FaUserFriends, FaCalendarAlt } from 'react-icons/fa';
import './SessionReports.css';

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
      <div className="reports-dashboard">
        <div className="loading">Loading reports...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="reports-dashboard">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  return (
    <div className="reports-dashboard">
      <div className="reports-header">
        <h1>Session Statistics</h1>
        <p className="reports-subtitle">Overview of your tutoring performance</p>
      </div>

      {/* Overview Cards - 3 Column Grid (No Earnings) */}
      <div className="reports-grid">
        <div className="report-card">
          <div className="report-icon sessions">
            <FaVideo />
          </div>
          <div className="report-info">
            <h3>{stats?.overview?.totalSessions || 0}</h3>
            <p>Total Sessions</p>
          </div>
        </div>

        <div className="report-card">
          <div className="report-icon completion">
            <FaCheckCircle />
          </div>
          <div className="report-info">
            <h3>{stats?.overview?.completionRate || '0%'}</h3>
            <p>Completion Rate</p>
          </div>
        </div>

        <div className="report-card">
          <div className="report-icon rating">
            <FaStar />
          </div>
          <div className="report-info">
            <h3>{stats?.overview?.averageRating || '0.0'}</h3>
            <p>Average Rating</p>
          </div>
        </div>
      </div>

      <div className="reports-content">
        <div className="section-header">
          <h2>Recent Completed Sessions</h2>
        </div>

        {stats?.recentHistory?.length === 0 ? (
          <div className="empty-state">
            <FaHistory />
            <p>No completed sessions yet.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="report-table">
              <thead>
                <tr>
                  <th>Topic</th>
                  <th>Date Completed</th>
                  <th>Attendees</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {stats?.recentHistory?.map(session => (
                  <tr key={session.id}>
                    <td className="topic-cell">{session.topic}</td>
                    <td className="date-cell">
                      <FaCalendarAlt style={{ marginRight: '0.5rem', opacity: 0.7 }} />
                      {new Date(session.date).toLocaleString()}
                    </td>
                    <td className="attendees-cell">
                      <FaUserFriends />
                      {session.attendees}
                    </td>
                    <td>
                      <span className="status-badge">
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
  );
};

export default SessionReports;
