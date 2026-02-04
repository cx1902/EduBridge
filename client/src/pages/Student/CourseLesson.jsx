import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuthStore } from '../../store/authStore';
import QuizPlayer from '../../components/Student/QuizPlayer';
import GamificationToast from '../../components/Student/GamificationToast';
import ComprehensionQuiz from '../../components/Student/ComprehensionQuiz';
import { FaArrowLeft, FaArrowRight, FaCheckCircle, FaPlayCircle, FaBookOpen, FaClock, FaSignal, FaTag, FaQuestionCircle, FaFileAlt, FaBars, FaTimes, FaChevronDown, FaChevronRight, FaVideo, FaFileDownload, FaExternalLinkAlt } from 'react-icons/fa';
import './CourseLesson.css';


const CourseLesson = () => {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();
  const { token, checkAuth } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [lesson, setLesson] = useState(null);
  const [activeTab, setActiveTab] = useState('content');
  const [hasQuiz, setHasQuiz] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastData, setToastData] = useState({ xpGained: 0, newBadges: [] });
  const [completing, setCompleting] = useState(false);

  // Session tracking
  const [sessionId, setSessionId] = useState(null);
  const [sessionStartTime, setSessionStartTime] = useState(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);

  // Comprehension quiz
  const [comprehensionQuestions, setComprehensionQuestions] = useState([]);
  const [showComprehensionQuiz, setShowComprehensionQuiz] = useState(false);

  // New state for sidebar
  const [courseComponents, setCourseComponents] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [flatLessons, setFlatLessons] = useState([]);
  const [nextLessonId, setNextLessonId] = useState(null);
  const [prevLessonId, setPrevLessonId] = useState(null);
  const [expandedModules, setExpandedModules] = useState({});

  useEffect(() => {
    if (courseId) {
      fetchCourseComponents();
    }
  }, [courseId]);

  useEffect(() => {
    if (lessonId === 'first' && courseId) {
      // Redirect handled by fetchFirstLesson logic which is now integrated or via component check
      // Actually keeping fetchFirstLesson for 'first' case support
      fetchFirstLesson();
    } else if (lessonId) {
      fetchLessonDetails();
    }
  }, [lessonId, courseId]);

  // Calculate Next/Prev when lesson or flatLessons change
  useEffect(() => {
    if (lesson && flatLessons.length > 0) {
      const currentIndex = flatLessons.findIndex(l => l.id === lesson.id);
      if (currentIndex !== -1) {
        setPrevLessonId(currentIndex > 0 ? flatLessons[currentIndex - 1].id : null);
        setNextLessonId(currentIndex < flatLessons.length - 1 ? flatLessons[currentIndex + 1].id : null);
      }
    }
  }, [lesson, flatLessons]);

  // Session timer effect
  useEffect(() => {
    if (!lessonId || lessonId === 'first') return;

    // Start timer
    const startTime = Date.now();
    setSessionStartTime(startTime);
    startLessonSession();

    // Update elapsed time every second
    const interval = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - startTime) / 1000));
    }, 1000);

    // Cleanup: end session on unmount
    return () => {
      clearInterval(interval);
      if (sessionId) {
        endLessonSession(Math.floor((Date.now() - startTime) / 1000));
      }
    };
  }, [lessonId]);

  const fetchCourseComponents = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      const response = await axios.get(
        `${API_URL}/courses/${courseId}/components`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        const components = response.data.data;
        setCourseComponents(components);

        // Flatten lessons for navigation
        const flat = [];
        const expanded = {};

        components.forEach(comp => {
          if (comp.componentType === 'MODULE') {
            expanded[comp.id] = true; // Default expand all modules
            if (comp.lessons) {
              comp.lessons.forEach(l => flat.push(l));
            }
          } else if (comp.componentType === 'LESSON') {
            flat.push(comp);
          }
        });
        setFlatLessons(flat);
        setExpandedModules(expanded);
      }
    } catch (err) {
      console.error('Failed to fetch components:', err);
    }
  };

  const fetchFirstLesson = async () => {
    try {
      setLoading(true);
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

      const res = await axios.get(
        `${API_URL}/lessons/first/${courseId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success && res.data.data) {
        navigate(`/student/courses/${courseId}/lesson/${res.data.data.id}`, { replace: true });
      } else {
        throw new Error('No lessons found');
      }
    } catch (error) {
      console.error('Error fetching first lesson:', error);
      setLoading(false);
    }
  };

  const fetchLessonDetails = async () => {
    try {
      setLoading(true);
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

      // 1. Fetch Lesson Content
      const lessonRes = await axios.get(
        `${API_URL}/lessons/${lessonId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Handle response structure { success: true, data: { lesson: {...} } }
      if (lessonRes.data.success) {
        setLesson(lessonRes.data.data.lesson);
      } else {
        throw new Error(lessonRes.data.error?.message || 'Failed to load lesson');
      }

      // 2. Check for Quiz
      try {
        const quizRes = await axios.get(
          `${API_URL}/quizzes/lesson/${lessonId}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        if (quizRes.data.success) {
          setHasQuiz(true);
        }
      } catch (err) {
        // 404 means no quiz, which is fine
        setHasQuiz(false);
      }

    } catch (error) {
      console.error('Error loading lesson:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuizComplete = (result) => {
    // Show celebration toast if passed
    if (result.passed) {
      // Check for XP gained/badges in result (Quiz Controller response structure)
      // Quiz controller returns 'earnedPoints' and 'badgesEarned'
      const earnedPoints = result.earnedPoints || result.xpGained || 0;
      const badges = result.badgesEarned || result.newBadges || [];

      if (earnedPoints > 0 || badges.length > 0) {
        setToastData({ xpGained: earnedPoints, newBadges: badges });
        setShowToast(true);
        // Also refresh user data to show new XP in navbar
        checkAuth();
      }
    }
  };

  const startLessonSession = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      const res = await axios.post(
        `${API_URL}/lessons/${lessonId}/session/start`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (res.data.success) {
        setSessionId(res.data.data.sessionId);
      }
    } catch (error) {
      console.error('Error starting session:', error);
    }
  };

  const endLessonSession = async (timeSpent) => {
    if (!sessionId) return;
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      await axios.post(
        `${API_URL}/lessons/${lessonId}/session/end`,
        { sessionId, timeSpent },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (error) {
      console.error('Error ending session:', error);
    }
  };

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hrs > 0) {
      return `${hrs}h ${mins}m ${secs}s`;
    }
    return `${mins}m ${secs}s`;
  };

  const initiateCompletion = async () => {
    // Check if lesson has comprehension questions
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      const res = await axios.get(
        `${API_URL}/comprehension/lesson/${lessonId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success && res.data.data.length > 0) {
        // Has questions - show quiz
        setComprehensionQuestions(res.data.data);
        setShowComprehensionQuiz(true);
      } else {
        // No questions - show confirmation dialog
        setShowConfirmDialog(true);
      }
    } catch (error) {
      console.error('Error fetching questions:', error);
      // No questions or error - proceed with confirmation
      setShowConfirmDialog(true);
    }
  };

  const handleQuizSubmit = async (answers) => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      const res = await axios.post(
        `${API_URL}/comprehension/lesson/${lessonId}/submit`,
        { answers },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        // Return results to quiz component
        return res.data.data;
      }
    } catch (error) {
      console.error('Error submitting quiz:', error);
      alert('Failed to submit quiz answers');
      return null;
    }
  };

  const handleComprehensionQuizComplete = () => {
    // Close quiz and show confirmation dialog
    setShowComprehensionQuiz(false);
    setShowConfirmDialog(true);
  };

  const handleLessonComplete = async () => {
    if (lesson.progress?.completed) return;

    setShowConfirmDialog(false);

    try {
      setCompleting(true);
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      const res = await axios.post(
        `${API_URL}/lessons/${lesson.id}/complete`,
        { timeSpent: elapsedTime },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        // Refresh user profile in store to update XP/points
        checkAuth();

        const { xpGained, newBadges, alreadyCompleted } = res.data.data;
        if (!alreadyCompleted) {
          setToastData({ xpGained, newBadges });
          setShowToast(true);
          setLesson(prev => ({ ...prev, progress: { ...prev.progress, completed: true } }));
        } else {
          alert('Lesson already completed!');
          navigate(`/courses/${courseId}`);
        }
      }
    } catch (error) {
      console.error('Error completing lesson:', error);
      alert('Failed to mark lesson as complete');
    } finally {
      setCompleting(false);
    }
  };

  const handleModuleToggle = (moduleId) => {
    setExpandedModules(prev => ({
      ...prev,
      [moduleId]: !prev[moduleId]
    }));
  };

  if (loading) return (
    <div className="course-lesson-page">
      <div className="loading-spinner"></div>
    </div>
  );

  if (!lesson && !loading) {
    return (
      <div className="course-lesson-page">
        <div className="error-message">
          <FaExternalLinkAlt size={32} />
          <p>Lesson not found or course has no content.</p>
          <button className="btn-nav-secondary" onClick={() => navigate(`/courses/${courseId}`)}>
            Return to Course
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="course-lesson-page">
      <div className="course-lesson-layout">
        {/* Sidebar */}
        {/* Sidebar removed for focused view */}

        {/* Main Content */}
        <main className="lesson-main-content">
          {/* Header Bar within content area if sidebar closed, or just floating toggle */}
          {/* Toggle button removed */}

          {/* Tabs Bar - Sticky */}
          {hasQuiz && (
            <div className="lesson-tabs-container">
              <div className="lesson-tabs-wrapper">
                <button
                  className={`tab-pill ${activeTab === 'content' ? 'active' : ''}`}
                  onClick={() => setActiveTab('content')}
                >
                  <FaBookOpen style={{ marginRight: '8px' }} />
                  Lesson Content
                </button>
                <button
                  className={`tab-pill ${activeTab === 'quiz' ? 'active' : ''}`}
                  onClick={() => setActiveTab('quiz')}
                >
                  <FaQuestionCircle style={{ marginRight: '8px' }} />
                  Quiz
                </button>
              </div>
            </div>
          )}

          <div className="lesson-content-wrapper">

            {/* Breadcrumbs / Back */}
            <div className="lesson-hero-header">
              <div className="breadcrumbs">
                <button className="btn-back-link" onClick={() => navigate(`/courses/${courseId}`)}>
                  <FaArrowLeft /> Back to Course
                </button>
                <span>/</span>
                <span>{lesson.title}</span>
              </div>
              <h1 className="lesson-title-large">{lesson.title}</h1>
              <div className="lesson-meta-bar">
                {lesson.difficulty && (
                  <div className="meta-pill">
                    <FaSignal /> {lesson.difficulty}
                  </div>
                )}
                {lesson.estimatedDuration && (
                  <div className="meta-pill">
                    <FaClock /> {lesson.estimatedDuration} min
                  </div>
                )}
                <div className="meta-pill">
                  <FaTag /> {lesson.type.replace('_', ' ')}
                </div>
                <div className="meta-pill session-timer">
                  <FaClock /> Time: {formatTime(elapsedTime)}
                </div>
              </div>
            </div>

            {activeTab === 'content' ? (
              <div className="content-card">
                {/* Video Section - Full Width in Card */}
                {(lesson.videoUrl || lesson.type === 'VIDEO_LINK') && (
                  <div className="video-feature-container">
                    {lesson.videoUrl && lesson.videoUrl.includes('youtube') ? (
                      <iframe
                        src={lesson.videoUrl.replace('watch?v=', 'embed/')}
                        title={lesson.title}
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      ></iframe>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: 'white' }}>
                        <FaVideo size={48} style={{ marginBottom: '1rem', opacity: 0.5 }} />
                        <p>External Video Resource</p>
                        <a href={lesson.videoUrl} target="_blank" rel="noopener noreferrer" className="btn-nav-primary">
                          Watch Video <FaExternalLinkAlt style={{ marginLeft: '0.5rem' }} />
                        </a>
                      </div>
                    )}
                  </div>
                )}

                <div className="content-padding">
                  {/* File Attachment */}
                  {lesson.type === 'FILE' && (
                    <div className="resource-card">
                      <div className="resource-icon">
                        <FaFileDownload />
                      </div>
                      <div style={{ flex: 1 }}>
                        <h3 style={{ margin: '0 0 0.25rem 0', color: '#fff' }}>{lesson.fileName || 'Learning Material'}</h3>
                        <p style={{ margin: 0, fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)' }}>Click to download code, slides, or documents.</p>
                      </div>
                      <a href={lesson.fileUrl} target="_blank" rel="noopener noreferrer" className="btn-nav-outline" style={{ borderColor: 'var(--lesson-sidebar-border)' }}>
                        Download Resource
                      </a>
                    </div>
                  )}

                  {/* Rich HTML Content */}
                  <div className="rich-text-content" dangerouslySetInnerHTML={{ __html: lesson.content }} />
                </div>
              </div>
            ) : (
              /* Quiz View - Already styled via QuizPlayer, ensuring it fits */
              <div className="content-card" style={{ padding: '0', background: 'transparent', border: 'none', boxShadow: 'none' }}>
                <QuizPlayer lessonId={lessonId} onComplete={handleQuizComplete} />
              </div>
            )}

          </div>

          {/* Fixed Footer Nav */}
          <div className="lesson-footer">
            <button
              className="btn-nav-prev"
              onClick={() => prevLessonId && navigate(`/student/courses/${courseId}/lesson/${prevLessonId}`)}
              disabled={!prevLessonId}
            >
              <FaArrowLeft /> Previous
            </button>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                className={`btn-complete ${lesson.progress?.completed ? 'completed' : ''}`}
                onClick={lesson.progress?.completed ? null : initiateCompletion}
                disabled={lesson.progress?.completed || completing}
              >
                {lesson.progress?.completed ? (
                  <>Completed <FaCheckCircle style={{ marginLeft: '0.5rem' }} /></>
                ) : (
                  <>{completing ? 'Completing...' : 'Mark Complete'}</>
                )}
              </button>

              <button
                className="btn-nav-next"
                onClick={() => nextLessonId && navigate(`/student/courses/${courseId}/lesson/${nextLessonId}`)}
                disabled={!nextLessonId}
              >
                Next <FaArrowRight style={{ marginLeft: '0.5rem' }} />
              </button>
            </div>
          </div>
        </main>
      </div>

      {/* Completion Confirmation Dialog */}
      {showConfirmDialog && (
        <div className="modal-overlay" onClick={() => setShowConfirmDialog(false)}>
          <div className="confirm-modal" onClick={(e) => e.stopPropagation()}>
            <h3>Complete Lesson?</h3>
            <p>Are you sure you've learned through the lesson?</p>
            <p className="timer-info">
              You've spent <strong>{formatTime(elapsedTime)}</strong> on this lesson.
            </p>
            <div className="modal-actions">
              <button
                className="btn-secondary"
                onClick={() => setShowConfirmDialog(false)}
              >
                Not Yet
              </button>
              <button
                className="btn-primary"
                onClick={handleLessonComplete}
              >
                Yes, Complete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Comprehension Quiz Modal */}
      {showComprehensionQuiz && comprehensionQuestions.length > 0 && (
        <ComprehensionQuiz
          lessonId={lessonId}
          questions={comprehensionQuestions}
          onSubmit={handleQuizSubmit}
          onCancel={handleComprehensionQuizComplete}
        />
      )}

      {showToast && (
        <GamificationToast
          xpGained={toastData.xpGained}
          newBadges={toastData.newBadges}
          onClose={() => {
            setShowToast(false);
            navigate(`/courses/${courseId}`);
          }}
        />
      )}
    </div>
  );
};

export default CourseLesson;
