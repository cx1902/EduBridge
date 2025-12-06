import React from 'react';
import { Link } from 'react-router-dom';

const LandingPage = () => {
  return (
    <div className="landing-page">
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <h1>Transform Your Learning Journey with EduBridge</h1>
            <p>
              Access world-class courses, connect with expert tutors, and achieve your educational goals
              with our comprehensive learning platform.
            </p>
            <div className="hero-actions">
              <Link to="/register" className="btn btn-primary btn-lg">
                Get Started Free
              </Link>
              <Link to="/courses" className="btn btn-outline btn-lg">
                Browse Courses
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="features">
        <div className="container">
          <h2 className="text-center mb-xl">Why Choose EduBridge?</h2>
          <div className="grid grid-cols-3">
            <div className="feature-card card">
              <div className="feature-icon">📚</div>
              <h3>Self-Paced Learning</h3>
              <p>Learn at your own pace with high-quality video lessons and interactive content.</p>
            </div>
            <div className="feature-card card">
              <div className="feature-icon">👨‍🏫</div>
              <h3>Live Tutoring</h3>
              <p>Book one-on-one sessions with expert tutors for personalized guidance.</p>
            </div>
            <div className="feature-card card">
              <div className="feature-icon">🏆</div>
              <h3>Gamification</h3>
              <p>Stay motivated with points, badges, and streaks as you progress.</p>
            </div>
          </div>
        </div>
      </section>

      <section className="cta">
        <div className="container text-center">
          <h2>Ready to Start Learning?</h2>
          <p>Join thousands of students already transforming their education.</p>
          <Link to="/register" className="btn btn-primary btn-lg">
            Create Free Account
          </Link>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
