import React, { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import './AboutUs.css';

const AboutUs = () => {
  const { t } = useTranslation('common');
  const location = useLocation();
  const [stats, setStats] = useState({
    learners: 0,
    sessions: 0,
    quizzes: 0,
    satisfaction: 0
  });
  const [openFaq, setOpenFaq] = useState(null);

  // Animate stats on mount
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
      
      setStats({
        learners: Math.floor(targetStats.learners * progress),
        sessions: Math.floor(targetStats.sessions * progress),
        quizzes: Math.floor(targetStats.quizzes * progress),
        satisfaction: Math.floor(targetStats.satisfaction * progress)
      });

      if (currentStep >= steps) {
        clearInterval(interval);
        setStats(targetStats);
      }
    }, stepDuration);

    return () => clearInterval(interval);
  }, []);

  // Scroll to section when hash present
  useEffect(() => {
    if (location.hash) {
      const el = document.querySelector(location.hash);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }, [location]);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const faqs = [
    {
      question: t('about.faq.items.0.question', 'How do I get started with EduBridge?'),
      answer: t('about.faq.items.0.answer', "Simply sign up for a free account, browse our course catalog, and enroll in courses that interest you. You can also book live tutoring sessions with our expert tutors.")
    },
    {
      question: t('about.faq.items.1.question', 'Are the courses self-paced or scheduled?'),
      answer: t('about.faq.items.1.answer', "We offer both! Self-paced courses allow you to learn at your own speed, while live tutoring sessions are scheduled at specific times for real-time interaction with tutors.")
    },
    {
      question: t('about.faq.items.2.question', 'How does the gamification system work?'),
      answer: t('about.faq.items.2.answer', "Earn points for completing lessons, quizzes, and maintaining learning streaks. Unlock badges and climb leaderboards to stay motivated. Points can also unlock special features and recognition.")
    },
    {
      question: t('about.faq.items.3.question', 'What qualifications do your tutors have?'),
      answer: t('about.faq.items.3.answer', "All our tutors go through a rigorous screening process. They must have proven expertise in their subject area, excellent teaching reviews, and pass our quality assessment before being approved to teach on the platform.")
    },
    {
      question: t('about.faq.items.4.question', 'Is there a refund policy?'),
      answer: t('about.faq.items.4.answer', "Yes! If you're not satisfied with a paid course within the first 30 days, we offer a full refund. We're committed to ensuring quality education and student satisfaction.")
    }
  ];

  return (
    <div className="about-page">
      {/* Hero Section */}
      <section className="about-hero">
        <div className="about-hero-background">
          <div className="gradient-orb orb-1"></div>
          <div className="gradient-orb orb-2"></div>
        </div>
        <div className="container">
          <div className="about-hero-content">
            <h1 className="about-hero-title">{t('about.hero.title', 'Empowering Learners, Connecting Educators')}</h1>
            <p className="about-hero-subtitle">
              {t('about.hero.subtitle', 'Join thousands of students and tutors building the future of education together')}
            </p>
            <div className="about-hero-actions">
              <Link to="/register?role=STUDENT" className="btn-modern btn-primary-modern">
                <span>{t('about.hero.joinStudent', 'Join as Student')}</span>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
              <Link to="/register?role=TUTOR" className="btn-modern btn-outline-modern">
                <span>{t('about.hero.becomeTutor', 'Become a Tutor')}</span>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Our Mission */}
      <section className="mission-section">
        <div className="container">
            <div className="mission-content">
              <div className="mission-icon">🎯</div>
              <h2 className="mission-title">{t('about.mission.title', 'Our Mission')}</h2>
              <p className="mission-text">{t('about.mission.text', 'To bridge the gap between passionate learners and expert educators, creating a seamless, engaging platform where knowledge flows freely and everyone can achieve their full potential.')}</p>
          </div>
        </div>
      </section>

      {/* Our Story */}
      <section className="story-section">
        <div className="container">
          <div className="story-grid">
            <div className="story-content">
              <h2 className="section-title">{t('about.story.title', 'Our Story')}</h2>
              <div className="story-timeline">
                <div className="story-item">
                  <div className="story-icon">💡</div>
                  <div className="story-text">
                    <h3>{t('about.story.problem.title', 'The Problem')}</h3>
                    <p>{t('about.story.problem.text', 'We noticed that quality education was often limited by geography, time constraints, and accessibility. Students struggled to find expert tutors, and talented educators lacked a platform to reach eager learners.')}</p>
                  </div>
                </div>
                <div className="story-item">
                  <div className="story-icon">🚀</div>
                  <div className="story-text">
                    <h3>{t('about.story.solution.title', 'The Solution')}</h3>
                    <p>{t('about.story.solution.text', 'EduBridge was born from the vision to democratize education. We built a comprehensive platform combining self-paced courses, live tutoring, interactive quizzes, and gamification to create an engaging learning experience accessible to everyone, anywhere.')}</p>
                  </div>
                </div>
                <div className="story-item">
                  <div className="story-icon">🌟</div>
                  <div className="story-text">
                    <h3>{t('about.story.impact.title', 'The Impact')}</h3>
                    <p>{t('about.story.impact.text', "Today, we're proud to connect thousands of students with expert tutors, creating meaningful learning experiences that transform lives and build brighter futures.")}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* What We Offer */}
      <section id="offerings" className="offerings-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">{t('about.offerings.title', 'What We Offer')}</h2>
            <p className="section-subtitle">{t('about.offerings.subtitle', 'Everything you need for a complete learning experience')}</p>
          </div>
          <div className="offerings-grid">
            <div className="offering-card">
              <div className="offering-icon">📚</div>
              <h3>{t('about.offerings.courses.title', 'Comprehensive Courses')}</h3>
              <p>{t('about.offerings.courses.text', 'Access hundreds of high-quality courses across various subjects and skill levels, created by expert tutors and industry professionals.')}</p>
              <ul className="offering-features">
                <li>{t('about.offerings.courses.features.selfPaced', 'Self-paced learning')}</li>
                <li>{t('about.offerings.courses.features.videoLessons', 'Video lessons')}</li>
                <li>{t('about.offerings.courses.features.resources', 'Downloadable resources')}</li>
                <li>{t('about.offerings.courses.features.lifetimeAccess', 'Lifetime access')}</li>
              </ul>
            </div>
            <div className="offering-card">
              <div className="offering-icon">👨‍🏫</div>
              <h3>{t('about.offerings.liveTutoring.title', 'Live Tutoring')}</h3>
              <p>{t('about.offerings.liveTutoring.text', 'Book one-on-one or group sessions with expert tutors for personalized guidance and real-time interaction.')}</p>
              <ul className="offering-features">
                <li>{t('about.offerings.liveTutoring.features.flexibleScheduling', 'Flexible scheduling')}</li>
                <li>{t('about.offerings.liveTutoring.features.screenSharing', 'Screen sharing')}</li>
                <li>{t('about.offerings.liveTutoring.features.whiteboard', 'Interactive whiteboard')}</li>
                <li>{t('about.offerings.liveTutoring.features.recordings', 'Session recordings')}</li>
              </ul>
            </div>
            <div className="offering-card">
              <div className="offering-icon">📝</div>
              <h3>{t('about.offerings.quizzes.title', 'Interactive Quizzes')}</h3>
              <p>{t('about.offerings.quizzes.text', 'Test your knowledge with engaging quizzes, get instant feedback, and track your progress over time.')}</p>
              <ul className="offering-features">
                <li>{t('about.offerings.quizzes.features.multipleTypes', 'Multiple question types')}</li>
                <li>{t('about.offerings.quizzes.features.instantGrading', 'Instant grading')}</li>
                <li>{t('about.offerings.quizzes.features.explanations', 'Detailed explanations')}</li>
                <li>{t('about.offerings.quizzes.features.progressTracking', 'Progress tracking')}</li>
              </ul>
            </div>
            <div className="offering-card">
              <div className="offering-icon">🏆</div>
              <h3>{t('about.offerings.gamification.title', 'Gamification')}</h3>
              <p>{t('about.offerings.gamification.text', 'Stay motivated with points, badges, streaks, and leaderboards that make learning fun and rewarding.')}</p>
              <ul className="offering-features">
                <li>{t('about.offerings.gamification.features.pointsRewards', 'Points & rewards')}</li>
                <li>{t('about.offerings.gamification.features.badges', 'Achievement badges')}</li>
                <li>{t('about.offerings.gamification.features.streaks', 'Learning streaks')}</li>
                <li>{t('about.offerings.gamification.features.leaderboards', 'Leaderboards')}</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="how-it-works">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">{t('about.how.title', 'How EduBridge Works')}</h2>
            <p className="section-subtitle">{t('about.how.subtitle', 'Get started in four simple steps')}</p>
          </div>
          <div className="steps-container">
            <div className="step-card">
              <div className="step-number">1</div>
              <div className="step-icon">✍️</div>
              <h3 className="step-title">{t('about.how.steps.signUp.title', 'Sign Up')}</h3>
              <p className="step-description">{t('about.how.steps.signUp.text', 'Create your free account in seconds. Choose to join as a student to learn or as a tutor to teach.')}</p>
            </div>
            <div className="step-card">
              <div className="step-number">2</div>
              <div className="step-icon">🔍</div>
              <h3 className="step-title">{t('about.how.steps.choose.title', 'Choose Subject')}</h3>
              <p className="step-description">{t('about.how.steps.choose.text', 'Browse our extensive catalog of courses and tutors. Filter by subject, level, price, and ratings.')}</p>
            </div>
            <div className="step-card">
              <div className="step-number">3</div>
              <div className="step-icon">📖</div>
              <h3 className="step-title">{t('about.how.steps.learn.title', 'Learn & Practice')}</h3>
              <p className="step-description">{t('about.how.steps.learn.text', 'Engage with video lessons, complete quizzes, join live sessions, and practice your new skills.')}</p>
            </div>
            <div className="step-card">
              <div className="step-number">4</div>
              <div className="step-icon">📊</div>
              <h3 className="step-title">{t('about.how.steps.track.title', 'Track Progress')}</h3>
              <p className="step-description">{t('about.how.steps.track.text', 'Monitor your learning journey with detailed analytics, earn badges, and celebrate your achievements.')}</p>
            </div>
          </div>
        </div>
      </section>

      {/* Our Values */}
      <section className="values-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">{t('about.values.title', 'Our Core Values')}</h2>
            <p className="section-subtitle">{t('about.values.subtitle', 'The principles that guide everything we do')}</p>
          </div>
          <div className="values-grid">
            <div className="value-card">
              <div className="value-icon">🌐</div>
              <h3>{t('about.values.accessibility.title', 'Accessibility')}</h3>
              <p>{t('about.values.accessibility.text', 'Education should be available to everyone, everywhere. We break down barriers and make learning accessible to all.')}</p>
            </div>
            <div className="value-card">
              <div className="value-icon">🤝</div>
              <h3>{t('about.values.trust.title', 'Trust')}</h3>
              <p>{t('about.values.trust.text', 'We build trust through transparency, verified tutors, secure payments, and reliable support for our community.')}</p>
            </div>
            <div className="value-card">
              <div className="value-icon">⭐</div>
              <h3>{t('about.values.quality.title', 'Quality')}</h3>
              <p>{t('about.values.quality.text', 'We maintain high standards through rigorous tutor screening, content review, and continuous improvement.')}</p>
            </div>
            <div className="value-card">
              <div className="value-icon">🌱</div>
              <h3>{t('about.values.growth.title', 'Growth')}</h3>
              <p>{t('about.values.growth.text', "We're committed to the continuous growth of our students, tutors, and platform through innovation and feedback.")}</p>
            </div>
          </div>
        </div>
      </section>

      {/* For Students / For Tutors */}
      <section className="benefits-section">
        <div className="container">
          <div className="benefits-grid">
            <div className="benefit-column">
              <div className="benefit-icon-large">👨‍🎓</div>
              <h2>{t('about.benefits.students.title', 'For Students')}</h2>
              <ul className="benefit-list">
                <li>
                  <span className="benefit-check">✓</span>
                  <span>{t('about.benefits.students.items.0', 'Access to 500+ quality courses')}</span>
                </li>
                <li>
                  <span className="benefit-check">✓</span>
                  <span>{t('about.benefits.students.items.1', 'Learn at your own pace, anytime')}</span>
                </li>
                <li>
                  <span className="benefit-check">✓</span>
                  <span>{t('about.benefits.students.items.2', 'Book live sessions with expert tutors')}</span>
                </li>
                <li>
                  <span className="benefit-check">✓</span>
                  <span>{t('about.benefits.students.items.3', 'Earn points, badges, and certificates')}</span>
                </li>
                <li>
                  <span className="benefit-check">✓</span>
                  <span>{t('about.benefits.students.items.4', 'Track your progress with analytics')}</span>
                </li>
                <li>
                  <span className="benefit-check">✓</span>
                  <span>{t('about.benefits.students.items.5', 'Join a supportive learning community')}</span>
                </li>
                <li>
                  <span className="benefit-check">✓</span>
                  <span>{t('about.benefits.students.items.6', '30-day money-back guarantee')}</span>
                </li>
              </ul>
              <Link to="/register?role=STUDENT" className="btn-modern btn-primary-modern">
                {t('about.benefits.students.cta', 'Start Learning')}
              </Link>
            </div>
            <div className="benefit-column">
              <div className="benefit-icon-large">👨‍🏫</div>
              <h2>{t('about.benefits.tutors.title', 'For Tutors')}</h2>
              <ul className="benefit-list">
                <li>
                  <span className="benefit-check">✓</span>
                  <span>{t('about.benefits.tutors.items.0', 'Reach thousands of eager students')}</span>
                </li>
                <li>
                  <span className="benefit-check">✓</span>
                  <span>{t('about.benefits.tutors.items.1', 'Create and sell your own courses')}</span>
                </li>
                <li>
                  <span className="benefit-check">✓</span>
                  <span>{t('about.benefits.tutors.items.2', 'Set your own schedule and rates')}</span>
                </li>
                <li>
                  <span className="benefit-check">✓</span>
                  <span>{t('about.benefits.tutors.items.3', 'Earn competitive income teaching')}</span>
                </li>
                <li>
                  <span className="benefit-check">✓</span>
                  <span>{t('about.benefits.tutors.items.4', 'Access powerful teaching tools')}</span>
                </li>
                <li>
                  <span className="benefit-check">✓</span>
                  <span>{t('about.benefits.tutors.items.5', 'Build your professional reputation')}</span>
                </li>
                <li>
                  <span className="benefit-check">✓</span>
                  <span>{t('about.benefits.tutors.items.6', 'Secure payment processing')}</span>
                </li>
              </ul>
              <Link to="/register?role=TUTOR" className="btn-modern btn-outline-modern">
                {t('about.benefits.tutors.cta', 'Become a Tutor')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Quality & Safety */}
      <section className="quality-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">{t('about.quality.title', 'Quality & Safety')}</h2>
            <p className="section-subtitle">{t('about.quality.subtitle', 'Your trust and safety are our top priorities')}</p>
          </div>
          <div className="quality-grid">
            <div className="quality-card">
              <div className="quality-icon">🔍</div>
              <h3>{t('about.quality.tutorScreening.title', 'Tutor Screening')}</h3>
              <p>{t('about.quality.tutorScreening.text', 'Every tutor undergoes a comprehensive verification process including:')}</p>
              <ul>
                <li>{t('about.quality.tutorScreening.items.0', 'Identity verification')}</li>
                <li>{t('about.quality.tutorScreening.items.1', 'Qualification validation')}</li>
                <li>{t('about.quality.tutorScreening.items.2', 'Background checks')}</li>
                <li>{t('about.quality.tutorScreening.items.3', 'Teaching assessment')}</li>
                <li>{t('about.quality.tutorScreening.items.4', 'Trial lesson evaluation')}</li>
              </ul>
            </div>
            <div className="quality-card">
              <div className="quality-icon">✅</div>
              <h3>{t('about.quality.contentReview.title', 'Content Review')}</h3>
              <p>{t('about.quality.contentReview.text', 'All courses are reviewed for quality before publication:')}</p>
              <ul>
                <li>{t('about.quality.contentReview.items.0', 'Curriculum validation')}</li>
                <li>{t('about.quality.contentReview.items.1', 'Accuracy verification')}</li>
                <li>{t('about.quality.contentReview.items.2', 'Quality standards check')}</li>
                <li>{t('about.quality.contentReview.items.3', 'Student feedback integration')}</li>
                <li>{t('about.quality.contentReview.items.4', 'Regular updates required')}</li>
              </ul>
            </div>
            <div className="quality-card">
              <div className="quality-icon">🛡️</div>
              <h3>{t('about.quality.studentProtection.title', 'Student Protection')}</h3>
              <p>{t('about.quality.studentProtection.text', 'We protect our students with comprehensive policies:')}</p>
              <ul>
                <li>{t('about.quality.studentProtection.items.0', '30-day money-back guarantee')}</li>
                <li>{t('about.quality.studentProtection.items.1', 'Secure payment processing')}</li>
                <li>{t('about.quality.studentProtection.items.2', '24/7 customer support')}</li>
                <li>{t('about.quality.studentProtection.items.3', 'Dispute resolution process')}</li>
                <li>{t('about.quality.studentProtection.items.4', 'Privacy protection')}</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Impact Stats */}
      <section className="impact-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">{t('about.impact.title', 'Our Impact')}</h2>
            <p className="section-subtitle">{t('about.impact.subtitle', 'Making a difference in education worldwide')}</p>
          </div>
          <div className="impact-grid">
            <div className="impact-card">
              <div className="impact-number">{stats.learners.toLocaleString()}+</div>
              <div className="impact-label">{t('about.impact.cards.activeLearners.label', 'Active Learners')}</div>
              <div className="impact-description">{t('about.impact.cards.activeLearners.desc', 'Students actively learning on our platform')}</div>
            </div>
            <div className="impact-card">
              <div className="impact-number">{stats.sessions.toLocaleString()}+</div>
              <div className="impact-label">{t('about.impact.cards.liveSessions.label', 'Live Sessions')}</div>
              <div className="impact-description">{t('about.impact.cards.liveSessions.desc', 'One-on-one tutoring sessions completed')}</div>
            </div>
            <div className="impact-card">
              <div className="impact-number">{stats.quizzes.toLocaleString()}+</div>
              <div className="impact-label">{t('about.impact.cards.quizCompletions.label', 'Quiz Completions')}</div>
              <div className="impact-description">{t('about.impact.cards.quizCompletions.desc', 'Quizzes taken and knowledge tested')}</div>
            </div>
            <div className="impact-card">
              <div className="impact-number">{stats.satisfaction}%</div>
              <div className="impact-label">{t('about.impact.cards.satisfaction.label', 'Satisfaction Score')}</div>
              <div className="impact-description">{t('about.impact.cards.satisfaction.desc', 'Students who would recommend us')}</div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="faq-section">
        <div className="container">
          <div className="section-header">
            <h2 className="section-title">{t('about.faq.title', 'Frequently Asked Questions')}</h2>
            <p className="section-subtitle">{t('about.faq.subtitle', 'Everything you need to know about EduBridge')}</p>
          </div>
          <div className="faq-container">
            {faqs.map((faq, index) => (
              <div 
                key={index} 
                className={`faq-item ${openFaq === index ? 'active' : ''}`}
                onClick={() => toggleFaq(index)}
              >
                <div className="faq-question">
                  <h3>{faq.question}</h3>
                  <svg 
                    className={`faq-icon ${openFaq === index ? 'rotated' : ''}`}
                    width="24" 
                    height="24" 
                    viewBox="0 0 24 24" 
                    fill="none"
                  >
                    <path 
                      d="M6 9L12 15L18 9" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <div className="faq-answer">
                  <p>{faq.answer}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="faq-contact">
            <p>{t('about.faq.stillHaveQuestions', 'Still have questions?')}</p>
            <Link to="/contact" className="btn-modern btn-outline-modern">
              {t('about.faq.contactUs', 'Contact Us')}
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="final-cta">
        <div className="cta-background">
          <div className="cta-orb cta-orb-1"></div>
          <div className="cta-orb cta-orb-2"></div>
        </div>
        <div className="container">
          <div className="final-cta-content">
            <h2 className="final-cta-title">{t('about.finalCta.title', 'Ready to Transform Your Learning Journey?')}</h2>
            <p className="final-cta-subtitle">
              {t('about.finalCta.subtitle', 'Join thousands of students and tutors already making a difference')}
            </p>
            <div className="final-cta-actions">
              <Link to="/register?role=STUDENT" className="btn-modern btn-cta-modern">
                <span>{t('about.finalCta.learnCta', 'Start Learning Today')}</span>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
              <Link to="/register?role=TUTOR" className="btn-modern btn-outline-modern">
                <span>{t('about.finalCta.tutorCta', 'Apply as a Tutor')}</span>
                <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                  <path d="M7.5 15L12.5 10L7.5 5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
            </div>
            <p className="cta-note">✨ {t('about.finalCta.note', 'Free to join • No credit card required • Start in minutes')}</p>
          </div>
        </div>
      </section>
    </div>
  );
};

export default AboutUs;
