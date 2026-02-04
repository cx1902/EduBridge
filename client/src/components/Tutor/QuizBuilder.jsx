import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuthStore } from '../../store/authStore';
import './QuizBuilder.css';

const QUESTION_TYPES = {
  MULTIPLE_CHOICE: 'Multiple Choice',
  SHORT_ANSWER: 'Short Answer',
  TRUE_FALSE: 'True/False',
  MULTIPLE_SELECT: 'Multiple Select'
};

const QuizBuilder = ({ lessonId, onClose, existingQuiz, onSave }) => {
  const { token } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Quiz Level State
  const [quizData, setQuizData] = useState({
    title: '',
    instructions: '',
    timeLimitMinutes: 30,
    passingPercentage: 70,
    maxAttempts: 3,
    pointsOnPass: 100,
    shuffleQuestions: true,
    shuffleAnswers: true,
    immediateFeedback: false,
    questions: []
  });

  // Load existing quiz data if available
  useEffect(() => {
    if (existingQuiz) {
      setQuizData({
        ...existingQuiz,
        questions: existingQuiz.questions.map(q => ({
          ...q,
          // Ensure options exist
          answerOptions: q.answerOptions || []
        }))
      });
    }
  }, [existingQuiz]);

  const handleQuizChange = (e) => {
    const { name, value, type, checked } = e.target;
    setQuizData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Question Management
  const addQuestion = () => {
    setQuizData(prev => ({
      ...prev,
      questions: [
        ...prev.questions,
        {
          id: `temp-${Date.now()}`, // Temporary ID for UI key
          questionText: '',
          questionType: 'MULTIPLE_CHOICE',
          questionImageUrl: '',
          points: 10,
          explanation: '',
          answerOptions: [
            { optionText: '', isCorrect: false },
            { optionText: '', isCorrect: false }
          ]
        }
      ]
    }));
  };

  const removeQuestion = (index) => {
    setQuizData(prev => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index)
    }));
  };

  const updateQuestion = (index, field, value) => {
    setQuizData(prev => {
      const newQuestions = [...prev.questions];
      newQuestions[index] = { ...newQuestions[index], [field]: value };

      // Reset options if type changes to T/F
      if (field === 'questionType' && value === 'TRUE_FALSE') {
        newQuestions[index].answerOptions = [
          { optionText: 'True', isCorrect: true },
          { optionText: 'False', isCorrect: false }
        ];
      }

      return { ...prev, questions: newQuestions };
    });
  };

  // Option Management
  const addOption = (qIndex) => {
    setQuizData(prev => {
      const newQuestions = [...prev.questions];
      newQuestions[qIndex].answerOptions.push({ optionText: '', isCorrect: false });
      return { ...prev, questions: newQuestions };
    });
  };

  const removeOption = (qIndex, oIndex) => {
    setQuizData(prev => {
      const newQuestions = [...prev.questions];
      newQuestions[qIndex].answerOptions = newQuestions[qIndex].answerOptions.filter((_, i) => i !== oIndex);
      return { ...prev, questions: newQuestions };
    });
  };

  const updateOption = (qIndex, oIndex, field, value) => {
    setQuizData(prev => {
      const newQuestions = [...prev.questions];
      const question = newQuestions[qIndex];

      if (field === 'isCorrect') {
        if (question.questionType === 'MULTIPLE_CHOICE' || question.questionType === 'TRUE_FALSE') {
          // Uncheck others for single select
          question.answerOptions.forEach((opt, i) => {
            opt.isCorrect = i === oIndex;
          });
        } else {
          // Toggle for multi select
          question.answerOptions[oIndex].isCorrect = value;
        }
      } else {
        question.answerOptions[oIndex][field] = value;
      }

      return { ...prev, questions: newQuestions };
    });
  };

  // Image Upload
  const handleImageUpload = async (file, qIndex) => {
    if (!file) return;

    try {
      setUploading(true);
      const formData = new FormData();
      formData.append('image', file);

      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      const response = await axios.post(`${API_URL}/upload/image`, formData, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        updateQuestion(qIndex, 'questionImageUrl', response.data.data.url);
      }
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    // Basic Validation
    if (!quizData.title) {
      alert('Please enter a quiz title');
      return;
    }
    if (quizData.questions.length === 0) {
      alert('Please add at least one question');
      return;
    }

    // Validate Questions
    for (let i = 0; i < quizData.questions.length; i++) {
      const q = quizData.questions[i];
      if (!q.questionText) {
        alert(`Question ${i + 1} is missing text`);
        return;
      }

      if (['MULTIPLE_CHOICE', 'TRUE_FALSE', 'MULTIPLE_SELECT'].includes(q.questionType)) {
        if (q.answerOptions.length < 2) {
          alert(`Question ${i + 1} needs at least 2 options`);
          return;
        }
        const hasCorrect = q.answerOptions.some(o => o.isCorrect);
        if (!hasCorrect) {
          alert(`Question ${i + 1} needs a correct answer selected`);
          return;
        }
      }
    }

    try {
      setLoading(true);
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

      let authToken = token;
      if (!authToken) {
        // Fallback to local storage if store is empty (e.g. after refresh)
        const stored = localStorage.getItem('auth-storage') || sessionStorage.getItem('auth-storage');
        if (stored) {
          const parsed = JSON.parse(stored);
          authToken = parsed.token;
        }
      }

      if (!authToken) {
        alert('Authentication lost. Please login again.');
        return;
      }

      const config = { headers: { Authorization: `Bearer ${authToken}` } };

      let response;
      if (existingQuiz) {
        response = await axios.put(`${API_URL}/quizzes/${existingQuiz.id}`, quizData, config);
      } else {
        response = await axios.post(`${API_URL}/quizzes/lesson/${lessonId}`, quizData, config);
      }

      if (response.data.success) {
        onSave();
        onClose();
      }
    } catch (error) {
      console.error('Save quiz error:', error);
      alert(error.response?.data?.error?.message || 'Failed to save quiz');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="quiz-builder-overlay">
      <div className="quiz-builder-modal">
        <div className="quiz-builder-header">
          <h2>{existingQuiz ? 'Edit Quiz' : 'Create Quiz'}</h2>
          <button className="btn-close" onClick={onClose}>&times;</button>
        </div>

        <div className="quiz-builder-content">
          {/* Settings Panel */}
          <div className="quiz-settings-panel">
            <h3>Quiz Settings</h3>
            <div className="form-group">
              <label>Quiz Title</label>
              <input
                type="text"
                name="title"
                value={quizData.title}
                onChange={handleQuizChange}
                placeholder="e.g., Chapter 1 Assessment"
              />
            </div>

            <div className="form-group" style={{ marginTop: '1rem' }}>
              <label>Instructions</label>
              <textarea
                name="instructions"
                value={quizData.instructions}
                onChange={handleQuizChange}
                rows={2}
              />
            </div>

            <div className="settings-grid">
              <div className="form-group">
                <label>Time Limit (mins)</label>
                <input
                  type="number"
                  name="timeLimitMinutes"
                  value={quizData.timeLimitMinutes}
                  onChange={handleQuizChange}
                />
              </div>
              <div className="form-group">
                <label>Passing Score (%)</label>
                <input
                  type="number"
                  name="passingPercentage"
                  value={quizData.passingPercentage}
                  onChange={handleQuizChange}
                />
              </div>
              <div className="form-group">
                <label>Max Attempts</label>
                <input
                  type="number"
                  name="maxAttempts"
                  value={quizData.maxAttempts}
                  onChange={handleQuizChange}
                />
              </div>
              <div className="form-group">
                <label>Total Quiz Points</label>
                <input
                  type="text"
                  value={quizData.questions.reduce((sum, q) => sum + (parseInt(q.points) || 0), 0)}
                  disabled
                  className="input-disabled"
                />
              </div>
              <div className="form-group">
                <label>XP Reward</label>
                <input
                  type="number"
                  name="pointsOnPass"
                  value={quizData.pointsOnPass}
                  onChange={handleQuizChange}
                  title="Points awarded to student for passing/gamification"
                />
              </div>
            </div>
          </div>

          {/* Questions Section */}
          <div className="questions-section">
            <div className="section-header">
              <h3>Questions ({quizData.questions.length})</h3>
              <button className="btn-primary btn-small" onClick={addQuestion}>
                <i className="fas fa-plus"></i> Add Question
              </button>
            </div>

            {quizData.questions.map((question, qIndex) => (
              <div key={question.id || qIndex} className="question-card">
                <div className="question-header">
                  <span className="question-number">Question {qIndex + 1}</span>
                  <div className="question-actions">
                    <button className="btn-icon delete" onClick={() => removeQuestion(qIndex)}>
                      <i className="fas fa-trash"></i>
                    </button>
                  </div>
                </div>

                <div className="settings-grid" style={{ marginBottom: '1rem' }}>
                  <div className="form-group">
                    <label>Type</label>
                    <select
                      value={question.questionType}
                      onChange={(e) => updateQuestion(qIndex, 'questionType', e.target.value)}
                    >
                      {Object.entries(QUESTION_TYPES).map(([key, label]) => (
                        <option key={key} value={key}>{label}</option>
                      ))}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Points</label>
                    <input
                      type="number"
                      value={question.points}
                      onChange={(e) => updateQuestion(qIndex, 'points', e.target.value)}
                      onWheel={(e) => e.target.blur()}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label>Question Text</label>
                  <textarea
                    value={question.questionText}
                    onChange={(e) => updateQuestion(qIndex, 'questionText', e.target.value)}
                    rows={2}
                  />
                </div>

                {/* Image Upload */}
                <div className="form-group" style={{ marginTop: '1rem' }}>
                  <label>Question Image (Optional)</label>
                  {question.questionImageUrl ? (
                    <div className="image-preview-container">
                      <img src={question.questionImageUrl} alt="Question" className="image-preview" />
                      <button
                        className="btn-remove-image"
                        onClick={() => updateQuestion(qIndex, 'questionImageUrl', '')}
                      >
                        <i className="fas fa-times"></i>
                      </button>
                    </div>
                  ) : (
                    <div className="upload-btn-wrapper">
                      <button className="btn-upload">
                        {uploading ? <i className="fas fa-spinner fa-spin"></i> : <i className="fas fa-image"></i>}
                        Upload Image
                      </button>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleImageUpload(e.target.files[0], qIndex)}
                        disabled={uploading}
                      />
                    </div>
                  )}
                </div>

                {/* Answer Options */}
                {['MULTIPLE_CHOICE', 'MULTIPLE_SELECT', 'TRUE_FALSE'].includes(question.questionType) && (
                  <div className="options-list">
                    <label>Answer Options (Check correct answers)</label>
                    {question.answerOptions.map((option, oIndex) => (
                      <div key={oIndex} className="option-item">
                        <input
                          type={question.questionType === 'MULTIPLE_SELECT' ? 'checkbox' : 'radio'}
                          name={`q-${qIndex}-correct`}
                          checked={option.isCorrect}
                          onChange={(e) => updateOption(qIndex, oIndex, 'isCorrect', e.target.checked)}
                          className="option-radio"
                        />
                        <input
                          type="text"
                          value={option.optionText}
                          onChange={(e) => updateOption(qIndex, oIndex, 'optionText', e.target.value)}
                          placeholder={`Option ${oIndex + 1}`}
                          readOnly={question.questionType === 'TRUE_FALSE'}
                        />
                        {question.questionType !== 'TRUE_FALSE' && (
                          <button className="btn-icon delete" onClick={() => removeOption(qIndex, oIndex)}>
                            <i className="fas fa-times"></i>
                          </button>
                        )}
                      </div>
                    ))}
                    {question.questionType !== 'TRUE_FALSE' && (
                      <button className="btn-add-option" onClick={() => addOption(qIndex)}>
                        + Add Option
                      </button>
                    )}
                  </div>
                )}

                {question.questionType === 'SHORT_ANSWER' && (
                  <div className="options-list">
                    <label>Correct Answer (Exact match)</label>
                    {question.answerOptions.length > 0 ? (
                      <div className="option-item">
                        <input
                          type="text"
                          value={question.answerOptions[0].optionText}
                          onChange={(e) => updateOption(qIndex, 0, 'optionText', e.target.value)}
                          placeholder="Enter the correct answer..."
                        />
                        {/* Ensure isCorrect is true for short answer reference */}
                        {/* We do this implicitly on save or init, but good to be explicit */}
                      </div>
                    ) : (
                      <button className="btn-add-option" onClick={() => {
                        updateQuestion(qIndex, 'answerOptions', [{ optionText: '', isCorrect: true }]);
                      }}>
                        Set Correct Answer
                      </button>
                    )}
                  </div>
                )}
              </div>
            ))}

            {/* Add Question Button at Bottom */}
            <div className="add-question-bottom">
              <button className="btn-add-question-block" onClick={addQuestion}>
                <i className="fas fa-plus-circle"></i> Add New Question
              </button>
            </div>
          </div>
        </div>

        <div className="quiz-builder-footer">
          <button className="btn-secondary" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSubmit} disabled={loading}>
            {loading ? 'Saving...' : 'Save Quiz'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default QuizBuilder;
