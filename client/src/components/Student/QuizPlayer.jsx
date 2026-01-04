import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuthStore } from '../../store/authStore';
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
          <p>{quiz.instructions || 'Answer all questions to the best of your ability.'}</p>
          
          <div className="quiz-meta">
            <div className="meta-item">
              <i className="fas fa-question-circle"></i>
              <span>{quiz.questions.length} Questions</span>
            </div>
            <div className="meta-item">
              <i className="fas fa-clock"></i>
              <span>{quiz.timeLimitMinutes} Minutes</span>
            </div>
            <div className="meta-item">
              <i className="fas fa-trophy"></i>
              <span>Pass: {quiz.passingPercentage}%</span>
            </div>
          </div>

          <button className="btn-primary btn-large" onClick={startQuiz}>
            Start Quiz
          </button>
        </div>
      </div>
    );
  }

  if (gameState === 'RESULT') {
    return (
      <div className="quiz-player-container">
        <div className="quiz-result">
          <div className={`result-icon ${result.passed ? 'pass' : 'fail'}`}>
            <i className={`fas ${result.passed ? 'fa-check-circle' : 'fa-times-circle'}`}></i>
          </div>
          
          <h2 className="score-display">{result.scorePercentage.toFixed(0)}%</h2>
          <p className="score-label">{result.passed ? 'You Passed!' : 'Please Try Again'}</p>

          <div className="result-stats">
            <div className="result-stat">
              <h4>Points Earned</h4>
              <p>{result.pointsEarned}</p>
            </div>
            <div className="result-stat">
              <h4>Correct Answers</h4>
              <p>{result.scorePercentage >= 100 ? quiz.questions.length : '—'}</p>
            </div>
          </div>

          <div className="quiz-footer" style={{justifyContent: 'center'}}>
            <button className="btn-primary" onClick={() => window.location.reload()}>
              {result.passed ? 'Return to Lesson' : 'Retake Quiz'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const currentAnswer = answers[currentQuestion.id] || { selectedOptionIds: [], answerText: '' };

  return (
    <div className="quiz-player-container">
      <div className="quiz-header">
        <span className="progress-indicator">
          Question {currentQuestionIndex + 1} of {quiz.questions.length}
        </span>
        <div className={`timer ${timeLeft < 60 ? 'warning' : ''}`}>
          <i className="fas fa-clock"></i>
          {formatTime(timeLeft)}
        </div>
      </div>

      <div className="question-display">
        <h3 className="question-text">{currentQuestion.questionText}</h3>
        
        {currentQuestion.questionImageUrl && (
          <img src={currentQuestion.questionImageUrl} alt="Question" className="question-image" />
        )}

        {['MULTIPLE_CHOICE', 'TRUE_FALSE', 'MULTIPLE_SELECT'].includes(currentQuestion.questionType) && (
          <div className="answer-options">
            {currentQuestion.answerOptions.map(option => (
              <div 
                key={option.id}
                className={`answer-option-btn ${currentAnswer.selectedOptionIds.includes(option.id) ? 'selected' : ''}`}
                onClick={() => handleAnswer(currentQuestion.id, option.id, currentQuestion.questionType)}
              >
                <div className="option-marker"></div>
                <span>{option.optionText}</span>
              </div>
            ))}
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
          className="btn-secondary"
          disabled={currentQuestionIndex === 0}
          onClick={() => setCurrentQuestionIndex(prev => prev - 1)}
        >
          Previous
        </button>
        
        {currentQuestionIndex < quiz.questions.length - 1 ? (
          <button 
            className="btn-primary"
            onClick={() => setCurrentQuestionIndex(prev => prev + 1)}
          >
            Next
          </button>
        ) : (
          <button 
            className="btn-primary"
            onClick={handleSubmitQuiz}
            disabled={submitting}
          >
            {submitting ? 'Submitting...' : 'Submit Quiz'}
          </button>
        )}
      </div>
    </div>
  );
};

export default QuizPlayer;
