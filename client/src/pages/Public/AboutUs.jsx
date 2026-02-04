import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../../store/authStore';
import {
  FaGraduationCap,
  FaChalkboardTeacher,
  FaBookOpen,
  FaTrophy,
  FaUsers,
  FaClock,
  FaShieldAlt,
  FaCheckCircle,
  FaLightbulb,
  FaRocket,
  FaStar,
  FaGlobe,
  FaHandshake,
  FaSeedling,
  FaUserGraduate,
  FaChalkboard,
  FaSearch,
  FaChartLine,
  FaArrowRight,
  FaChevronDown
} from 'react-icons/fa';
import './AboutUs.css';

const AboutUs = () => {
  const { t } = useTranslation('common');
  const location = useLocation();
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuthStore();

  const handleNavigation = (path) => {
    if (isAuthenticated && user) {
      if (user.role === 'ADMIN') return navigate('/admin');
      if (user.role === 'TUTOR') return navigate('/tutor');
      if (user.role === 'STUDENT') return navigate('/student');
    }
    navigate(path);
  };

  const [activeTab, setActiveTab] = useState('mission');
  const [stats, setStats] = useState({
    learners: 0,
    sessions: 0,
    quizzes: 0,
    satisfaction: 0
  });

  // Animation for stats
  useEffect(() => {
    const targetStats = {
      learners: 10000,
      sessions: 25000,
      quizzes: 50000,
      satisfaction: 98
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
        learners: Math.floor(targetStats.learners * ease),
        sessions: Math.floor(targetStats.sessions * ease),
        quizzes: Math.floor(targetStats.quizzes * ease),
        satisfaction: Math.floor(targetStats.satisfaction * ease)
      });

      if (currentStep >= steps) {
        clearInterval(interval);
        setStats(targetStats);
      }
    }, stepDuration);

    return () => clearInterval(interval);
  }, []);

  // Tabs Configuration
  const tabs = [
    { id: 'mission', label: t('about.tabs.mission', 'Our Mission'), icon: <FaLightbulb /> },
    { id: 'journey', label: t('about.tabs.journey', 'Journey'), icon: <FaRocket /> },
    { id: 'offerings', label: t('about.tabs.offerings', 'Offerings'), icon: <FaBookOpen /> },
    { id: 'values', label: t('about.tabs.values', 'Values'), icon: <FaStar /> },
    { id: 'faq', label: t('about.tabs.faq', 'FAQ'), icon: <FaCheckCircle /> }
  ];

  /* --- Render Helpers for Content Sections --- */

  const renderMission = () => (
    <div className="tab-content-wrapper fade-in">
      <div className="mission-highlight-card">
        <div className="mission-icon-large">
          <FaLightbulb />
        </div>
        <h2>{t('about.mission.title', 'Our Mission')}</h2>
        <p className="mission-statement-large">
          {t('about.mission.text', 'To bridge the gap between passionate learners and expert educators, creating a seamless, engaging platform where knowledge flows freely and everyone can achieve their full potential.')}
        </p>
      </div>

      {/* Mini Impact Stats directly in Mission */}
      <div className="mini-stats-row">
        <div className="mini-stat">
          <span className="stat-num">{stats.learners.toLocaleString()}+</span>
          <span className="stat-label">Learners</span>
        </div>
        <div className="mini-stat">
          <span className="stat-num">{stats.sessions.toLocaleString()}+</span>
          <span className="stat-label">Sessions</span>
        </div>
        <div className="mini-stat">
          <span className="stat-num">{stats.satisfaction}%</span>
          <span className="stat-label">Satisfaction</span>
        </div>
      </div>
    </div>
  );

  const renderJourney = () => (
    <div className="tab-content-wrapper fade-in">
      <div className="journey-grid">
        <div className="journey-card">
          <div className="icon-badge"><FaLightbulb /></div>
          <h3>The Problem</h3>
          <p>We noticed quality education was limited by geography and time. Students struggled to find experts, and educators lacked a platform.</p>
        </div>
        <div className="journey-connector">
          <FaArrowRight className="connector-icon" />
        </div>
        <div className="journey-card highlight">
          <div className="icon-badge"><FaRocket /></div>
          <h3>The Solution</h3>
          <p>EduBridge was born to democratize education, combining self-paced courses, live tutoring, and gamification.</p>
        </div>
        <div className="journey-connector">
          <FaArrowRight className="connector-icon" />
        </div>
        <div className="journey-card">
          <div className="icon-badge"><FaStar /></div>
          <h3>The Impact</h3>
          <p>Today, we connect thousands of learners with mentors, transforming lives through accessible education.</p>
        </div>
      </div>
    </div>
  );

  const renderOfferings = () => (
    <div className="tab-content-wrapper fade-in">
      <div className="offerings-compact-grid">
        <div className="offering-compact-item">
          <FaBookOpen className="offering-icon" />
          <div className="offering-text">
            <h4>Comprehensive Courses</h4>
            <p>Self-paced video lessons & resources.</p>
          </div>
        </div>
        <div className="offering-compact-item">
          <FaChalkboardTeacher className="offering-icon" />
          <div className="offering-text">
            <h4>Live Tutoring</h4>
            <p>1-on-1 sessions with experts.</p>
          </div>
        </div>
        <div className="offering-compact-item">
          <FaTrophy className="offering-icon" />
          <div className="offering-text">
            <h4>Gamification</h4>
            <p>Earn badges, points & streaks.</p>
          </div>
        </div>
        <div className="offering-compact-item">
          <FaChartLine className="offering-icon" />
          <div className="offering-text">
            <h4>Analytics</h4>
            <p>Track your progress in real-time.</p>
          </div>
        </div>
      </div>
    </div>
  );

  const renderValues = () => (
    <div className="tab-content-wrapper fade-in">
      <div className="values-mosaic">
        <div className="value-tile">
          <FaGlobe className="value-icon" />
          <h3>Accessibility</h3>
          <p>Education for everyone, everywhere.</p>
        </div>
        <div className="value-tile">
          <FaHandshake className="value-icon" />
          <h3>Trust</h3>
          <p>Verified tutors & secure platform.</p>
        </div>
        <div className="value-tile">
          <FaStar className="value-icon" />
          <h3>Quality</h3>
          <p>High standards for all content.</p>
        </div>
        <div className="value-tile">
          <FaSeedling className="value-icon" />
          <h3>Growth</h3>
          <p>Continuous improvement for all.</p>
        </div>
      </div>
    </div>
  );

  const [openFaq, setOpenFaq] = useState(null);
  const toggleFaq = (idx) => setOpenFaq(openFaq === idx ? null : idx);

  const renderFAQ = () => {
    const questions = [
      { q: "How do I get started?", a: "Sign up for free, browse courses, or book a tutor." },
      { q: "Are courses live?", a: "We offer both self-paced courses and live tutoring sessions." },
      { q: "How do points work?", a: "Earn points by completing lessons and quizzes to unlock badges." },
      { q: "Is EduBridge free to use?", a: "Yes! All courses, tutoring sessions, and features are completely free. No payment or subscription required." }
    ];

    return (
      <div className="tab-content-wrapper fade-in">
        <div className="faq-compact-list">
          {questions.map((item, idx) => (
            <div key={idx} className={`faq-compact-item ${openFaq === idx ? 'open' : ''}`} onClick={() => toggleFaq(idx)}>
              <div className="faq-head">
                <span>{item.q}</span>
                <FaChevronDown className="faq-chevron" />
              </div>
              {openFaq === idx && <div className="faq-body">{item.a}</div>}
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="about-interactive-page">
      {/* Compact Hero */}
      <section className="about-compact-hero">
        <div className="hero-bg-accent"></div>
        <div className="container hero-container">
          <h1>
            Empowering Learners, <span className="text-highlight">Connecting Educators</span>
          </h1>
          <p>The future of education is here. Join us.</p>
        </div>
      </section>

      {/* Interactive Tabs Interface */}
      <section className="interactive-tabs-section">
        <div className="container">
          <div className="tabs-nav-container">
            <div className="tabs-nav">
              {tabs.map(tab => (
                <button
                  key={tab.id}
                  className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <span className="tab-icon">{tab.icon}</span>
                  <span className="tab-label">{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="active-content-container">
            {activeTab === 'mission' && renderMission()}
            {activeTab === 'journey' && renderJourney()}
            {activeTab === 'offerings' && renderOfferings()}
            {activeTab === 'values' && renderValues()}
            {activeTab === 'faq' && renderFAQ()}
          </div>
        </div>
      </section>

      {/* Sticky Bottom CTA */}
      <section className="compact-cta-bar">
        <div className="container cta-flex">
          <div className="cta-text">
            <h3>Ready to start?</h3>
            <p>Join thousands of students today.</p>
          </div>
          <div className="cta-buttons">
            <button onClick={() => handleNavigation('/register?role=STUDENT')} className="btn-primary-sm">Start Learning</button>
            <button onClick={() => handleNavigation('/register?role=TUTOR')} className="btn-secondary-sm">Become a Tutor</button>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutUs;
