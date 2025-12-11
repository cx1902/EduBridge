import React from 'react';
import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

const LandingPage = () => {
  const { t } = useTranslation('common');
  
  return (
    <div className="landing-page">
      <section className="hero">
        <div className="container">
          <div className="hero-content">
            <h1>{t('landing.hero.title')}</h1>
            <p>{t('landing.hero.subtitle')}</p>
            <div className="hero-actions">
              <Link to="/register" className="btn btn-primary btn-lg">
                {t('landing.hero.getStarted')}
              </Link>
              <Link to="/courses" className="btn btn-outline btn-lg">
                {t('landing.hero.browseCourses')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <section className="features">
        <div className="container">
          <h2 className="text-center mb-xl">{t('landing.features.title')}</h2>
          <div className="grid grid-cols-3">
            <div className="feature-card card">
              <div className="feature-icon">📚</div>
              <h3>{t('landing.features.selfPaced.title')}</h3>
              <p>{t('landing.features.selfPaced.description')}</p>
            </div>
            <div className="feature-card card">
              <div className="feature-icon">👨‍🏫</div>
              <h3>{t('landing.features.liveTutoring.title')}</h3>
              <p>{t('landing.features.liveTutoring.description')}</p>
            </div>
            <div className="feature-card card">
              <div className="feature-icon">🏆</div>
              <h3>{t('landing.features.gamification.title')}</h3>
              <p>{t('landing.features.gamification.description')}</p>
            </div>
          </div>
        </div>
      </section>

      <section className="cta">
        <div className="container text-center">
          <h2>{t('landing.cta.title')}</h2>
          <p>{t('landing.cta.subtitle')}</p>
          <Link to="/register" className="btn btn-primary btn-lg">
            {t('landing.cta.button')}
          </Link>
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
