import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { useThemeStore } from '../../store/themeStore';
import { FiSun, FiMoon, FiUser, FiLogOut, FiMenu, FiX } from 'react-icons/fi';
import React, { useState } from 'react';
import './MainLayout.css';

const MainLayout = () => {
  const { user, isAuthenticated, logout } = useAuthStore();
  const { theme, toggleTheme } = useThemeStore();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
            <Link to="/" className="logo">
              <span className="logo-icon">📚</span>
              <span className="logo-text">EduBridge</span>
            </Link>

            {/* Desktop Navigation */}
            <nav className="nav-links desktop-nav">
              <Link to="/courses">Courses</Link>
              {isAuthenticated && (
                <Link to={getDashboardLink()}>Dashboard</Link>
              )}
            </nav>

            {/* Actions */}
            <div className="navbar-actions">
              <button
                onClick={toggleTheme}
                className="icon-btn"
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
                    <span>Logout</span>
                  </button>
                </div>
              ) : (
                <div className="auth-buttons">
                  <Link to="/login" className="btn btn-ghost">
                    Login
                  </Link>
                  <Link to="/register" className="btn btn-primary">
                    Sign Up
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
                Courses
              </Link>
              {isAuthenticated && (
                <Link to={getDashboardLink()} onClick={() => setMobileMenuOpen(false)}>
                  Dashboard
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
              <p>Empowering learners worldwide with quality education.</p>
            </div>
            <div className="footer-section">
              <h4>Quick Links</h4>
              <Link to="/courses">Browse Courses</Link>
              <Link to="/about">About Us</Link>
              <Link to="/contact">Contact</Link>
            </div>
            <div className="footer-section">
              <h4>Legal</h4>
              <Link to="/privacy">Privacy Policy</Link>
              <Link to="/terms">Terms of Service</Link>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2025 Edu Bridge. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
