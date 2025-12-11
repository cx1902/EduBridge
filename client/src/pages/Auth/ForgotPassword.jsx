import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import './Auth.css';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { t } = useTranslation('auth');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    
    try {
      const response = await axios.post('http://localhost:3000/api/auth/forgot-password', {
        email,
      });

      if (response.data.success) {
        setSubmitted(true);
      }
    } catch (err) {
      console.error('Forgot password error:', err);
      setError(err.response?.data?.message || 'Failed to send reset email. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h1>{t('forgotPassword.checkEmail')}</h1>
          <p className="auth-subtitle">
            {t('forgotPassword.emailSent', { email })}
          </p>
          <Link to="/login" className="btn btn-primary btn-block">
            {t('forgotPassword.backToLogin')}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>{t('forgotPassword.title')}</h1>
        <p className="auth-subtitle">
          {t('forgotPassword.subtitle')}
        </p>

        <form onSubmit={handleSubmit} className="auth-form">
          {error && (
            <div className="alert alert-error" style={{ marginBottom: '1rem' }}>
              {error}
            </div>
          )}
          
          <div className="form-group">
            <label htmlFor="email">{t('forgotPassword.email')}</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder={t('forgotPassword.emailPlaceholder')}
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={isLoading}
          >
            {isLoading ? t('forgotPassword.sending') : t('forgotPassword.submit')}
          </button>
        </form>

        <div className="auth-divider">
          <span>{t('forgotPassword.rememberPassword')}</span>
        </div>

        <Link to="/login" className="btn btn-outline btn-block">
          {t('forgotPassword.backToLogin')}
        </Link>
      </div>
    </div>
  );
};

export default ForgotPassword;
