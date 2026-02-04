import React, { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuthStore } from '../../store/authStore'
import './CourseDetail.css'
import CourseResourcesSection from '../../components/Course/CourseResourcesSection'
import CourseStudents from '../../components/Course/CourseStudents'
import { DEFAULT_COURSE_IMAGE, getCourseImageUrl } from '../../utils/images'
import ReviewModal from '../../components/ReviewModal'

const CourseDetail = () => {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user, isAuthenticated } = useAuthStore()

  const [course, setCourse] = useState(null)
  const [components, setComponents] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [enrolling, setEnrolling] = useState(false)
  const [expandedComponents, setExpandedComponents] = useState({})
  const [activeTab, setActiveTab] = useState('overview')
  const [canEdit, setCanEdit] = useState(false)

  const [isEnrolled, setIsEnrolled] = useState(false)
  const [isReviewModalOpen, setIsReviewModalOpen] = useState(false)
  const [userReview, setUserReview] = useState(null) // New state for user's review
  const [showContactInfo, setShowContactInfo] = useState(false)

  useEffect(() => {
    fetchCourseDetails()
    fetchCourseComponents()
  }, [id, user]) // Added user to dependency array to re-fetch if user changes

  // Move canManage calculation here, before it is used in useEffect
  const isTutor = user && course && user.id === course.tutor.id
  const isAdmin = user && user.role === 'ADMIN'
  const canManage = isTutor || isAdmin

  const fetchCourseDetails = async () => {
    try {
      setLoading(true)
      setError(null)

      const headers = {}
      const token = localStorage.getItem('token')
      if (token) {
        headers.Authorization = `Bearer ${token}`
      }

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/courses/${id}`,
        { headers }
      )

      if (response.data.success) {
        setCourse(response.data.data)
        // data.isEnrolled is returned from backend if user is logged in
        setIsEnrolled(response.data.data.isEnrolled || false)

        // Find user review if logged in
        if (user && response.data.data.reviews) {
          const myReview = response.data.data.reviews.find(r => r.userId === user.id)
          setUserReview(myReview)
        } else {
          setUserReview(null) // Clear user review if not logged in or no reviews
        }
      }
    } catch (err) {
      console.error('Failed to fetch course details:', err)
      if (err.response?.status === 404) {
        setError('Course not found')
      } else {
        setError('Failed to load course details. Please try again later.')
      }
    } finally {
      setLoading(false)
    }
  }

  const fetchCourseComponents = async () => {
    try {
      const headers = {}
      const token = localStorage.getItem('token')
      if (token) {
        headers.Authorization = `Bearer ${token}`
      }

      const response = await axios.get(
        `${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/courses/${id}/components`,
        { headers }
      )

      if (response.data.success) {
        setComponents(response.data.data)
        setCanEdit(response.data.meta?.canEdit || false)
        if (response.data.meta?.isEnrolled) {
          setIsEnrolled(true)
        }
      }
    } catch (err) {
      console.error('Failed to fetch components:', err)
    }
  }

  const handleEnroll = async () => {
    if (!isAuthenticated) {
      navigate(`/login?redirect=/courses/${id}`)
      return
    }

    try {
      setEnrolling(true)

      // Get token from zustand store
      let token = useAuthStore.getState().token;

      // Fallback to storage if not in state
      if (!token) {
        const stored = localStorage.getItem('auth-storage') || sessionStorage.getItem('auth-storage');
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            token = parsed.token;
          } catch (e) {
            console.error('Failed to parse auth storage');
          }
        }
      }

      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

      const response = await axios.post(
        `${API_URL}/courses/${id}/enroll`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      )

      if (response.data.success) {
        // Refresh course data to show enrolled state
        await fetchCourseDetails()
        alert('Successfully enrolled in the course!')
      }
    } catch (err) {
      console.error('Enrollment error:', err)
      const errorMessage =
        err.response?.data?.error?.message || 'Failed to enroll in course'
      alert(errorMessage)
    } finally {
      setEnrolling(false)
    }
  }

  const handleEditCourse = () => {
    navigate(`/tutor/course-editor/${id}`)
  }

  const handleGoToCourse = () => {
    if (course.lessons && course.lessons.length > 0) {
      const firstLesson = course.lessons[0]
      navigate(`/student/courses/${id}/lesson/${firstLesson.id}`)
    }
  }

  const toggleComponent = componentId => {
    setExpandedComponents(prev => ({
      ...prev,
      [componentId]: !prev[componentId]
    }))
  }

  const toggleLesson = lessonId => {
    setExpandedComponents(prev => ({
      ...prev,
      [lessonId]: !prev[lessonId]
    }))
  }

  const getComponentIcon = type => {
    const icons = {
      LEARNING_MATERIALS: 'fa-file-alt',
      ASSIGNMENT: 'fa-tasks',
      ANNOUNCEMENT: 'fa-bullhorn',
      RESOURCE_LINKS: 'fa-link',
      DISCUSSION: 'fa-comments',
      VIDEO_LESSON: 'fa-video',
      QUIZ: 'fa-question-circle'
    }
    return icons[type] || 'fa-folder'
  }

  const getComponentBadgeText = component => {
    if (component.componentType === 'LEARNING_MATERIALS') {
      return `${component.files?.length || 0} files`
    }
    if (component.componentType === 'ASSIGNMENT') {
      const config = component.configuration || {}
      if (config.dueDate) {
        const dueDate = new Date(config.dueDate)
        const now = new Date()
        if (dueDate > now) {
          return `Due ${formatDate(config.dueDate)}`
        } else {
          return 'Past due'
        }
      }
      return 'No deadline'
    }
    return ''
  }

  const renderStars = rating => {
    const stars = []
    const fullStars = Math.floor(rating)
    const hasHalfStar = rating % 1 >= 0.5

    for (let i = 0; i < 5; i++) {
      if (i < fullStars) {
        stars.push(<i key={i} className='fas fa-star'></i>)
      } else if (i === fullStars && hasHalfStar) {
        stars.push(<i key={i} className='fas fa-star-half-alt'></i>)
      } else {
        stars.push(<i key={i} className='far fa-star'></i>)
      }
    }
    return stars
  }

  const formatDuration = minutes => {
    if (minutes < 60) {
      return `${minutes} min`
    }
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`
  }

  const formatDate = dateString => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    })
  }

  if (loading) {
    return (
      <div className='course-detail-loading'>
        <div className='loading-spinner'></div>
        <p>Loading course details...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className='course-detail-error'>
        <i className='fas fa-exclamation-circle'></i>
        <h2>{error}</h2>
        <p>
          The course you're looking for might have been removed or doesn't
          exist.
        </p>
        <button onClick={() => navigate('/courses')} className='btn-primary'>
          <i className='fas fa-arrow-left'></i> Back to Course Catalog
        </button>
      </div>
    )
  }

  if (!course) {
    return null
  }

  return (
    <div className='course-detail'>
      {/* Hero Section */}
      <div className='course-hero'>
        <div className='hero-content'>
          <div className='hero-left'>
            <div className='course-thumbnail'>
              <img
                src={getCourseImageUrl(course.thumbnailUrl)}
                alt={course.title}
              />
            </div>
          </div>
          <div className='hero-right'>
            <div className='course-meta-badges'>
              <span
                className={`badge badge-${course.educationLevel.toLowerCase()}`}
              >
                {course.educationLevel}
              </span>
              <span
                className={`badge badge-${course.difficulty.toLowerCase()}`}
              >
                {course.difficulty}
              </span>
              <span className='badge badge-language'>{course.language}</span>
            </div>
            <h1 className='course-title'>{course.title}</h1>
            {course.subtitle && (
              <p className='course-subtitle'>{course.subtitle}</p>
            )}

            <div className='course-stats'>
              <div className='stat-item'>
                <div className='rating'>
                  {course.averageRating ? (
                    <>
                      <span className='stars'>
                        {renderStars(parseFloat(course.averageRating))}
                      </span>
                      <span className='rating-value'>
                        {parseFloat(course.averageRating).toFixed(1)}
                      </span>
                      <span className='review-count'>
                        ({course.reviews?.length || 0} reviews)
                      </span>
                    </>
                  ) : (
                    <span className='no-rating'>No ratings yet</span>
                  )}
                </div>
              </div>
              <div className='stat-item'>
                <i className='fas fa-users'></i>
                <span>{course._count?.enrollments || 0} students enrolled</span>
              </div>
              <div className='stat-item'>
                <i className='fas fa-clock'></i>
                <span>{course.estimatedHours} hours</span>
              </div>
            </div>

            <div className='tutor-info-inline'>
              {course.tutor.profilePictureUrl ? (
                <img
                  src={course.tutor.profilePictureUrl}
                  alt={course.tutor.firstName}
                  className='tutor-avatar'
                />
              ) : (
                <div className='tutor-avatar'>
                  {course.tutor.firstName[0]}
                  {course.tutor.lastName[0]}
                </div>
              )}
              <div>
                <p className='tutor-label'>Instructor</p>
                <p className='tutor-name'>
                  {course.tutor.firstName} {course.tutor.lastName}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className='course-tabs'>
        <div className='course-tabs-container'>
          <button
            className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            <i className='fas fa-info-circle'></i> Overview
          </button>
          {isAuthenticated && (
            <button
              className={`tab ${activeTab === 'resources' ? 'active' : ''}`}
              onClick={() => setActiveTab('resources')}
            >
              <i className='fas fa-folder-open'></i> Course Resources
            </button>
          )}
          {canManage && (
            <button
              className={`tab ${activeTab === 'participants' ? 'active' : ''}`}
              onClick={() => setActiveTab('participants')}
            >
              <i className='fas fa-users'></i> Participants
            </button>
          )}
        </div>
      </div>

      <div className='course-content-wrapper'>
        <div className='course-main-content'>
          {activeTab === 'overview' ? (
            /* Overview Section */
            <>
              <section className='course-section'>
                <h2>About This Course</h2>
                <div className='course-description'>
                  <p>{course.description}</p>
                </div>

                {course.learningOutcomes && course.learningOutcomes.length > 0 && (
                  <div className='learning-outcomes'>
                    <h3>What You'll Learn</h3>
                    <ul className='outcomes-list'>
                      {course.learningOutcomes.map((outcome, index) => (
                        <li key={index}>
                          <i className='fas fa-check-circle'></i>
                          <span>{outcome}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {course.prerequisites && (
                  <div className='prerequisites'>
                    <h3>Prerequisites</h3>
                    <p>{course.prerequisites}</p>
                  </div>
                )}

                {course.targetAudience && (
                  <div className='target-audience'>
                    <h3>Who This Course Is For</h3>
                    <p>{course.targetAudience}</p>
                  </div>
                )}

                {course.tags && course.tags.length > 0 && (
                  <div className='course-tags'>
                    <h3>Topics Covered</h3>
                    <div className='tags-list'>
                      {course.tags.map((tag, index) => (
                        <span key={index} className='tag'>
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </section>

              {/* Reviews Section */}
              <section className='course-section reviews-section'>
                <div className="reviews-header">
                  <div className="reviews-title-group">
                    <h2>Student Reviews</h2>
                    {course.reviews && course.reviews.length > 0 && (
                      <span className="review-count-badge">{course.reviews.length} reviews</span>
                    )}
                  </div>

                  {/* Only show top button if there are reviews */}
                  {/* Only show top button if there are reviews */}
                  {isEnrolled && course.reviews && course.reviews.length > 0 && (
                    <button
                      className="btn-outline btn-small"
                      onClick={() => setIsReviewModalOpen(true)}
                    >
                      <i className={`fas ${userReview ? 'fa-edit' : 'fa-pen'}`}></i> {userReview ? 'Edit Review' : 'Write a Review'}
                    </button>
                  )}
                </div>

                {course.reviews && course.reviews.length > 0 ? (
                  <div className='reviews-list'>
                    {course.reviews.map((review, index) => (
                      <div key={index} className='review-card'>
                        <div className='review-header'>
                          <div className='reviewer-info'>
                            <div className='reviewer-avatar'>
                              {review.user?.firstName?.[0] || 'S'}
                            </div>
                            <div>
                              <p className='reviewer-name'>
                                {review.user?.firstName || 'Student'}{' '}
                                {review.user?.lastName?.[0] || ''}.
                              </p>
                              <p className='review-date'>
                                {formatDate(review.createdAt)}
                              </p>
                            </div>
                          </div>
                          <div className='review-rating'>
                            {renderStars(review.rating)}
                            {user && user.id === review.userId && (
                              <button
                                className="edit-review-btn-icon"
                                onClick={() => setIsReviewModalOpen(true)}
                                title="Edit your review"
                              >
                                <i className="fas fa-pencil-alt"></i>
                              </button>
                            )}
                          </div>
                        </div>
                        <p className='review-text'>
                          {review.comment || review.review || ''}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="no-reviews-container">
                    <div className="no-reviews-icon">
                      <i className="far fa-comment-dots"></i>
                    </div>
                    <h3>No reviews yet</h3>
                    <p>Be the first student to share your experience with this course.</p>
                    {isEnrolled ? (
                      <button
                        className="btn-primary mt-4"
                        onClick={() => setIsReviewModalOpen(true)}
                      >
                        <i className={`fas ${userReview ? 'fa-edit' : 'fa-star'}`}></i> {userReview ? 'Edit Your Review' : 'Write the First Review'}
                      </button>
                    ) : (
                      <p className="text-secondary text-sm mt-2">Enroll to leave a review</p>
                    )}
                  </div>
                )}
              </section>
            </>
          ) : activeTab === 'resources' ? (
            /* Resources Tab Content */
            <CourseResourcesSection
              courseId={id}
              canManage={canManage}
              isStudent={isEnrolled}
            />
          ) : (
            /* Participants Tab Content */
            <CourseStudents courseId={id} />
          )}
        </div>

        {/* Sidebar */}
        <aside className='course-sidebar'>
          {/* Enrollment Card */}
          <div className='course-enrollment-card'>
            {isTutor || isAdmin ? (
              <button
                onClick={handleEditCourse}
                className='btn-primary btn-block'
              >
                <i className='fas fa-edit'></i> Edit Course
              </button>
            ) : isEnrolled ? (
              <button
                onClick={handleGoToCourse}
                className='btn-primary btn-block'
              >
                <i className='fas fa-play'></i> Continue Learning
              </button>
            ) : (
              <button
                onClick={handleEnroll}
                className='btn-primary btn-block'
                disabled={enrolling}
              >
                {enrolling ? (
                  <>
                    <i className='fas fa-spinner fa-spin'></i> Enrolling...
                  </>
                ) : (
                  <>
                    <i className='fas fa-book'></i> Enroll Now
                  </>
                )}
              </button>
            )}

            <div className='course-features'>
              <div className='feature-item'>
                <i className='fas fa-infinity'></i>
                <span>Lifetime access</span>
              </div>
              <div className='feature-item'>
                <i className='fas fa-mobile-alt'></i>
                <span>Access on mobile and desktop</span>
              </div>
              <div className='feature-item'>
                <i className='fas fa-book'></i>
                <span>{course.lessons?.length || 0} lessons</span>
              </div>
              <div className='feature-item'>
                <i className='fas fa-clock'></i>
                <span>{course.estimatedHours} hours of content</span>
              </div>
            </div>
          </div>

          {/* Instructor Card */}
          <div className='instructor-card'>
            <h3>Instructor</h3>
            <div className='instructor-profile'>
              {course.tutor.profilePictureUrl ? (
                <img
                  src={course.tutor.profilePictureUrl}
                  alt={course.tutor.firstName}
                  className='instructor-avatar'
                />
              ) : (
                <div className='instructor-avatar'>
                  {course.tutor.firstName[0]}
                  {course.tutor.lastName[0]}
                </div>
              )}
              <h4>
                {course.tutor.firstName} {course.tutor.lastName}
              </h4>
              {course.tutor.bio && (
                <p className='instructor-bio'>{course.tutor.bio}</p>
              )}

              <div className="instructor-contact-actions">
                {!showContactInfo ? (
                  <button
                    className="btn-contact-action"
                    onClick={() => setShowContactInfo(true)}
                    style={{ width: '100%', justifyContent: 'center' }}
                  >
                    <i className="fas fa-info-circle"></i> Show Details
                  </button>
                ) : (
                  <>
                    {course.tutor.email && (
                      <a href={`mailto:${course.tutor.email}`} className="btn-contact-action" title="Send Email">
                        <i className="fas fa-envelope"></i> {course.tutor.email}
                      </a>
                    )}
                    {course.tutor.phoneNumber && (
                      <a
                        href={`https://wa.me/${course.tutor.phoneNumber.replace(/[^0-9]/g, '')}`}
                        className="btn-contact-action"
                        title="Contact via WhatsApp"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <i className="fab fa-whatsapp"></i> {course.tutor.phoneNumber}
                      </a>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </aside>
      </div>
      <ReviewModal
        isOpen={isReviewModalOpen}
        onClose={() => setIsReviewModalOpen(false)}
        courseId={id}
        onSuccess={fetchCourseDetails}
        initialData={userReview}
      />
    </div>
  )
}

export default CourseDetail
