import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import axios from 'axios';
import { useAuthStore } from '../../store/authStore';
import QuizBuilder from './QuizBuilder';
import './QuizManager.css'; // We'll reuse or create this

const QuizManager = () => {
  const { courseId } = useParams();
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [lessons, setLessons] = useState([]);
  
  // Quiz Builder State
  const [showQuizBuilder, setShowQuizBuilder] = useState(false);
  const [currentLessonForQuiz, setCurrentLessonForQuiz] = useState(null);
  const [existingQuiz, setExistingQuiz] = useState(null);

  useEffect(() => {
    if (courseId) {
      fetchLessons();
    }
  }, [courseId]);

  const fetchLessons = async () => {
    try {
      setLoading(true);
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      const response = await axios.get(
        `${API_URL}/tutor/courses/${courseId}/lessons`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setLessons(response.data);
    } catch (error) {
      console.error('Error fetching lessons:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleManageQuiz = async (lesson) => {
    setCurrentLessonForQuiz(lesson);
    setExistingQuiz(null); 
    
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      const response = await axios.get(
        `${API_URL}/quizzes/lesson/${lesson.id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      if (response.data.success && response.data.data.quiz) {
        setExistingQuiz(response.data.data.quiz);
      }
    } catch (error) {
      if (error.response && error.response.status !== 404) {
        console.error('Error fetching quiz:', error);
      }
    }

    setShowQuizBuilder(true);
  };

  return (
    <div className="quiz-manager">
      <div className="manager-header">
        <h3>Course Quizzes</h3>
        <p>Manage quizzes for each lesson in your course.</p>
      </div>

      {loading ? (
        <div className="loading">Loading lessons...</div>
      ) : lessons.length === 0 ? (
        <div className="empty-state">
          <i className="fas fa-book-open"></i>
          <p>No lessons found. Please add lessons in the Curriculum tab first.</p>
        </div>
      ) : (
        <div className="quiz-lessons-list">
          {lessons.map((lesson) => (
            <div key={lesson.id} className="quiz-lesson-item">
              <div className="lesson-info">
                <span className="lesson-order">{lesson.sequenceOrder}.</span>
                <span className="lesson-title">{lesson.title}</span>
              </div>
              <div className="quiz-status">
                {lesson._count?.quizzes > 0 ? (
                  <span className="badge badge-success">
                    <i className="fas fa-check"></i> Quiz Active
                  </span>
                ) : (
                  <span className="badge badge-neutral">No Quiz</span>
                )}
              </div>
              <div className="lesson-actions">
                <button
                  className="btn-secondary btn-sm"
                  onClick={() => handleManageQuiz(lesson)}
                >
                  <i className="fas fa-edit"></i> {lesson._count?.quizzes > 0 ? 'Edit Quiz' : 'Create Quiz'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showQuizBuilder && (
        <QuizBuilder
          lessonId={currentLessonForQuiz?.id}
          existingQuiz={existingQuiz}
          onClose={() => setShowQuizBuilder(false)}
          onSave={() => {
            fetchLessons(); 
          }}
        />
      )}
    </div>
  );
};

export default QuizManager;
