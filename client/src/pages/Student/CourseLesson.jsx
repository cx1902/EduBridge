import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuthStore } from '../../store/authStore';
import QuizPlayer from '../../components/Student/QuizPlayer';
import './CourseLesson.css'; // I'll assume I need to create this or it exists (if not I'll create inline styles or new file)

const CourseLesson = () => {
  const { courseId, lessonId } = useParams();
  const navigate = useNavigate();
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [lesson, setLesson] = useState(null);
  const [activeTab, setActiveTab] = useState('content');
  const [hasQuiz, setHasQuiz] = useState(false);

  useEffect(() => {
    if (lessonId === 'first' && courseId) {
      fetchFirstLesson();
    } else if (lessonId) {
      fetchLessonDetails();
    }
  }, [lessonId, courseId]);

  const fetchFirstLesson = async () => {
    try {
      setLoading(true);
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      
      const res = await axios.get(
        `${API_URL}/lessons/first/${courseId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success && res.data.data) {
        // Navigate to the actual lesson ID
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
    // Optionally refresh progress or show celebration
    console.log('Quiz completed:', result);
  };

  if (loading) return <div className="loading-spinner"></div>;
  if (!lesson && !loading) {
     if (lessonId === 'first') return <div className="error-message">No lessons available for this course yet.</div>;
     return <div className="error-message">Lesson not found</div>;
  }

  return (
    <div className="course-lesson-page">
      <div className="lesson-container">
        <div className="lesson-header-nav">
          <button className="btn-back" onClick={() => navigate(-1)}>
            <i className="fas fa-arrow-left"></i> Back
          </button>
          <h1>{lesson.title}</h1>
        </div>

        <div className="lesson-tabs">
          <button 
            className={`tab-btn ${activeTab === 'content' ? 'active' : ''}`}
            onClick={() => setActiveTab('content')}
          >
            <i className="fas fa-book-open"></i> Lesson Content
          </button>
          {hasQuiz && (
            <button 
              className={`tab-btn ${activeTab === 'quiz' ? 'active' : ''}`}
              onClick={() => setActiveTab('quiz')}
            >
              <i className="fas fa-question-circle"></i> Quiz
            </button>
          )}
        </div>

        <div className="lesson-content-area">
          {activeTab === 'content' ? (
            <div className="content-viewer">
              {lesson.videoUrl && (
                <div className="video-wrapper">
                  {/* Basic iframe support for now */}
                  <iframe 
                    src={lesson.videoUrl.replace('watch?v=', 'embed/')} 
                    title="Lesson Video"
                    frameBorder="0"
                    allowFullScreen
                  ></iframe>
                </div>
              )}
              
              <div className="text-content">
                <h3>Learning Objectives</h3>
                <p>{lesson.learningObjectives}</p>
                
                <hr />
                
                <div dangerouslySetInnerHTML={{ __html: lesson.content }} />
              </div>
            </div>
          ) : (
            <div className="quiz-viewer">
              <QuizPlayer lessonId={lessonId} onComplete={handleQuizComplete} />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseLesson;
