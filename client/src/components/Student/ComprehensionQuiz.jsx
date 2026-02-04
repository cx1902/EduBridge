import React, { useState } from 'react';
import { FaCheckCircle, FaTimesCircle, FaQuestionCircle } from 'react-icons/fa';
import './ComprehensionQuiz.css';

const ComprehensionQuiz = ({ lessonId, questions, onSubmit, onCancel }) => {
    const [answers, setAnswers] = useState({});
    const [submitted, setSubmitted] = useState(false);
    const [results, setResults] = useState(null);

    const handleAnswerSelect = (questionId, answer) => {
        setAnswers({ ...answers, [questionId]: answer });
    };

    const handleSubmit = async () => {
        // Check all questions answered
        const unanswered = questions.filter(q => !answers[q.id]);
        if (unanswered.length > 0) {
            alert(`Please answer all questions. ${unanswered.length} remaining.`);
            return;
        }

        // Format answers for API
        const formattedAnswers = Object.entries(answers).map(([questionId, answer]) => ({
            questionId,
            answer
        }));

        // Submit to parent component
        const result = await onSubmit(formattedAnswers);
        if (result) {
            setResults(result);
            setSubmitted(true);
        }
    };

    if (submitted && results) {
        return (
            <div className="comp-quiz-overlay">
                <div className="comp-quiz-modal results">
                    <div className="quiz-results-header">
                        <div className={`score-circle ${results.score >= 70 ? 'pass' : 'fail'}`}>
                            <span className="score-number">{results.score}%</span>
                            <span className="score-label">Score</span>
                        </div>
                        <h2>{results.score >= 70 ? '🎉 Great Job!' : '📚 Keep Learning'}</h2>
                        <p>
                            You got {results.correctCount} out of {results.totalQuestions} questions correct
                        </p>
                    </div>

                    <div className="results-breakdown">
                        {questions.map((question, index) => {
                            const response = results.responses.find(r => r.questionId === question.id);
                            const isCorrect = response?.isCorrect;

                            return (
                                <div key={question.id} className={`result-item ${isCorrect ? 'correct' : 'incorrect'}`}>
                                    <div className="result-header">
                                        <span className="question-num">Question {index + 1}</span>
                                        {isCorrect ? (
                                            <FaCheckCircle className="icon-correct" />
                                        ) : (
                                            <FaTimesCircle className="icon-incorrect" />
                                        )}
                                    </div>
                                    <p className="question-text">{question.question}</p>
                                    <div className="answer-info">
                                        <p>
                                            <strong>Your answer:</strong> {answers[question.id]}
                                        </p>
                                        {!isCorrect && (
                                            <p className="correct-answer-reveal">
                                                <strong>Correct answer:</strong> {response.correctAnswer}
                                            </p>
                                        )}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <button className="btn-continue" onClick={onCancel}>
                        Continue
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="comp-quiz-overlay">
            <div className="comp-quiz-modal">
                <div className="quiz-header">
                    <FaQuestionCircle className="quiz-icon" />
                    <h2>Comprehension Check</h2>
                    <p>Answer these questions to complete the lesson</p>
                </div>

                <div className="quiz-questions">
                    {questions.map((question, index) => (
                        <div key={question.id} className="quiz-question">
                            <h3>
                                Question {index + 1} of {questions.length}
                            </h3>
                            <p className="question-text">{question.question}</p>

                            <div className="answer-options">
                                {question.options.map((option) => (
                                    <label
                                        key={option}
                                        className={`option-label ${answers[question.id] === option ? 'selected' : ''}`}
                                    >
                                        <input
                                            type="radio"
                                            name={`question-${question.id}`}
                                            value={option}
                                            checked={answers[question.id] === option}
                                            onChange={() => handleAnswerSelect(question.id, option)}
                                        />
                                        <span className="option-text">{option}</span>
                                        <span className="check-mark"></span>
                                    </label>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>

                <div className="quiz-footer">
                    <div className="progress-info">
                        {Object.keys(answers).length} / {questions.length} answered
                    </div>
                    <div className="quiz-actions">
                        <button className="btn-cancel" onClick={onCancel}>
                            Cancel
                        </button>
                        <button
                            className="btn-submit"
                            onClick={handleSubmit}
                            disabled={Object.keys(answers).length < questions.length}
                        >
                            Submit Answers
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ComprehensionQuiz;
