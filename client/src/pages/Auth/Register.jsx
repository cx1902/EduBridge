import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import './Auth.css';

const Register = () => {
  const { t } = useTranslation('auth');
  const navigate = useNavigate();
  const { register, isLoading, error, clearError } = useAuthStore();
  
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'STUDENT',
  });

  const [validationError, setValidationError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    clearError();
    setValidationError('');
  };

  const validatePassword = (password) => {
    if (password.length < 8) {
      return 'Password must be at least 8 characters';
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&_#^()\-+=<>{}\[\]|~])/.test(password)) {
      return 'Password must contain uppercase, lowercase, number, and special character';
    }
    return '';
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (formData.password !== formData.confirmPassword) {
      setValidationError('Passwords do not match');
      return;
    }

    const passwordError = validatePassword(formData.password);
    if (passwordError) {
      setValidationError(passwordError);
      return;
    }

    const { confirmPassword, ...userData } = formData;
    const result = await register(userData);
    
    if (result.success) {
      navigate(formData.role === 'STUDENT' ? '/student' : '/tutor');
    }
  };

  return (
    <div className="auth-container">
      <div className="auth-card">
        <h1>{t('register.title')}</h1>
        <p className="auth-subtitle">{t('register.subtitle')}</p>

        {(error || validationError) && (
          <div className="alert alert-error">
            {error || validationError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="firstName">{t('register.firstName')}</label>
              <input
                type="text"
                id="firstName"
                name="firstName"
                value={formData.firstName}
                onChange={handleChange}
                required
                placeholder="John"
              />
            </div>

            <div className="form-group">
              <label htmlFor="lastName">{t('register.lastName')}</label>
              <input
                type="text"
                id="lastName"
                name="lastName"
                value={formData.lastName}
                onChange={handleChange}
                required
                placeholder="Doe"
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="email">{t('register.email')}</label>
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              required
              placeholder="your.email@example.com"
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label htmlFor="role">{t('register.role')}</label>
            <select
              id="role"
              name="role"
              value={formData.role}
              onChange={handleChange}
              required
            >
              <option value="STUDENT">{t('register.roleStudent')}</option>
              <option value="TUTOR">{t('register.roleTutor')}</option>
            </select>
          </div>

          <div className="form-group">
            <label htmlFor="password">{t('register.password')}</label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              required
              placeholder={t('register.passwordPlaceholder', 'Create a strong password')}
              autoComplete="new-password"
            />
            <small className="form-hint">
              {t('register.passwordHint', 'At least 8 characters with uppercase, lowercase, number, and special character')}
            </small>
          </div>

          <div className="form-group">
            <label htmlFor="confirmPassword">{t('register.confirmPassword')}</label>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              required
              placeholder={t('register.confirmPasswordPlaceholder', 'Confirm your password')}
              autoComplete="new-password"
            />
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block"
            disabled={isLoading}
          >
            {isLoading ? t('register.creating') : t('register.submit')}
          </button>
        </form>

        <div className="auth-divider">
          <span>{t('register.hasAccount')}</span>
        </div>

        <Link to="/login" className="btn btn-outline btn-block">
          {t('register.login')}
        </Link>
      </div>
    </div>
  );
};

export default Register;
