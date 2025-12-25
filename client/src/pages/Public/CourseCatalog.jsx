import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuthStore } from '../../store/authStore';
import { useNavigate } from 'react-router-dom';
import './CourseCatalog.css';
import { DEFAULT_COURSE_IMAGE } from '../../utils/images';

const CourseCatalog = () => {
  const navigate = useNavigate();
  const { token, user, isAuthenticated } = useAuthStore();
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filters, setFilters] = useState({
    search: '',
    subjectCategory: '',
    educationLevel: '',
    difficulty: '',
    pricingModel: ''
  });

  useEffect(() => {
    fetchCourses();
  }, [filters]);

  const fetchCourses = async () => {
    try {
      setLoading(true);
      setError(null);

      const queryParams = new URLSearchParams();
      Object.keys(filters).forEach(key => {
        if (filters[key]) {
          queryParams.append(key, filters[key]);
        }
      });
      // If user is a tutor/admin, they might want to see their own drafts
      if (isAuthenticated && user && (user.role === 'TUTOR' || user.role === 'ADMIN')) {
        queryParams.append('includeOwnDrafts', 'true');
      }

      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      console.log(`Fetching courses from: ${API_URL}/courses?${queryParams.toString()}`);

      // Add Authorization header only if token is available
      const config = {};
      if (token) {
        config.headers = { Authorization: `Bearer ${token}` };
      }

      const response = await axios.get(
        `${API_URL}/courses?${queryParams.toString()}`,
        config
      );

      console.log('Courses API response:', response.data);

      if (response.data.success) {
        setCourses(response.data.data.courses);
      }
    } catch (err) {
      console.error('Failed to fetch courses:', err);
      setError('Failed to load courses. Please try again later.');
    } finally {
      setLoading(false);
    }
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const handleCourseClick = (courseId) => {
    navigate(`/courses/${courseId}`);
  };

  return (
    <div className="course-catalog">
      <div className="catalog-header">
        <h1>Course Catalog</h1>
        <p>Browse our comprehensive collection of courses.</p>
      </div>

      {/* Filters */}
      <div className="filters-section">
        <div className="filter-group">
          <input
            type="text"
            placeholder="Search courses..."
            value={filters.search}
            onChange={(e) => handleFilterChange('search', e.target.value)}
            className="search-input"
          />
        </div>

        <div className="filter-row">
          <select
            value={filters.educationLevel}
            onChange={(e) => handleFilterChange('educationLevel', e.target.value)}
            className="filter-select"
          >
            <option value="">All Levels</option>
            <option value="PRIMARY">Primary</option>
            <option value="SECONDARY">Secondary</option>
            <option value="UNIVERSITY">University</option>
          </select>

          <select
            value={filters.difficulty}
            onChange={(e) => handleFilterChange('difficulty', e.target.value)}
            className="filter-select"
          >
            <option value="">All Difficulties</option>
            <option value="BEGINNER">Beginner</option>
            <option value="INTERMEDIATE">Intermediate</option>
            <option value="ADVANCED">Advanced</option>
          </select>

          <select
            value={filters.pricingModel}
            onChange={(e) => handleFilterChange('pricingModel', e.target.value)}
            className="filter-select"
          >
            <option value="">All Prices</option>
            <option value="FREE">Free</option>
            <option value="ONE_TIME">Paid</option>
          </select>
        </div>
      </div>

      {/* Courses Grid */}
      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading courses...</p>
        </div>
      ) : error ? (
        <div className="error-state">
          <i className="fas fa-exclamation-circle"></i>
          <p>{error}</p>
          <button onClick={fetchCourses} className="retry-btn">
            Try Again
          </button>
        </div>
      ) : courses.length === 0 ? (
        <div className="empty-state">
          <i className="fas fa-book-open"></i>
          <h3>No courses found</h3>
          <p>Try adjusting your filters or check back later for new courses.</p>
        </div>
      ) : (
        <div className="courses-grid">
          {courses.map((course) => (
            <div
              key={course.id}
              className="course-card"
              onClick={() => handleCourseClick(course.id)}
            >
              <div className="course-thumbnail">
                <img src={course.thumbnailUrl || DEFAULT_COURSE_IMAGE} alt={course.title} />
                {course.pricingModel === 'FREE' && (
                  <span className="free-badge">FREE</span>
                )}
              </div>

              <div className="course-content">
                <div className="course-meta">
                  <span className={`difficulty-badge ${course.difficulty.toLowerCase()}`}>
                    {course.difficulty}
                  </span>
                  <span className="education-level">{course.educationLevel}</span>
                </div>

                <h3 className="course-title">{course.title}</h3>
                <p className="course-description">
                  {course.description?.substring(0, 120)}
                  {course.description?.length > 120 ? '...' : ''}
                </p>

                <div className="course-footer">
                  <div className="tutor-info">
                    {course.tutor.profilePictureUrl ? (
                      <img src={course.tutor.profilePictureUrl} alt="Tutor" />
                    ) : (
                      <div className="tutor-avatar">
                        {course.tutor.firstName[0]}{course.tutor.lastName[0]}
                      </div>
                    )}
                    <div className="tutor-text">
                      <span className="tutor-label">Instructor</span>
                      <span className="tutor-name">
                        {course.tutor.firstName} {course.tutor.lastName}
                      </span>
                    </div>
                  </div>

                  <div className="course-stats">
                    <span title="Students enrolled">
                      <i className="fas fa-users"></i> {course._count.enrollments}
                    </span>
                    <span title="Lessons">
                      <i className="fas fa-book"></i> {course._count.lessons}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CourseCatalog;
