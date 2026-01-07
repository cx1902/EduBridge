import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuthStore } from '../../store/authStore';
import {
  FaArrowLeft,
  FaArrowRight,
  FaClock,
  FaQuestion,
  FaStopwatch,
  FaTrophy,
  FaCheck,
  FaTimes,
  FaRedo,
  FaCheckCircle
} from 'react-icons/fa';
import './QuizPlayer.css';

const QuizPlayer = ({ lessonId, onComplete }) => {
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(true);
  const [submitting, setUploading] = useState(false);
  const [quiz, setQuiz] = useState(null);
  const [gameState, setGameState] = useState('INTRO'); // INTRO, PLAYING, RESULT
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState({}); // { questionId: { selectedOptionIds: [], answerText: '' } }
  const [timeLeft, setTimeLeft] = useState(0);
  const [result, setResult] = useState(null);
  const timerRef = useRef(null);

  useEffect(() => {
    fetchQuiz();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [lessonId]);

  const fetchQuiz = async () => {
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      const response = await axios.get(
        `${API_URL}/quizzes/lesson/${lessonId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setQuiz(response.data.data.quiz);
        setTimeLeft(response.data.data.quiz.timeLimitMinutes * 60);
      }
    } catch (error) {
      console.error('Error fetching quiz:', error);
    } finally {
      setLoading(false);
    }
  };

  const startQuiz = () => {
    setGameState('PLAYING');
    if (quiz.timeLimitMinutes > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current);
            handleSubmitQuiz();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  };

  const handleAnswer = (questionId, value, type) => {
    setAnswers(prev => {
      const current = prev[questionId] || { selectedOptionIds: [], answerText: '' };

      if (type === 'MULTIPLE_CHOICE' || type === 'TRUE_FALSE') {
        return { ...prev, [questionId]: { ...current, selectedOptionIds: [value] } };
      } else if (type === 'MULTIPLE_SELECT') {
        const selected = current.selectedOptionIds.includes(value)
          ? current.selectedOptionIds.filter(id => id !== value)
          : [...current.selectedOptionIds, value];
        return { ...prev, [questionId]: { ...current, selectedOptionIds: selected } };
      } else if (type === 'SHORT_ANSWER') {
        return { ...prev, [questionId]: { ...current, answerText: value } };
      }
      return prev;
    });
  };

  const handleSubmitQuiz = async () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setUploading(true);

    try {
      const formattedAnswers = Object.entries(answers).map(([qId, val]) => ({
        questionId: qId,
        selectedOptionIds: val.selectedOptionIds,
        answerText: val.answerText
      }));

      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      const response = await axios.post(
        `${API_URL}/quizzes/${quiz.id}/attempt`,
        { answers: formattedAnswers },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        setResult(response.data.data);
        setGameState('RESULT');
        if (onComplete && response.data.data.passed) {
          onComplete(response.data.data);
        }
      }
    } catch (error) {
      console.error('Submit error:', error);
      alert('Failed to submit quiz');
    } finally {
      setUploading(false);
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (loading) return <div className="loading-spinner"></div>;
  if (!quiz) return null;

  if (gameState === 'INTRO') {
    return (
      <div className="quiz-player-container">
        <div className="quiz-intro">
          <h2>{quiz.title}</h2>
          <p className="quiz-instruction">
            {quiz.instructions || 'You are about to start a timed quiz. Make sure you are ready before proceeding.'}
          </p>

          <div className="quiz-meta-grid">
            <div className="meta-card">
              <div className="meta-icon"><FaQuestion /></div>
              <span>{quiz.questions.length} Questions</span>
              <small>Total Count</small>
            </div>
            <div className="meta-card">
              <div className="meta-icon"><FaStopwatch /></div>
              <span>{quiz.timeLimitMinutes} Min</span>
              <small>Time Limit</small>
            </div>
            <div className="meta-card">
              <div className="meta-icon"><FaTrophy /></div>
              <span>{quiz.passingPercentage}%</span>
              <small>To Pass</small>
            </div>
          </div>

          <button className="btn-primary-lg" onClick={startQuiz}>
            Start Quiz Now
          </button>
        </div>
      </div>
    );
  }

  if (gameState === 'RESULT') {
    const correctCount = result.gradingDetails?.filter(d => d.isCorrect).length || 0;
    const totalQuestions = quiz.questions.length;

    return (
      <div className="quiz-player-container">
        <div className="quiz-result">
          <div className={`result-badge ${result.passed ? 'pass' : 'fail'}`}>
            {result.passed ? <FaCheck /> : <FaTimes />}
          </div>

          <p style={{ textTransform: 'uppercase', letterSpacing: '2px', opacity: 0.7, marginBottom: '0.5rem' }}>
            Final Score
          </p>
          <h1 className="score-display">{result.scorePercentage.toFixed(0)}%</h1>
          <p className="result-msg">{result.passed ? 'Great job! You passed the quiz.' : 'Keep studying and try again!'}</p>

          <div className="result-stats-grid">
            <div className="stat-box">
              <h4>Points Earned</h4>
              <p>{result.earnedPoints || 0}</p>
            </div>
            <div className="stat-box">
              <h4>Correct Answers</h4>
              <p>{correctCount}/{totalQuestions}</p>
            </div>
          </div>

          <div className="quiz-footer" style={{ borderTop: 'none', justifyContent: 'center', gap: '1rem' }}>
            <button className="btn-nav-prev" onClick={() => window.location.reload()}>
              <FaRedo style={{ marginRight: '0.5rem' }} /> Retake
            </button>
            {result.passed && onComplete && (
              <button className="btn-primary" onClick={() => window.location.reload()}>
                Return to Lesson
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const currentAnswer = answers[currentQuestion.id] || { selectedOptionIds: [], answerText: '' };
  const progressPercent = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;

  return (
    <div className="quiz-player-container">
      {/* Header with Progress */}
      <div className="quiz-header">
        <div className="progress-container">
          <span>Question {currentQuestionIndex + 1} of {quiz.questions.length}</span>
          <div className={`timer-badge ${timeLeft < 60 ? 'warning' : ''}`}>
            <FaClock style={{ marginRight: '0.5rem' }} /> {formatTime(timeLeft)}
          </div>
        </div>
        <div className="progress-bar-track">
          <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }}></div>
        </div>
      </div>

      <div className="question-display">
        <h3 className="question-text">{currentQuestion.questionText}</h3>

        {currentQuestion.questionImageUrl && (
          <img src={currentQuestion.questionImageUrl} alt="Question" className="question-image" />
        )}

        {['MULTIPLE_CHOICE', 'TRUE_FALSE', 'MULTIPLE_SELECT'].includes(currentQuestion.questionType) && (
          <div className="answer-options">
            {currentQuestion.answerOptions.map((option, idx) => {
              const isSelected = currentAnswer.selectedOptionIds.includes(option.id);
              return (
                <div
                  key={option.id}
                  className={`answer-card ${isSelected ? 'selected' : ''}`}
                  onClick={() => handleAnswer(currentQuestion.id, option.id, currentQuestion.questionType)}
                >
                  <div className="option-key">
                    {String.fromCharCode(65 + idx)}
                  </div>
                  <div className="option-text">{option.optionText}</div>
                  <FaCheckCircle className="check-icon" />
                </div>
              );
            })}
          </div>
        )}

        {currentQuestion.questionType === 'SHORT_ANSWER' && (
          <textarea
            className="text-answer-input"
            placeholder="Type your answer here..."
            value={currentAnswer.answerText}
            onChange={(e) => handleAnswer(currentQuestion.id, e.target.value, 'SHORT_ANSWER')}
          />
        )}
      </div>

      <div className="quiz-footer">
        <button
          className="btn-nav-prev"
          disabled={currentQuestionIndex === 0}
          onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
        >
          <FaArrowLeft style={{ marginRight: '0.5rem' }} /> Previous
        </button>

        {currentQuestionIndex < quiz.questions.length - 1 ? (
          <button
            className="btn-nav-next"
            onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
          >
            Next Question
          </button>
        ) : (
          <button
            className="btn-primary"
            onClick={handleSubmitQuiz}
            disabled={submitting}
            style={{ padding: '0.75rem 2rem', borderRadius: '8px', border: 'none', background: 'var(--lesson-accent)', color: 'white', fontWeight: 600, cursor: 'pointer' }}
          >
            {submitting ? 'Submitting...' : 'Submit Quiz'}
          </button>
        )}
      </div>
    </div>
  );
};

export default QuizPlayer;
