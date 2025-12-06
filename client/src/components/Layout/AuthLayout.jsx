import React from 'react';
import { Outlet, Link } from 'react-router-dom';
import { useThemeStore } from '../../store/themeStore';
import { FiSun, FiMoon } from 'react-icons/fi';
import './AuthLayout.css';

const AuthLayout = () => {
  const { theme, toggleTheme } = useThemeStore();

  return (
    <div className="auth-layout">
      <div className="auth-header">
        <Link to="/" className="auth-logo">
          <span className="logo-icon">📚</span>
          <span className="logo-text">EduBridge</span>
        </Link>
        <button
          onClick={toggleTheme}
          className="icon-btn"
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <FiSun /> : <FiMoon />}
        </button>
      </div>

      <div className="auth-content">
        <Outlet />
      </div>

      <div className="auth-footer">
        <p>&copy; 2025 Edu Bridge. All rights reserved.</p>
      </div>
    </div>
  );
};

export default AuthLayout;
