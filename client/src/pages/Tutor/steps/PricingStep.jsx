import React from 'react';
import { useTranslation } from 'react-i18next';

const PricingStep = ({ formData, onChange, errors }) => {
  const { t } = useTranslation('common');
  return (
    <div>
      <h2 className="step-title">{t('createCourse.settings.title', 'SEO & Settings')}</h2>
      <p className="step-description">
        {t('createCourse.settings.description', "Optimize your course for search engines and configure final settings. You're almost done!")}
      </p>

      <div className="form-group">
        <label htmlFor="slug">{t('createCourse.settings.fields.slug', 'Custom URL Slug')}</label>
        <input
          type="text"
          id="slug"
          value={formData.slug}
          onChange={(e) => onChange('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
          placeholder={t('createCourse.pricing.placeholders.slug', 'algebra-basics')}
          pattern="[a-z0-9\-]+"
        />
        <small className="form-help">
          {t('createCourse.pricing.help.slugInfo', 'Auto-generated from title if left empty. Use lowercase letters, numbers, and hyphens only.')}
        </small>
        <small className="form-help examples">
          {t('createCourse.pricing.help.slugExamples', 'Example: algebra-basics, essay-writing-101')}
        </small>
      </div>

      <div className={`form-group ${errors.metaDescription ? 'has-error' : ''}`}>
        <label htmlFor="metaDescription">{t('createCourse.pricing.fields.metaDescription', 'Meta Description (SEO)')}</label>
        <textarea
          id="metaDescription"
          value={formData.metaDescription}
          onChange={(e) => onChange('metaDescription', e.target.value)}
          placeholder={t('createCourse.pricing.placeholders.metaDescription', 'Learn algebra fundamentals with clear examples and practice exercises designed for secondary students.')}
          maxLength={160}
          rows={3}
        />
        <small className="form-help">
          {t('createCourse.pricing.help.preview', 'Search engine preview text')}
          <span className="char-count">{formData.metaDescription.length}/160</span>
        </small>
        {errors.metaDescription && (
          <div className="form-error">
            <i className="fas fa-exclamation-circle"></i> {t('createCourse.errors.metaDescription', 'Meta description must not exceed 160 characters.')}
          </div>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="language">{t('createCourse.pricing.fields.language', 'Course Language')}</label>
        <select
          id="language"
          value={formData.language}
          onChange={(e) => onChange('language', e.target.value)}
        >
          <option value="en">{t('createCourse.pricing.lang.en', 'English')}</option>
          <option value="zh-CN">{t('createCourse.pricing.lang.zhCN', 'Chinese (Simplified)')}</option>
          <option value="zh-TW">{t('createCourse.pricing.lang.zhTW', 'Chinese (Traditional)')}</option>
          <option value="ms">{t('createCourse.pricing.lang.ms', 'Malay')}</option>
        </select>
        <small className="form-help">{t('createCourse.pricing.help.language', 'Course delivery language')}</small>
      </div>

      <div className="form-group">
        <label className="checkbox-label" style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', gap: '8px', cursor: 'pointer' }}>
          <input
            type="checkbox"
            required
            style={{ width: 'auto', margin: 0, cursor: 'pointer' }}
          />
          <span style={{ fontWeight: 'normal' }}>
            {t('createCourse.pricing.confirm', 'I confirm this content is original and follows community rules.')}{' '}
            <span className="required">*</span>
          </span>
        </label>
      </div>
    </div>
  );
};

export default PricingStep;
