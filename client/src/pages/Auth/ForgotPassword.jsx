import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import './Auth.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    
    // Simulate API call
    setTimeout(() => {
      setSubmitted(true);
      setIsLoading(false);
    }, 1000);
  };

  if (submitted) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h1>Check Your Email</h1>
          <p className="auth-subtitle">
            If an account exists with {email}, you will receive password reset instructions.
          </p>
          <Link to="/login" className="btn btn-primary btn-block">
            Back to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>Forgot Password?</h1>
        <p className="auth-subtitle">
          Enter your email address and we'll send you instructions to reset your password.
        </p>

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="your.email@example.com"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={isLoading}
          >
            {isLoading ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <div className="auth-divider">
          <span>Remember your password?</span>
        </div>

        <Link to="/login" className="btn btn-outline btn-block">
          Back to Login
        </Link>
      </div>
    </div>
  );
};

export default ForgotPassword;
