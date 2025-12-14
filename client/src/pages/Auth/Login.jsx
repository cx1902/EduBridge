import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import './Auth.css';

const Login = () => {
  const { t } = useTranslation('auth');
  const navigate = useNavigate();
  const { login, isLoading, error, clearError } = useAuthStore();
  
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    clearError();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const result = await login(formData.email, formData.password);
    
    if (result.success) {
      // Redirect based on user role
      const user = useAuthStore.getState().user;
      if (user.role === 'STUDENT') {
        navigate('/student');
      } else if (user.role === 'TUTOR') {
        navigate('/tutor');
      } else if (user.role === 'ADMIN') {
        navigate('/admin');
      } else {
        navigate('/');
      }
    }
  };

  const handleGoogleLogin = () => {
    window.location.href = 'http://localhost:3000/api/auth/google';
  };

  const handleFacebookLogin = () => {
    window.location.href = 'http://localhost:3000/api/auth/facebook';
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>{t('login.title')}</h1>
        <p className="auth-subtitle">{t('login.subtitle')}</p>

        {error && (
          <div className="alert alert-error">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label htmlFor="email">{t('login.email')}</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder={t('login.emailPlaceholder', 'your.email@example.com')}
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">{t('login.password')}</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder={t('login.passwordPlaceholder', 'Enter your password')}
              autoComplete="current-password"
            />
          </div>

          <div className="form-footer">
            <Link to="/forgot-password" className="forgot-link">
              {t('login.forgotPassword')}
            </Link>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={isLoading}
          >
            {isLoading ? t('login.signingIn', 'Signing in...') : t('login.submit')}
          </button>
        </form>

        <div className="auth-divider">
          <span>{t('login.orContinueWith', 'Or continue with')}</span>
        </div>

        {/* OAuth Buttons */}
        <div className="oauth-buttons">
          <button 
            type="button"
            className="btn btn-oauth btn-google"
            onClick={handleGoogleLogin}
          >
            <svg width="18" height="18" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
              <path fill="#FFC107" d="M43.611,20.083H42V20H24v8h11.303c-1.649,4.657-6.08,8-11.303,8c-6.627,0-12-5.373-12-12c0-6.627,5.373-12,12-12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C12.955,4,4,12.955,4,24c0,11.045,8.955,20,20,20c11.045,0,20-8.955,20-20C44,22.659,43.862,21.35,43.611,20.083z"/>
              <path fill="#FF3D00" d="M6.306,14.691l6.571,4.819C14.655,15.108,18.961,12,24,12c3.059,0,5.842,1.154,7.961,3.039l5.657-5.657C34.046,6.053,29.268,4,24,4C16.318,4,9.656,8.337,6.306,14.691z"/>
              <path fill="#4CAF50" d="M24,44c5.166,0,9.86-1.977,13.409-5.192l-6.19-5.238C29.211,35.091,26.715,36,24,36c-5.202,0-9.619-3.317-11.283-7.946l-6.522,5.025C9.505,39.556,16.227,44,24,44z"/>
              <path fill="#1976D2" d="M43.611,20.083H42V20H24v8h11.303c-0.792,2.237-2.231,4.166-4.087,5.571c0.001-0.001,0.002-0.001,0.003-0.002l6.19,5.238C36.971,39.205,44,34,44,24C44,22.659,43.862,21.35,43.611,20.083z"/>
            </svg>
            {t('login.continueWith', { provider: 'Google' })}
          </button>

          <button 
            type="button"
            className="btn btn-oauth btn-facebook"
            onClick={handleFacebookLogin}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#fff">
              <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/>
            </svg>
            {t('login.continueWith', { provider: 'Facebook' })}
          </button>
        </div>

        <div className="auth-divider">
          <span>{t('login.noAccount')}</span>
        </div>

        <Link to="/register" className="btn btn-primary btn-block">
          {t('login.register')}
        </Link>

        <div className="demo-credentials">
          <p><strong>{t('login.demoAccounts', 'Demo Accounts')}:</strong></p>
          <p>Student: student@edubridge.com / Student@123</p>
          <p>Tutor: tutor@edubridge.com / Tutor@123</p>
          <p>Admin: admin@edubridge.com / Admin@123</p>
        </div>
      </div>
    </div>
  );
};

export default Login;
