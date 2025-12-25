import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { FiSun, FiMoon } from 'react-icons/fi';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../LanguageSwitcher';
import './AuthLayout.css';

const AuthLayout = () => {
  const { theme, toggleTheme } = useThemeStore();
  const { t } = useTranslation('common');
  const { user, isAuthenticated } = useAuthStore();

  const getDashboardLink = () => {
    if (!user) return '/';
    switch (user.role) {
      case 'STUDENT':
        return '/student';
      case 'TUTOR':
        return '/tutor';
      case 'ADMIN':
        return '/admin';
      default:
        return '/';
    }
  };

  return (
    <div className="auth-layout">
      <div className="auth-header">
        <Link to={isAuthenticated ? getDashboardLink() : "/"} className="auth-logo">
          <span className="logo-icon">📚</span>
          <span className="logo-text">EduBridge</span>
        </Link>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <LanguageSwitcher />
          <button
            onClick={toggleTheme}
            className="icon-btn"
            aria-label="Toggle theme"
          >
            {theme === 'dark' ? <FiSun /> : <FiMoon />}
          </button>
        </div>
      </div>

      <div className="auth-content">
        <Outlet />
      </div>

      <div className="auth-footer">
        <p>{t('footer.copyright')}</p>
      </div>
    </div>
  );
};

export default AuthLayout;
