import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { useAuthStore } from '../../store/authStore';
import { FaPlus, FaBook, FaUsers, FaStar, FaEdit, FaEye } from 'react-icons/fa';
import { getCourseImageUrl } from '../../utils/images';
import './MyCourses.css';

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
      <div className="tutor-courses-page">
        <div className="loading-state">
          <div className="loading-spinner"></div>
          <p>Loading your courses...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="tutor-courses-page">
        <div className="error-state">
          <i className="fas fa-exclamation-triangle"></i>
          <p>{error}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="tutor-courses-page">
      <div className="tutor-courses-header">
        <div className="header-content">
          <h1>My Courses</h1>
          <p>Manage and edit your created courses</p>
        </div>
        <Link to="/tutor/courses/create" className="btn-create-course">
          <FaPlus /> Create New Course
        </Link>
      </div>

      {courses.length === 0 ? (
        <div className="empty-state-modern">
          <i className="fas fa-book-open"></i>
          <h3>No courses yet</h3>
          <p>Start sharing your knowledge by creating your first course.</p>
          <Link to="/tutor/courses/create" className="btn-create-course">
            <FaPlus /> Create Your First Course
          </Link>
        </div>
      ) : (
        <div className="courses-grid">
          {courses.map(course => (
            <div key={course.id} className="course-card-modern">
              <div className="course-thumbnail-container">
                <img
                  src={getCourseImageUrl(course.thumbnailUrl)}
                  alt={course.title}
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(course.title)}&size=400&background=6366f1&color=fff&bold=true`;
                  }}
                />
                <span className={`course-status-badge ${course.status.toLowerCase()}`}>
                  {course.status}
                </span>
              </div>

              <div className="course-card-body">
                <h3 className="course-title">{course.title}</h3>
                <p className="course-description">{course.description}</p>

                <div className="course-stats">
                  <div className="stat-item">
                    <FaUsers />
                    <span className="stat-value">{course.enrollmentCount || 0}</span>
                    <span>Students</span>
                  </div>
                  <div className="stat-item">
                    <FaBook />
                    <span className="stat-value">{course.lessonCount || 0}</span>
                    <span>Lessons</span>
                  </div>
                  <div className="stat-item">
                    <FaStar />
                    <span className="stat-value">
                      {course.averageRating ? Number(course.averageRating).toFixed(1) : 'N/A'}
                    </span>
                  </div>
                </div>
              </div>

              <div className="course-actions-modern">
                <Link to={`/tutor/course-editor/${course.id}`} className="btn-course-action btn-edit">
                  <FaEdit /> Edit
                </Link>
                <Link to={`/courses/${course.id}`} className="btn-course-action btn-view">
                  <FaEye /> View
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyCourses;
