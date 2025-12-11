import React from 'react';

const PricingStep = ({ formData, onChange, errors }) => {
  return (
    <div>
      <h2 className="step-title">Pricing & SEO</h2>
      <p className="step-description">
        Set your pricing model and optimize your course for search engines. You're almost done!
      </p>

      <div className="form-row">
        <div className={`form-group ${errors.pricingModel ? 'has-error' : ''}`}>
          <label htmlFor="pricingModel">
            Access Type <span className="required">*</span>
          </label>
          <select
            id="pricingModel"
            value={formData.pricingModel}
            onChange={(e) => onChange('pricingModel', e.target.value)}
          >
            <option value="FREE">Free</option>
            <option value="ONE_TIME">One-time Payment</option>
            <option value="SUBSCRIPTION">Subscription</option>
          </select>
          <small className="form-help">Payment model for course access</small>
          {errors.pricingModel && (
            <div className="form-error">
              <i className="fas fa-exclamation-circle"></i> {errors.pricingModel}
            </div>
          )}
        </div>

        {formData.pricingModel !== 'FREE' && (
          <div className={`form-group ${errors.price ? 'has-error' : ''}`}>
            <label htmlFor="price">
              Price (MYR) <span className="required">*</span>
            </label>
            <input
              type="number"
              id="price"
              value={formData.price}
              onChange={(e) => onChange('price', e.target.value)}
              min="0"
              step="0.01"
              placeholder="0.00"
            />
            <small className="form-help">Course price in Malaysian Ringgit</small>
            {errors.price && (
              <div className="form-error">
                <i className="fas fa-exclamation-circle"></i> {errors.price}
              </div>
            )}
          </div>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="slug">Custom URL Slug</label>
        <input
          type="text"
          id="slug"
          value={formData.slug}
          onChange={(e) => onChange('slug', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))}
          placeholder="algebra-basics"
          pattern="[a-z0-9-]+"
        />
        <small className="form-help">
          Auto-generated from title if left empty. Use lowercase letters, numbers, and hyphens only.
        </small>
        <small className="form-help examples">
          Example: algebra-basics, essay-writing-101
        </small>
      </div>

      <div className={`form-group ${errors.metaDescription ? 'has-error' : ''}`}>
        <label htmlFor="metaDescription">Meta Description (SEO)</label>
        <textarea
          id="metaDescription"
          value={formData.metaDescription}
          onChange={(e) => onChange('metaDescription', e.target.value)}
          placeholder="Learn algebra fundamentals with clear examples and practice exercises designed for secondary students."
          maxLength={160}
          rows={3}
        />
        <small className="form-help">
          Search engine preview text
          <span className="char-count">{formData.metaDescription.length}/160</span>
        </small>
        {errors.metaDescription && (
          <div className="form-error">
            <i className="fas fa-exclamation-circle"></i> {errors.metaDescription}
          </div>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="language">Course Language</label>
        <select
          id="language"
          value={formData.language}
          onChange={(e) => onChange('language', e.target.value)}
        >
          <option value="en">English</option>
          <option value="zh-CN">Chinese (Simplified)</option>
          <option value="zh-TW">Chinese (Traditional)</option>
          <option value="ms">Malay</option>
        </select>
        <small className="form-help">Course delivery language</small>
      </div>

      <div className="form-group">
        <label className="checkbox-label">
          <input type="checkbox" required />
          <span>
            I confirm this content is original and follows community rules.{' '}
            <span className="required">*</span>
          </span>
        </label>
      </div>
    </div>
  );
};

export default PricingStep;
