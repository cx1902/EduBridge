import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { FiSun, FiMoon, FiUser, FiLogOut, FiMenu, FiX } from 'react-icons/fi';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import LanguageSwitcher from '../LanguageSwitcher';
import './MainLayout.css';

const MainLayout = () => {
  const { user, isAuthenticated, logout, checkAuth } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { t } = useTranslation('common');

  

  const handleThemeToggle = (e) => {
    const button = e.currentTarget;
    const rect = button.getBoundingClientRect();
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;

    // Create ripple element
    const ripple = document.createElement('div');
    ripple.className = 'theme-ripple';
    ripple.style.left = `${x}px`;
    ripple.style.top = `${y}px`;
    ripple.style.width = '100px';
    ripple.style.height = '100px';
    ripple.style.marginLeft = '-50px';
    ripple.style.marginTop = '-50px';
    
    document.body.appendChild(ripple);
    
    // Trigger animation
    requestAnimationFrame(() => {
      ripple.classList.add('active');
    });
    
    // Toggle theme
    toggleTheme();
    
    // Remove ripple after animation
    setTimeout(() => {
      ripple.remove();
    }, 800);
  };

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

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
    <div className="main-layout">
      <header className="navbar">
        <div className="container">
          <div className="navbar-content">
            <Link to={isAuthenticated ? getDashboardLink() : "/"} className="logo">
              <span className="logo-icon">📚</span>
              <span className="logo-text">EduBridge</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="nav-links desktop-nav">
              <Link to="/courses">{t('nav.courses')}</Link>
              <Link to="/about">{t('nav.about')}</Link>
              {isAuthenticated && (
                <Link to={getDashboardLink()}>{t('nav.dashboard')}</Link>
              )}
            </nav>

            {/* Actions */}
            <div className="navbar-actions">
              <LanguageSwitcher />
              
              <button
                onClick={handleThemeToggle}
                className="icon-btn theme-toggle-btn"
                aria-label="Toggle theme"
              >
                {theme === 'dark' ? <FiSun /> : <FiMoon />}
              </button>

              {isAuthenticated ? (
                <div className="user-menu">
                  <Link to="/profile" className="btn btn-ghost">
                    <FiUser />
                    <span>{user?.firstName}</span>
                  </Link>
                  <button onClick={handleLogout} className="btn btn-ghost">
                    <FiLogOut />
                    <span>{t('nav.logout')}</span>
                  </button>
                </div>
              ) : (
                <div className="auth-buttons">
                  <Link to="/login" className="btn btn-ghost">
                    {t('nav.login')}
                  </Link>
                  <Link to="/register" className="btn btn-primary">
                    {t('nav.signUp')}
                  </Link>
                </div>
              )}

              {/* Mobile Menu Toggle */}
              <button
                className="mobile-menu-btn"
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                aria-label="Toggle menu"
              >
                {mobileMenuOpen ? <FiX /> : <FiMenu />}
              </button>
            </div>
          </div>

          {/* Mobile Menu */}
          {mobileMenuOpen && (
            <div className="mobile-menu">
              <Link to="/courses" onClick={() => setMobileMenuOpen(false)}>
                {t('nav.courses')}
              </Link>
              <Link to="/about" onClick={() => setMobileMenuOpen(false)}>
                {t('nav.about')}
              </Link>
              {isAuthenticated && (
                <Link to={getDashboardLink()} onClick={() => setMobileMenuOpen(false)}>
                  {t('nav.dashboard')}
                </Link>
              )}
            </div>
          )}
        </div>
      </header>

      <main className="main-content">
        <Outlet />
      </main>

      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-section">
              <h4>EduBridge</h4>
              <p>{t('footer.tagline')}</p>
            </div>
            <div className="footer-section">
              <h4>{t('footer.quickLinks')}</h4>
              <Link to="/courses">{t('footer.browseCourses')}</Link>
              <Link to="/about">{t('footer.aboutUs')}</Link>
              <Link to="/contact">{t('footer.contact')}</Link>
            </div>
            <div className="footer-section">
              <h4>{t('footer.legal')}</h4>
              <Link to="/privacy">{t('footer.privacyPolicy')}</Link>
              <Link to="/terms">{t('footer.termsOfService')}</Link>
            </div>
          </div>
          <div className="footer-bottom">
            <p>{t('footer.copyright')}</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
