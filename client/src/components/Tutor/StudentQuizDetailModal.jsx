import React, { useState } from 'react';
import './StudentQuizDetailModal.css';

const StudentQuizDetailModal = ({ student, onClose }) => {
    // If student has no attempts, we shouldn't even open this, but safety check
    const attempts = student?.quizAttempts || [];
    const [selectedAttemptIndex, setSelectedAttemptIndex] = useState(attempts.length - 1); // Default to latest

    if (attempts.length === 0) return null;

    const currentAttempt = attempts[selectedAttemptIndex];

    // Helper to format date
    const formatDate = (dateString) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    // Helper to parse responses if strings
    const getResponses = () => {
        if (!currentAttempt?.responses) return [];
        if (typeof currentAttempt.responses === 'string') {
            try {
                return JSON.parse(currentAttempt.responses);
            } catch (e) {
                return [];
            }
        }
        return currentAttempt.responses;
    };

    const responses = getResponses();

    return (
        <div className="quiz-detail-overlay" onClick={onClose}>
            <div className="quiz-detail-modal" onClick={e => e.stopPropagation()}>
                <div className="modal-header">
                    <div>
                        <h3>{currentAttempt.quiz?.title || 'Quiz Details'}</h3>
                        <p style={{ margin: 0, color: '#9ca3af', fontSize: '0.9rem' }}>
                            Attempt by {student?.firstName} {student?.lastName}
                        </p>
                    </div>
                    <button className="btn-close" onClick={onClose}>&times;</button>
                </div>

                <div className="modal-content">
                    {/* Attempt Selector */}
                    {attempts.length > 1 && (
                        <div className="attempt-selector">
                            {attempts.map((_, index) => (
                                <button
                                    key={index}
                                    className={`attempt-tab ${selectedAttemptIndex === index ? 'active' : ''}`}
                                    onClick={() => setSelectedAttemptIndex(index)}
                                >
                                    Attempt {index + 1}
                                </button>
                            ))}
                        </div>
                    )}

                    <div className="quiz-summary-card">
                        <div className="summary-item">
                            <span className="summary-label">Score</span>
                            <span className={`summary-value ${currentAttempt.passed ? 'pass' : 'fail'}`}>
                                {parseFloat(currentAttempt.scorePercentage).toFixed(0)}%
                            </span>
                        </div>
                        <div className="summary-item">
                            <span className="summary-label">Status</span>
                            <span className={`summary-value ${currentAttempt.passed ? 'pass' : 'fail'}`}>
                                {currentAttempt.passed ? 'PASSED' : 'FAILED'}
                            </span>
                        </div>
                        <div className="summary-item">
                            <span className="summary-label">Date</span>
                            <span className="summary-value" style={{ fontSize: '1rem', marginTop: '0.5rem' }}>
                                {formatDate(currentAttempt.completedAt)}
                            </span>
                        </div>
                    </div>

                    <h4 style={{ color: '#f3f4f6', marginBottom: '1rem' }}>Question Review</h4>

                    {responses.length === 0 ? (
                        <div style={{ textAlign: 'center', padding: '2rem', color: '#9ca3af' }}>
                            No detailed response data available for this attempt.
                        </div>
                    ) : (
                        <div className="responses-list">
                            {responses.map((resp, index) => (
                                <div
                                    key={index}
                                    className={`question-review-card ${resp.isCorrect ? 'correct' : 'incorrect'}`}
                                >
                                    <div className="review-header">
                                        <span>Question {index + 1}</span>
                                        <span style={{ color: resp.isCorrect ? '#10b981' : '#ef4444' }}>
                                            {resp.isCorrect ? `Correct (+${resp.pointsEarned})` : `Incorrect (0/${resp.maxPoints})`}
                                        </span>
                                    </div>

                                    <div className="question-text">{resp.questionText || 'Question text not available'}</div>

                                    <div className="detailed-answers">
                                        {/* Rendering of the student's answer */}
                                        <div className={`option-item ${resp.isCorrect ? 'correct-bg' : 'incorrect-bg'}`}>
                                            <span style={{ color: '#9ca3af', marginRight: '0.5rem' }}>Student Answer:</span>
                                            <span style={{ fontWeight: '600', color: 'white' }}>
                                                {resp.answerText ||
                                                    (resp.selectedOptionTexts && resp.selectedOptionTexts.length > 0
                                                        ? resp.selectedOptionTexts.join(', ')
                                                        : (resp.selectedOptionIds && resp.selectedOptionIds.length > 0 ? 'Option selected (Text legacy)' : 'No answer'))}
                                            </span>
                                            {resp.isCorrect ? (
                                                <span className="correct-indicator">✓ Correct</span>
                                            ) : (
                                                <span className="incorrect-indicator">✗ Incorrect</span>
                                            )}
                                        </div>

                                        {/* Rendering of the correct answer if incorrect */}
                                        {!resp.isCorrect && resp.correctOptionTexts && resp.correctOptionTexts.length > 0 && (
                                            <div className="option-item" style={{ marginTop: '0.5rem', borderLeft: '3px solid #10b981' }}>
                                                <span style={{ color: '#9ca3af', marginRight: '0.5rem' }}>Correct Answer:</span>
                                                <span style={{ fontWeight: '500', color: '#10b981' }}>
                                                    {resp.correctOptionTexts.join(', ')}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default StudentQuizDetailModal;
