import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { getCourseImageUrl } from '../../utils/images';
import './MyCourses.css';

const MyCourses = () => {
  const { token } = useAuthStore();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [enrollments, setEnrollments] = useState([]);
  const [filter, setFilter] = useState('all'); // all, in-progress, completed

  useEffect(() => {
    fetchEnrollments();
  }, []);

  const fetchEnrollments = async () => {
    try {
      setLoading(true);
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      const response = await axios.get(`${API_URL}/progress/my-progress`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setEnrollments(response.data.data.enrollments || []);
      }
    } catch (error) {
      console.error('Error fetching enrollments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getFilteredEnrollments = () => {
    switch (filter) {
      case 'in-progress':
        return enrollments.filter(e => e.progressPercentage < 100);
      case 'completed':
        return enrollments.filter(e => e.progressPercentage >= 100);
      default:
        return enrollments;
    }
  };

  const filteredEnrollments = getFilteredEnrollments();

  if (loading) {
    return (
      <div className="my-courses-container">
        <div className="loading-spinner"></div>
      </div>
    );
  }

  return (
    <div className="my-courses-container">
      <div className="my-courses-header">
        <div>
          <h1>My Courses</h1>
          <p>Manage and track all your enrolled courses</p>
        </div>
        <div className="course-stats">
          <div className="stat-item">
            <span className="stat-number">{enrollments.length}</span>
            <span className="stat-label">Total Courses</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{enrollments.filter(e => e.progressPercentage < 100).length}</span>
            <span className="stat-label">In Progress</span>
          </div>
          <div className="stat-item">
            <span className="stat-number">{enrollments.filter(e => e.progressPercentage >= 100).length}</span>
            <span className="stat-label">Completed</span>
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="filter-tabs">
        <button
          className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
          onClick={() => setFilter('all')}
        >
          All Courses ({enrollments.length})
        </button>
        <button
          className={`filter-tab ${filter === 'in-progress' ? 'active' : ''}`}
          onClick={() => setFilter('in-progress')}
        >
          In Progress ({enrollments.filter(e => e.progressPercentage < 100).length})
        </button>
        <button
          className={`filter-tab ${filter === 'completed' ? 'active' : ''}`}
          onClick={() => setFilter('completed')}
        >
          Completed ({enrollments.filter(e => e.progressPercentage >= 100).length})
        </button>
      </div>

      {/* Courses Grid */}
      <div className="courses-grid-mycourses">
        {filteredEnrollments.length > 0 ? (
          filteredEnrollments.map(enrollment => (
            <div key={enrollment.id} className="course-card-mycourses">
              <div className="course-thumbnail">
                <img
                  src={getCourseImageUrl(enrollment.courseThumbnail)}
                  alt={enrollment.courseTitle}
                />
                {enrollment.progressPercentage >= 100 && (
                  <div className="completion-badge">
                    <i className="fas fa-check-circle"></i> Completed
                  </div>
                )}
              </div>

              <div className="course-content">
                <h3>{enrollment.courseTitle}</h3>

                <div className="progress-info">
                  <div className="progress-header">
                    <span className="progress-label">Progress</span>
                    <span className="progress-percentage">{enrollment.progressPercentage}%</span>
                  </div>
                  <div className="progress-bar-container">
                    <div
                      className="progress-bar-fill"
                      style={{ width: `${enrollment.progressPercentage}%` }}
                    ></div>
                  </div>
                  <div className="lessons-count">
                    {enrollment.completedLessons} of {enrollment.totalLessons} lessons completed
                  </div>
                </div>

                <div className="course-actions">
                  <button
                    className="btn-continue-course"
                    onClick={() => navigate(`/courses/${enrollment.courseId}`)}
                  >
                    {enrollment.progressPercentage >= 100 ? 'Review Course' : 'Continue Learning'}
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="empty-state-mycourses">
            <i className="fas fa-book-open"></i>
            <h3>No courses found</h3>
            <p>
              {filter === 'all'
                ? "You haven't enrolled in any courses yet."
                : filter === 'in-progress'
                  ? "You don't have any courses in progress."
                  : "You haven't completed any courses yet."}
            </p>
            {filter === 'all' && (
              <button
                className="btn-browse-courses"
                onClick={() => navigate('/courses')}
              >
                Browse Courses
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyCourses;
