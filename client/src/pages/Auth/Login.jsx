import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { useAuthStore } from '../../store/authStore';
import './Auth.css';

const Login = () => {
  const { t } = useTranslation('auth');
  const navigate = useNavigate();
  const { login, isLoading, error, clearError } = useAuthStore();
  
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
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
    
    const result = await login(formData.email, formData.password, rememberMe);
    
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
            <div className="password-input-wrapper">
              <input
                type={showPassword ? "text" : "password"}
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                required
                placeholder={t('login.passwordPlaceholder', 'Enter your password')}
                autoComplete="current-password"
              />
              <button
                type="button"
                className="btn-password-toggle"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <FaEyeSlash /> : <FaEye />}
              </button>
            </div>
          </div>

          <div className="form-options">
            <div className="remember-me">
              <input
                type="checkbox"
                id="rememberMe"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              />
              <label htmlFor="rememberMe">{t('login.rememberMe', 'Remember me')}</label>
            </div>
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
