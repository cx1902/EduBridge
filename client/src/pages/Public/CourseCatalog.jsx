import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import './CourseCatalog.css';

const CourseCatalog = () => {
  const navigate = useNavigate();
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

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL}/courses?${queryParams.toString()}`
      );

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
                {course.thumbnailUrl ? (
                  <img src={course.thumbnailUrl} alt={course.title} />
                ) : (
                  <div className="placeholder-thumbnail">
                    <i className="fas fa-graduation-cap"></i>
                  </div>
                )}
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
                    <span>
                      {course.tutor.firstName} {course.tutor.lastName}
                    </span>
                  </div>

                  <div className="course-stats">
                    <span>
                      <i className="fas fa-users"></i> {course._count.enrollments}
                    </span>
                    <span>
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
