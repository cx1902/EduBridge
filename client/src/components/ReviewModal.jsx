import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import './ReviewModal.css';

const ReviewModal = ({ isOpen, onClose, courseId, onSuccess, initialData = null }) => {
    const { token } = useAuthStore();
    const [rating, setRating] = useState(0);
    const [comment, setComment] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [hoverRating, setHoverRating] = useState(0);

    useEffect(() => {
        if (isOpen) {
            if (initialData) {
                setRating(initialData.rating);
                setComment(initialData.comment || initialData.review || '');
            } else {
                setRating(0);
                setComment('');
            }
            setError(null);
        }
    }, [isOpen, initialData]);

    if (!isOpen) return null;

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (rating === 0) {
            setError('Please select a rating');
            return;
        }
        if (comment.length < 5) {
            setError('Comment must be at least 5 characters');
            return;
        }

        setLoading(true);
        setError(null);

        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

        try {
            const method = initialData ? 'put' : 'post';
            const url = `${API_URL}/courses/${courseId}/reviews`;

            const response = await axios[method](
                url,
                { rating, comment },
                {
                    headers: { Authorization: `Bearer ${token}` }
                }
            );

            if (response.data.success) {
                onSuccess();
                onClose();
            }
        } catch (err) {
            console.error('Submit review error:', err);
            setError(err.response?.data?.error || 'Failed to submit review');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="review-modal-overlay">
            <div className="review-modal">
                <button className="close-btn" onClick={onClose}>&times;</button>
                <h2>{initialData ? 'Edit Your Review' : 'Write a Review'}</h2>

                {error && <div className="error-message">{error}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="rating-select">
                        <p>Select Rating:</p>
                        <div className="stars-input">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <i
                                    key={star}
                                    className={`fas fa-star ${star <= (hoverRating || rating) ? 'filled' : ''}`}
                                    onMouseEnter={() => setHoverRating(star)}
                                    onMouseLeave={() => setHoverRating(0)}
                                    onClick={() => setRating(star)}
                                ></i>
                            ))}
                        </div>
                        <p className="rating-text">{rating > 0 ? `${rating} Stars` : 'Rate this course'}</p>
                    </div>

                    <div className="form-group">
                        <label htmlFor="comment">Your Review:</label>
                        <textarea
                            id="comment"
                            value={comment}
                            onChange={(e) => setComment(e.target.value)}
                            placeholder="Share your experience..."
                            rows={4}
                            required
                            minLength={5}
                        ></textarea>
                    </div>

                    <div className="modal-actions">
                        <button type="button" className="btn-secondary" onClick={onClose}>Cancel</button>
                        <button type="submit" className="btn-primary" disabled={loading}>
                            {loading ? 'Submitting...' : (initialData ? 'Update Review' : 'Submit Review')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default ReviewModal;
