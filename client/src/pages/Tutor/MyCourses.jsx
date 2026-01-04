import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuthStore } from '../../store/authStore';
import './TutorDashboard.css';

const MyCourses = () => {
  const { token } = useAuthStore();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      const response = await axios.get(`${API_URL}/tutor/courses`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (response.data.success) {
        setCourses(response.data.data);
      }
    } catch (err) {
      console.error('Failed to fetch courses:', err);
      setError('Failed to load your courses.');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="tutor-dashboard">
        <div className="loading">Loading courses...</div>
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
      <div className="dashboard-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <h1>My Courses</h1>
          <p className="dashboard-subtitle">Manage and edit your created courses</p>
        </div>
        <Link to="/tutor/courses/create" className="action-btn primary">
          <i className="fas fa-plus"></i> Create New Course
        </Link>
      </div>

      {courses.length === 0 ? (
        <div className="empty-state">
          <i className="fas fa-book-open"></i>
          <h3>No courses yet</h3>
          <p>Start sharing your knowledge by creating your first course.</p>
          <Link to="/tutor/courses/create" className="action-btn primary mt-md">
            Create Course
          </Link>
        </div>
      ) : (
        <div className="dashboard-section">
          <div className="courses-list" style={{ display: 'grid', gap: '1rem' }}>
            {courses.map(course => (
              <div key={course.id} className="course-card" style={{ 
                display: 'flex', 
                gap: '1.5rem', 
                padding: '1.5rem', 
                border: '1px solid var(--color-border)', 
                borderRadius: '8px',
                alignItems: 'center',
                background: 'var(--color-surface)'
              }}>
                <div className="course-thumbnail" style={{ 
                  width: '120px', 
                  height: '80px', 
                  borderRadius: '6px', 
                  overflow: 'hidden',
                  flexShrink: 0
                }}>
                  <img 
                    src={course.thumbnailUrl || 'https://ui-avatars.com/api/?name=' + course.title} 
                    alt={course.title}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    onError={(e) => { e.target.onerror = null; e.target.src = 'https://ui-avatars.com/api/?name=' + course.title; }}
                  />
                </div>
                
                <div className="course-info" style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                    <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>{course.title}</h3>
                    <span className={`badge ${course.status.toLowerCase()}`} style={{ 
                      background: course.status === 'PUBLISHED' ? 'var(--success-light)' : 'var(--warning-light)',
                      color: course.status === 'PUBLISHED' ? 'var(--success-color)' : 'var(--warning-color)',
                      border: `2px solid ${course.status === 'PUBLISHED' ? 'var(--success-color)' : 'var(--warning-color)'}`,
                      padding: '0.25rem 0.75rem',
                      borderRadius: '20px',
                      fontSize: '0.75rem',
                      fontWeight: 700
                    }}>
                      {course.status}
                    </span>
                  </div>
                  
                  <p style={{ 
                    color: 'var(--color-text-secondary)', 
                    fontSize: '0.9rem', 
                    margin: '0 0 1rem 0',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}>
                    {course.description}
                  </p>
                  
                  <div className="course-meta" style={{ display: 'flex', gap: '1.5rem', fontSize: '0.85rem', color: 'var(--color-text-muted)' }}>
                    <span><i className="fas fa-users"></i> {course.enrollmentCount || 0} Students</span>
                    <span><i className="fas fa-book"></i> {course.lessonCount || 0} Lessons</span>
                    <span><i className="fas fa-star"></i> {course.averageRating ? Number(course.averageRating).toFixed(1) : 'N/A'}</span>
                  </div>
                </div>

                <div className="course-actions" style={{ display: 'flex', gap: '0.5rem', flexDirection: 'row', alignItems: 'center' }}>
                  <Link to={`/tutor/course-editor/${course.id}`} className="action-btn secondary" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
                    <i className="fas fa-edit"></i> Edit
                  </Link>
                  <Link to={`/courses/${course.id}`} className="action-btn view-btn" style={{ padding: '0.5rem 1rem', fontSize: '0.9rem' }}>
                    <i className="fas fa-eye"></i> View
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default MyCourses;
