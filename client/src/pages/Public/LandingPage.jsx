import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './LandingPage.css';

const LandingPage = () => {
  const { t } = useTranslation('common');
  const [stats, setStats] = useState({
    students: 0,
    courses: 0,
    tutors: 0,
    hours: 0
  });

  // Animate stats on mount
  useEffect(() => {
    const targetStats = {
      students: 10000,
      courses: 500,
      tutors: 250,
      hours: 50000
    };

    const duration = 2000; // 2 seconds
    const steps = 60;
    const stepDuration = duration / steps;

    let currentStep = 0;

    const interval = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      
      setStats({
        students: Math.floor(targetStats.students * progress),
        courses: Math.floor(targetStats.courses * progress),
        tutors: Math.floor(targetStats.tutors * progress),
        hours: Math.floor(targetStats.hours * progress)
      });

      if (currentStep >= steps) {
        clearInterval(interval);
        setStats(targetStats);
      }
    }, stepDuration);

    return () => clearInterval(interval);
  }, []);
  
  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="hero-modern">
        <div className="hero-background">
          <div className="gradient-orb orb-1"></div>
          <div className="gradient-orb orb-2"></div>
          <div className="gradient-orb orb-3"></div>
        </div>
        <div className="container">
          <div className="hero-content-modern">
            <div className="hero-badge">
              <span className="badge-icon">✨</span>
              <span>{t('landing.hero.badge', 'Welcome to the Future of Learning')}</span>
            </div>
            <h1 className="hero-title">
              {t('landing.hero.title')}
            </h1>
            <p className="hero-subtitle">
              {t('landing.hero.subtitle')}
            </p>
            <div className="hero-actions-modern">
              <Link to="/register" className="btn-modern btn-primary-modern">
                <span>{t('landing.hero.getStarted')}</span>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
              <Link to="/courses" className="btn-modern btn-outline-modern">
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M10 18C14.4183 18 18 14.4183 18 10C18 5.58172 14.4183 2 10 2C5.58172 2 2 5.58172 2 10C2 14.4183 5.58172 18 10 18Z" stroke="currentColor" strokeWidth="2"/>
                  <path d="M8 10L10 12L12 10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span>{t('landing.hero.browseCourses')}</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="container">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">👥</div>
              <div className="stat-number">{stats.students.toLocaleString()}+</div>
              <div className="stat-label">{t('landing.stats.activeStudents', 'Active Students')}</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">📚</div>
              <div className="stat-number">{stats.courses.toLocaleString()}+</div>
              <div className="stat-label">{t('landing.stats.qualityCourses', 'Quality Courses')}</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🎓</div>
              <div className="stat-number">{stats.tutors.toLocaleString()}+</div>
              <div className="stat-label">{t('landing.stats.expertTutors', 'Expert Tutors')}</div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">⏱️</div>
              <div className="stat-number">{stats.hours.toLocaleString()}+</div>
              <div className="stat-label">{t('landing.stats.learningHours', 'Learning Hours')}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-modern">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">{t('landing.features.title')}</h2>
            <p className="section-subtitle">{t('landing.features.subtitle', 'Everything you need to succeed in your learning journey')}</p>
          </div>
          <div className="features-grid">
            <div className="feature-card-modern">
              <div className="feature-icon-wrapper">
                <div className="feature-icon-modern">📚</div>
              </div>
              <h3 className="feature-title">{t('landing.features.selfPaced.title')}</h3>
              <p className="feature-description">{t('landing.features.selfPaced.description')}</p>
              <Link to="/about#offerings" className="feature-link">
                <span>{t('landing.features.learnMore', 'Learn more')}</span>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
            </div>
            <div className="feature-card-modern">
              <div className="feature-icon-wrapper">
                <div className="feature-icon-modern">👨‍🏫</div>
              </div>
              <h3 className="feature-title">{t('landing.features.liveTutoring.title')}</h3>
              <p className="feature-description">{t('landing.features.liveTutoring.description')}</p>
              <Link to="/about#offerings" className="feature-link">
                <span>{t('landing.features.learnMore', 'Learn more')}</span>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
            </div>
            <div className="feature-card-modern">
              <div className="feature-icon-wrapper">
                <div className="feature-icon-modern">🏆</div>
              </div>
              <h3 className="feature-title">{t('landing.features.gamification.title')}</h3>
              <p className="feature-description">{t('landing.features.gamification.description')}</p>
              <Link to="/about#offerings" className="feature-link">
                <span>{t('landing.features.learnMore', 'Learn more')}</span>
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M6 12L10 8L6 4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="testimonials-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">{t('landing.testimonials.title', 'What Our Students Say')}</h2>
            <p className="section-subtitle">{t('landing.testimonials.subtitle', 'Join thousands of satisfied learners')}</p>
          </div>
          <div className="testimonials-grid">
            <div className="testimonial-card">
              <div className="testimonial-stars">⭐⭐⭐⭐⭐</div>
              <p className="testimonial-text">{t('landing.testimonials.item1.quote', 'EduBridge transformed my learning experience. The platform is intuitive and the tutors are exceptional!')}</p>
              <div className="testimonial-author">
                <div className="author-avatar">👤</div>
                <div>
                  <div className="author-name">{t('landing.testimonials.item1.name', 'Sarah Chen')}</div>
                  <div className="author-role">{t('landing.testimonials.item1.role', 'Computer Science Student')}</div>
                </div>
              </div>
            </div>
            <div className="testimonial-card">
              <div className="testimonial-stars">⭐⭐⭐⭐⭐</div>
              <p className="testimonial-text">{t('landing.testimonials.item2.quote', "The gamification features keep me motivated. I've completed 15 courses in just 6 months!")}</p>
              <div className="testimonial-author">
                <div className="author-avatar">👤</div>
                <div>
                  <div className="author-name">{t('landing.testimonials.item2.name', 'Marcus Johnson')}</div>
                  <div className="author-role">{t('landing.testimonials.item2.role', 'Data Science Learner')}</div>
                </div>
              </div>
            </div>
            <div className="testimonial-card">
              <div className="testimonial-stars">⭐⭐⭐⭐⭐</div>
              <p className="testimonial-text">{t('landing.testimonials.item3.quote', "Best online learning platform I've used. The live tutoring sessions are incredibly valuable.")}</p>
              <div className="testimonial-author">
                <div className="author-avatar">👤</div>
                <div>
                  <div className="author-name">{t('landing.testimonials.item3.name', 'Emily Rodriguez')}</div>
                  <div className="author-role">{t('landing.testimonials.item3.role', 'Business Student')}</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-modern">
        <div className="cta-background">
          <div className="cta-orb cta-orb-1"></div>
          <div className="cta-orb cta-orb-2"></div>
        </div>
        <div className="container">
          <div className="cta-content">
            <h2 className="cta-title">{t('landing.cta.title')}</h2>
            <p className="cta-subtitle">{t('landing.cta.subtitle')}</p>
            <Link to="/register" className="btn-modern btn-cta-modern">
              <span>{t('landing.cta.button')}</span>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </Link>
            <p className="cta-note">✨ {t('landing.cta.note', 'No credit card required • Start learning in minutes')}</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
