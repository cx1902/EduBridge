import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuthStore } from '../../store/authStore';
import './TutorDashboard.css';

const TutorAnalytics = () => {
  const { token } = useAuthStore();
  const [engagementData, setEngagementData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterCourse, setFilterCourse] = useState('all');

  useEffect(() => {
    fetchEngagementData();
  }, []);

  const fetchEngagementData = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      const response = await axios.get(`${API_URL}/tutor/analytics/engagement`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setEngagementData(response.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch engagement data:', err);
      setError('Failed to load student engagement data.');
    } finally {
      setLoading(false);
    }
  };

  const courses = [...new Set(engagementData.map(item => item.courseName))];
  const filteredData = filterCourse === 'all' 
    ? engagementData 
    : engagementData.filter(item => item.courseName === filterCourse);

  if (loading) {
    return (
      <div className="tutor-dashboard">
        <div className="loading">Loading analytics...</div>
      </div>
    );
  }

  return (
    <div className="tutor-dashboard">
      <div className="dashboard-header">
        <h1>Student Engagement</h1>
        <p className="dashboard-subtitle">Track student progress and performance across your courses</p>
      </div>

      {error && <div className="error-message">{error}</div>}

      <div className="dashboard-section">
        <div className="section-header">
          <h2>Student Progress</h2>
          <div className="filter-controls">
            <select 
              value={filterCourse} 
              onChange={(e) => setFilterCourse(e.target.value)}
              style={{ padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--color-border)' }}
            >
              <option value="all">All Courses</option>
              {courses.map(course => (
                <option key={course} value={course}>{course}</option>
              ))}
            </select>
          </div>
        </div>

        {filteredData.length === 0 ? (
          <div className="empty-state">
            <i className="fas fa-chart-bar"></i>
            <p>No student data available yet.</p>
          </div>
        ) : (
          <div className="table-responsive" style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', minWidth: '800px' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid var(--color-border)', textAlign: 'left' }}>
                  <th style={{ padding: '1rem' }}>Student</th>
                  <th style={{ padding: '1rem' }}>Course</th>
                  <th style={{ padding: '1rem' }}>Progress</th>
                  <th style={{ padding: '1rem' }}>Quizzes Taken</th>
                  <th style={{ padding: '1rem' }}>Avg. Score</th>
                  <th style={{ padding: '1rem' }}>Last Active</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((student, index) => (
                  <tr key={`${student.studentId}-${index}`} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td style={{ padding: '1rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <img 
                        src={student.studentAvatar || `https://ui-avatars.com/api/?name=${student.studentName}`} 
                        alt={student.studentName}
                        style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }}
                        onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=${student.studentName}`; }}
                      />
                      <div>
                        <div style={{ fontWeight: 500 }}>{student.studentName}</div>
                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)' }}>{student.studentEmail}</div>
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>{student.courseName}</td>
                    <td style={{ padding: '1rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <div style={{ flex: 1, height: '6px', background: 'var(--bg-secondary)', borderRadius: '3px', width: '80px' }}>
                          <div style={{ 
                            width: `${student.progressPercentage}%`, 
                            height: '100%', 
                            background: 'var(--color-primary)', 
                            borderRadius: '3px' 
                          }}></div>
                        </div>
                        <span style={{ fontSize: '0.85rem' }}>{student.progressPercentage}%</span>
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--color-text-muted)', marginTop: '0.25rem' }}>
                        {student.lessonsCompleted} lessons completed
                      </div>
                    </td>
                    <td style={{ padding: '1rem' }}>{student.quizzesTaken}</td>
                    <td style={{ padding: '1rem' }}>
                      <span style={{ 
                        fontWeight: 600,
                        color: student.averageQuizScore >= 70 ? 'var(--success-color)' : student.averageQuizScore >= 50 ? 'var(--warning-color)' : 'var(--danger-color)'
                      }}>
                        {student.averageQuizScore}%
                      </span>
                    </td>
                    <td style={{ padding: '1rem', fontSize: '0.9rem', color: 'var(--color-text-secondary)' }}>
                      {student.lastActive ? new Date(student.lastActive).toLocaleDateString() : 'Never'}
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

export default TutorAnalytics;
