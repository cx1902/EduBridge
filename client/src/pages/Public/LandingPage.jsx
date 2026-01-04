import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { FaGraduationCap, FaChalkboardTeacher, FaRocket, FaTrophy, FaUsers, FaClock, FaStar, FaArrowRight, FaPlay } from 'react-icons/fa';
import './LandingPage.css';

const LandingPage = () => {
  const { t } = useTranslation('common');
  const [stats, setStats] = useState({
    students: 0,
    courses: 0,
    tutors: 0,
    rating: 0
  });

  useEffect(() => {
    const targetStats = {
      students: 10000,
      courses: 500,
      tutors: 250,
      rating: 4.9
    };
    const duration = 2000;
    const steps = 60;
    const stepDuration = duration / steps;
    let currentStep = 0;

    const interval = setInterval(() => {
      currentStep++;
      const progress = currentStep / steps;
      const ease = 1 - Math.pow(1 - progress, 3);

      setStats({
        students: Math.floor(targetStats.students * ease),
        courses: Math.floor(targetStats.courses * ease),
        tutors: Math.floor(targetStats.tutors * ease),
        rating: parseFloat((targetStats.rating * ease).toFixed(1))
      });

      if (currentStep >= steps) {
        clearInterval(interval);
        setStats(targetStats);
      }
    }, stepDuration);

    return () => clearInterval(interval);
  }, []);

  const features = [
    {
      icon: <FaGraduationCap />,
      title: t('landing.features.selfPaced.title', 'Self-Paced Learning'),
      description: t('landing.features.selfPaced.description', 'Learn at your own pace with our comprehensive course library. Access materials anytime, anywhere.')
    },
    {
      icon: <FaChalkboardTeacher />,
      title: t('landing.features.liveTutoring.title', 'Live Tutoring'),
      description: t('landing.features.liveTutoring.description', 'Connect with expert tutors in real-time for personalized guidance and support.')
    },
    {
      icon: <FaTrophy />,
      title: t('landing.features.gamification.title', 'Gamified Experience'),
      description: t('landing.features.gamification.description', 'Earn badges, track progress, and compete with peers to stay motivated.')
    },
    {
      icon: <FaRocket />,
      title: 'Career Growth',
      description: 'Build skills that matter with industry-relevant courses designed to accelerate your career.'
    }
  ];

  const testimonials = [
    {
      name: 'Sarah Chen',
      role: 'Computer Science Student',
      avatar: 'SC',
      rating: 5,
      text: 'EduBridge transformed my learning experience. The platform is intuitive and the tutors are exceptional!'
    },
    {
      name: 'Marcus Johnson',
      role: 'Data Science Learner',
      avatar: 'MJ',
      rating: 5,
      text: "The gamification features keep me motivated. I've completed 15 courses in just 6 months!"
    },
    {
      name: 'Emily Rodriguez',
      role: 'Business Student',
      avatar: 'ER',
      rating: 5,
      text: "Best online learning platform I've used. The live tutoring sessions are incredibly valuable."
    }
  ];

  return (
    <div className="landing-page-modern">
      {/* Hero Section */}
      <section className="hero-split">
        <div className="hero-particles"></div>

        <div className="container hero-container">
          <div className="hero-content-left">
            <div className="hero-badge">
              <span className="badge-dot"></span>
              <span>{t('landing.hero.badge', 'Trusted by 10,000+ Students')}</span>
            </div>

            <h1 className="hero-heading">
              {t('landing.hero.title', 'Transform Your Future with')}
              <span className="gradient-text"> Expert Learning</span>
            </h1>

            <p className="hero-description">
              {t('landing.hero.subtitle', 'Join thousands of learners mastering new skills with personalized tutoring, interactive courses, and a supportive community.')}
            </p>

            <div className="hero-cta-buttons">
              <Link to="/register" className="btn-primary-large">
                <span>{t('landing.hero.getStarted', 'Get Started Free')}</span>
                <FaArrowRight />
              </Link>
              <button className="btn-secondary-large">
                <FaPlay />
                <span>Watch Demo</span>
              </button>
            </div>

            <div className="hero-stats-inline">
              <div className="stat-inline">
                <FaUsers className="stat-icon" />
                <div>
                  <div className="stat-number">{stats.students.toLocaleString()}+</div>
                  <div className="stat-label">Active Students</div>
                </div>
              </div>
              <div className="stat-inline">
                <FaStar className="stat-icon" />
                <div>
                  <div className="stat-number">{stats.rating}</div>
                  <div className="stat-label">Average Rating</div>
                </div>
              </div>
            </div>
          </div>

          <div className="hero-visual-right">
            <div className="floating-card card-1">
              <FaGraduationCap className="card-icon" />
              <div className="card-text">
                <strong>{stats.courses}+</strong>
                <span>Courses</span>
              </div>
            </div>
            <div className="floating-card card-2">
              <FaChalkboardTeacher className="card-icon" />
              <div className="card-text">
                <strong>{stats.tutors}+</strong>
                <span>Expert Tutors</span>
              </div>
            </div>
            <div className="floating-card card-3">
              <FaClock className="card-icon" />
              <div className="card-text">
                <strong>24/7</strong>
                <span>Support</span>
              </div>
            </div>
            <div className="hero-illustration">
              <div className="illustration-circle circle-1"></div>
              <div className="illustration-circle circle-2"></div>
              <div className="illustration-circle circle-3"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <div className="section-header-center">
            <h2 className="section-title">Why Choose EduBridge?</h2>
            <p className="section-subtitle">Everything you need to succeed in your learning journey</p>
          </div>

          <div className="features-grid">
            {features.map((feature, index) => (
              <div key={index} className="feature-card" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="feature-icon-wrapper">
                  {feature.icon}
                </div>
                <h3 className="feature-title">{feature.title}</h3>
                <p className="feature-description">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="testimonials-section">
        <div className="container">
          <div className="section-header-center">
            <h2 className="section-title">What Our Students Say</h2>
            <p className="section-subtitle">Join thousands of satisfied learners</p>
          </div>

          <div className="testimonials-grid">
            {testimonials.map((testimonial, index) => (
              <div key={index} className="testimonial-card">
                <div className="testimonial-rating">
                  {[...Array(testimonial.rating)].map((_, i) => (
                    <FaStar key={i} className="star-icon" />
                  ))}
                </div>
                <p className="testimonial-text">"{testimonial.text}"</p>
                <div className="testimonial-author">
                  <div className="author-avatar">{testimonial.avatar}</div>
                  <div className="author-info">
                    <div className="author-name">{testimonial.name}</div>
                    <div className="author-role">{testimonial.role}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA Section */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2 className="cta-title">{t('landing.cta.title', 'Ready to Start Learning?')}</h2>
            <p className="cta-subtitle">{t('landing.cta.subtitle', 'Join our community today and unlock your potential')}</p>
            <Link to="/register" className="btn-cta-large">
              <span>{t('landing.cta.button', 'Create Free Account')}</span>
              <FaArrowRight />
            </Link>
            <p className="cta-note">✨ No credit card required • Start learning in minutes</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
