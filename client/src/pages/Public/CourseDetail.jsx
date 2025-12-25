import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuthStore } from '../../store/authStore';
import './CourseDetail.css';
import CourseResourcesSection from '../../components/Course/CourseResourcesSection';
import { DEFAULT_COURSE_IMAGE } from '../../utils/images';

const CourseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();

  const [course, setCourse] = useState(null);
  const [components, setComponents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [enrolling, setEnrolling] = useState(false);
  const [expandedComponents, setExpandedComponents] = useState({});
  const [activeTab, setActiveTab] = useState('overview');
  const [canEdit, setCanEdit] = useState(false);
  const [isEnrolled, setIsEnrolled] = useState(false);
  

  useEffect(() => {
    fetchCourseDetails();
    fetchCourseComponents();
  }, [id]);

  const fetchCourseDetails = async () => {
    try {
      setLoading(true);
      setError(null);

      const headers = {};
      const token = localStorage.getItem('token');
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/courses/${id}`,
        { headers }
      );

      if (response.data.success) {
        setCourse(response.data.data);
        setIsEnrolled(response.data.data.isEnrolled || false);
      }
    } catch (err) {
      console.error('Failed to fetch course details:', err);
      if (err.response?.status === 404) {
        setError('Course not found');
      } else {
        setError('Failed to load course details. Please try again later.');
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchCourseComponents = async () => {
    try {
      const headers = {};
      const token = localStorage.getItem('token');
      if (token) {
        headers.Authorization = `Bearer ${token}`;
      }

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/courses/${id}/components`,
        { headers }
      );

      if (response.data.success) {
        setComponents(response.data.data);
        setCanEdit(response.data.meta?.canEdit || false);
        if (response.data.meta?.isEnrolled) {
          setIsEnrolled(true);
        }
      }
    } catch (err) {
      console.error('Failed to fetch components:', err);
    }
  };

  const handleEnroll = async () => {
    if (!isAuthenticated) {
      navigate(`/login?redirect=/courses/${id}`);
      return;
    }

    try {
      setEnrolling(true);
      const token = localStorage.getItem('token');
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/courses/${id}/enroll`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      if (response.data.success) {
        // Refresh course data to show enrolled state
        await fetchCourseDetails();
        alert('Successfully enrolled in the course!');
      }
    } catch (err) {
      console.error('Enrollment error:', err);
      const errorMessage = err.response?.data?.error?.message || 'Failed to enroll in course';
      alert(errorMessage);
    } finally {
      setEnrolling(false);
    }
  };

  const handleEditCourse = () => {
    navigate(`/tutor/course-editor/${id}`);
  };

  const handleGoToCourse = () => {
    if (course.lessons && course.lessons.length > 0) {
      const firstLesson = course.lessons[0];
      navigate(`/student/courses/${id}/lesson/${firstLesson.id}`);
    }
  };

  const toggleComponent = (componentId) => {
    setExpandedComponents(prev => ({
      ...prev,
      [componentId]: !prev[componentId]
    }));
  };

  const toggleLesson = (lessonId) => {
    setExpandedComponents(prev => ({
      ...prev,
      [lessonId]: !prev[lessonId]
    }));
  };

  const getComponentIcon = (type) => {
    const icons = {
      LEARNING_MATERIALS: 'fa-file-alt',
      ASSIGNMENT: 'fa-tasks',
      ANNOUNCEMENT: 'fa-bullhorn',
      RESOURCE_LINKS: 'fa-link',
      DISCUSSION: 'fa-comments',
      VIDEO_LESSON: 'fa-video',
      QUIZ: 'fa-question-circle'
    };
    return icons[type] || 'fa-folder';
  };

  const getComponentBadgeText = (component) => {
    if (component.componentType === 'LEARNING_MATERIALS') {
      return `${component.files?.length || 0} files`;
    }
    if (component.componentType === 'ASSIGNMENT') {
      const config = component.configuration || {};
      if (config.dueDate) {
        const dueDate = new Date(config.dueDate);
        const now = new Date();
        if (dueDate > now) {
          return `Due ${formatDate(config.dueDate)}`;
        } else {
          return 'Past due';
        }
      }
      return 'No deadline';
    }
    return '';
  };

  const renderStars = (rating) => {
    const stars = [];
    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<i key={i} className="fas fa-star"></i>);
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<i key={i} className="fas fa-star-half-alt"></i>);
      } else {
        stars.push(<i key={i} className="far fa-star"></i>);
      }
    }
    return stars;
  };

  const formatDuration = (minutes) => {
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  const isTutor = user && course && user.id === course.tutor.id;
  const isAdmin = user && user.role === 'ADMIN';
  const canManage = isTutor || isAdmin;

  if (loading) {
    return (
      <div className="course-detail-loading">
        <div className="loading-spinner"></div>
        <p>Loading course details...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="course-detail-error">
        <i className="fas fa-exclamation-circle"></i>
        <h2>{error}</h2>
        <p>The course you're looking for might have been removed or doesn't exist.</p>
        <button onClick={() => navigate('/courses')} className="btn-primary">
          <i className="fas fa-arrow-left"></i> Back to Course Catalog
        </button>
      </div>
    );
  }

  if (!course) {
    return null;
  }

  return (
    <div className="course-detail">
      {/* Hero Section */}
      <div className="course-hero">
        <div className="hero-content">
          <div className="hero-left">
            <div className="course-thumbnail">
              <img src={course.thumbnailUrl || DEFAULT_COURSE_IMAGE} alt={course.title} />
            </div>
          </div>
          <div className="hero-right">
            <div className="course-meta-badges">
              <span className={`badge badge-${course.educationLevel.toLowerCase()}`}>
                {course.educationLevel}
              </span>
              <span className={`badge badge-${course.difficulty.toLowerCase()}`}>
                {course.difficulty}
              </span>
              <span className="badge badge-language">{course.language}</span>
            </div>
            <h1 className="course-title">{course.title}</h1>
            {course.subtitle && <p className="course-subtitle">{course.subtitle}</p>}
            
            <div className="course-stats">
              <div className="stat-item">
                <div className="rating">
                  {course.averageRating ? (
                    <>
                      <span className="stars">{renderStars(parseFloat(course.averageRating))}</span>
                      <span className="rating-value">{parseFloat(course.averageRating).toFixed(1)}</span>
                      <span className="review-count">({course.reviews?.length || 0} reviews)</span>
                    </>
                  ) : (
                    <span className="no-rating">No ratings yet</span>
                  )}
                </div>
              </div>
              <div className="stat-item">
                <i className="fas fa-users"></i>
                <span>{course._count?.enrollments || 0} students enrolled</span>
              </div>
              <div className="stat-item">
                <i className="fas fa-clock"></i>
                <span>{course.estimatedHours} hours</span>
              </div>
            </div>

            <div className="tutor-info-inline">
              {course.tutor.profilePictureUrl ? (
                <img src={course.tutor.profilePictureUrl} alt={course.tutor.firstName} className="tutor-avatar" />
              ) : (
                <div className="tutor-avatar">
                  {course.tutor.firstName[0]}{course.tutor.lastName[0]}
                </div>
              )}
              <div>
                <p className="tutor-label">Instructor</p>
                <p className="tutor-name">{course.tutor.firstName} {course.tutor.lastName}</p>
              </div>
            </div>

            <div className="hero-actions">
              {canManage ? (
                <button onClick={handleEditCourse} className="btn-primary btn-large">
                  <i className="fas fa-edit"></i> Edit Course
                </button>
              ) : isEnrolled ? (
                <button onClick={handleGoToCourse} className="btn-primary btn-large">
                  <i className="fas fa-play"></i> Continue Learning
                </button>
              ) : (
                <button 
                  onClick={handleEnroll} 
                  className="btn-primary btn-large"
                  disabled={enrolling}
                >
                  {enrolling ? (
                    <>
                      <i className="fas fa-spinner fa-spin"></i> Enrolling...
                    </>
                  ) : (
                    <>
                      <i className="fas fa-book"></i> 
                      {course.pricingModel === 'FREE' ? 'Enroll for Free' : `Enroll - $${course.price}`}
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="course-tabs">
        <button 
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          <i className="fas fa-info-circle"></i> Overview
        </button>
        <button 
          className={`tab ${activeTab === 'components' ? 'active' : ''}`}
          onClick={() => setActiveTab('components')}
        >
          <i className="fas fa-th-large"></i> Components
        </button>
        {canManage && (
          <button 
            className={`tab ${activeTab === 'manage' ? 'active' : ''}`}
            onClick={() => setActiveTab('manage')}
          >
            <i className="fas fa-cog"></i> Manage
          </button>
        )}
        
      </div>

      <div className="course-content-wrapper">
        <div className="course-main-content">
          {/* Overview Section */}
          <section className="course-section">
            <h2>About This Course</h2>
            <div className="course-description">
              <p>{course.description}</p>
            </div>

            {course.learningOutcomes && course.learningOutcomes.length > 0 && (
              <div className="learning-outcomes">
                <h3>What You'll Learn</h3>
                <ul className="outcomes-list">
                  {course.learningOutcomes.map((outcome, index) => (
                    <li key={index}>
                      <i className="fas fa-check-circle"></i>
                      <span>{outcome}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {course.prerequisites && (
              <div className="prerequisites">
                <h3>Prerequisites</h3>
                <p>{course.prerequisites}</p>
              </div>
            )}

            {course.targetAudience && (
              <div className="target-audience">
                <h3>Who This Course Is For</h3>
                <p>{course.targetAudience}</p>
              </div>
            )}

            {course.tags && course.tags.length > 0 && (
              <div className="course-tags">
                <h3>Topics Covered</h3>
                <div className="tags-list">
                  {course.tags.map((tag, index) => (
                    <span key={index} className="tag">{tag}</span>
                  ))}
                </div>
              </div>
            )}
          </section>

          <CourseResourcesSection courseId={id} canManage={canEdit} isStudent={!canEdit} />

          {/* Reviews Section */}
          {course.reviews && course.reviews.length > 0 && (
            <section className="course-section reviews-section">
              <h2>Student Reviews</h2>
              <div className="reviews-list">
                {course.reviews.map((review, index) => (
                  <div key={index} className="review-card">
                    <div className="review-header">
                      <div className="reviewer-info">
                        <div className="reviewer-avatar">
                          {review.user?.firstName?.[0] || 'S'}
                        </div>
                        <div>
                          <p className="reviewer-name">
                            {review.user?.firstName || 'Student'} {review.user?.lastName?.[0] || ''}.
                          </p>
                          <p className="review-date">{formatDate(review.createdAt)}</p>
                        </div>
                      </div>
                      <div className="review-rating">
                        {renderStars(review.rating)}
                      </div>
                    </div>
                    <p className="review-text">{review.comment || review.review || ''}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>

        {/* Sidebar */}
        <aside className="course-sidebar">
          {/* Enrollment Card */}
          <div className="enrollment-card">
            <div className="price-info">
              {course.pricingModel === 'FREE' ? (
                <div className="price-free">
                  <span className="free-badge">FREE</span>
                </div>
              ) : (
                <div className="price-paid">
                  <span className="price-amount">${course.price}</span>
                  <span className="price-label">One-time payment</span>
                </div>
              )}
            </div>
            
            {isTutor || isAdmin ? (
              <button onClick={handleEditCourse} className="btn-primary btn-block">
                <i className="fas fa-edit"></i> Edit Course
              </button>
            ) : isEnrolled ? (
              <button onClick={handleGoToCourse} className="btn-primary btn-block">
                <i className="fas fa-play"></i> Continue Learning
              </button>
            ) : (
              <button 
                onClick={handleEnroll} 
                className="btn-primary btn-block"
                disabled={enrolling}
              >
                {enrolling ? (
                  <>
                    <i className="fas fa-spinner fa-spin"></i> Enrolling...
                  </>
                ) : (
                  <>
                    <i className="fas fa-book"></i> Enroll Now
                  </>
                )}
              </button>
            )}

            <div className="course-features">
              <div className="feature-item">
                <i className="fas fa-infinity"></i>
                <span>Lifetime access</span>
              </div>
              <div className="feature-item">
                <i className="fas fa-mobile-alt"></i>
                <span>Access on mobile and desktop</span>
              </div>
              <div className="feature-item">
                <i className="fas fa-book"></i>
                <span>{course.lessons?.length || 0} lessons</span>
              </div>
              <div className="feature-item">
                <i className="fas fa-clock"></i>
                <span>{course.estimatedHours} hours of content</span>
              </div>
            </div>
          </div>

          {/* Instructor Card */}
          <div className="instructor-card">
            <h3>Instructor</h3>
            <div className="instructor-profile">
              {course.tutor.profilePictureUrl ? (
                <img src={course.tutor.profilePictureUrl} alt={course.tutor.firstName} className="instructor-avatar" />
              ) : (
                <div className="instructor-avatar">
                  {course.tutor.firstName[0]}{course.tutor.lastName[0]}
                </div>
              )}
              <h4>{course.tutor.firstName} {course.tutor.lastName}</h4>
              {course.tutor.bio && (
                <p className="instructor-bio">{course.tutor.bio}</p>
              )}
            </div>
          </div>
        </aside>
      </div>
      
    </div>
  );
};

export default CourseDetail;
