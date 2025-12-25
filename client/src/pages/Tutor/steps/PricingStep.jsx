import React from 'react';
import { useTranslation } from 'react-i18next';

const PricingStep = ({ formData, onChange, errors }) => {
  const { t } = useTranslation('common');
  return (
    <div>
      <h2 className="step-title">{t('createCourse.pricing.title', 'Pricing & SEO')}</h2>
      <p className="step-description">
        {t('createCourse.pricing.description', "Set your pricing model and optimize your course for search engines. You're almost done!")}
      </p>

      <div className="form-row">
        <div className={`form-group ${errors.pricingModel ? 'has-error' : ''}`}>
          <label htmlFor="pricingModel">
            {t('createCourse.pricing.fields.accessType', 'Access Type')} <span className="required">*</span>
          </label>
          <select
            id="pricingModel"
            value={formData.pricingModel}
            onChange={(e) => onChange('pricingModel', e.target.value)}
          >
            <option value="FREE">{t('createCourse.pricing.access.free', 'Free')}</option>
            <option value="ONE_TIME">{t('createCourse.pricing.access.oneTime', 'One-time Payment')}</option>
            <option value="SUBSCRIPTION">{t('createCourse.pricing.access.subscription', 'Subscription')}</option>
          </select>
          <small className="form-help">{t('createCourse.pricing.help.paymentModel', 'Payment model for course access')}</small>
          {errors.pricingModel && (
            <div className="form-error">
              <i className="fas fa-exclamation-circle"></i> {t('createCourse.errors.pricingModel', 'Pricing model is required.')}
            </div>
          )}
        </div>

        {formData.pricingModel !== 'FREE' && (
          <div className={`form-group ${errors.price ? 'has-error' : ''}`}>
            <label htmlFor="price">
              {t('createCourse.pricing.fields.price', 'Price (MYR)')} <span className="required">*</span>
            </label>
            <input
              type="number"
              id="price"
              value={formData.price}
              onChange={(e) => onChange('price', e.target.value)}
              min="0"
              step="0.01"
              placeholder={t('createCourse.pricing.placeholders.price', '0.00')}
            />
            <small className="form-help">{t('createCourse.pricing.help.priceCurrency', 'Course price in Malaysian Ringgit')}</small>
            {errors.price && (
              <div className="form-error">
                <i className="fas fa-exclamation-circle"></i> {t('createCourse.errors.price', 'Price must be greater than 0 for paid courses.')}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="slug">{t('createCourse.pricing.fields.slug', 'Custom URL Slug')}</label>
        <input
          type="text"
          id="slug"
          value={formData.slug}
          onChange={(e) => onChange('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
          placeholder={t('createCourse.pricing.placeholders.slug', 'algebra-basics')}
          pattern="[a-z0-9-]+"
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
        <label className="checkbox-label">
          <input type="checkbox" required />
          <span>
            {t('createCourse.pricing.confirm', 'I confirm this content is original and follows community rules.')}{' '}
            <span className="required">*</span>
          </span>
        </label>
      </div>
    </div>
  );
};

export default PricingStep;
