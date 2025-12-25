import React from 'react';
import { useTranslation } from 'react-i18next';

const BasicsStep = ({ formData, onChange, errors }) => {
  const handleTagInput = (e) => {
    if (e.key === 'Enter' || e.key === ',') {
      e.preventDefault();
      const value = e.target.value.trim();
      if (value && formData.tags.length < 5 && !formData.tags.includes(value)) {
        onChange('tags', [...formData.tags, value]);
        e.target.value = '';
      }
    }
  };

  const removeTag = (tagToRemove) => {
    onChange(
      'tags',
      formData.tags.filter((tag) => tag !== tagToRemove)
    );
  };

  const { t } = useTranslation('common');
  return (
    <div>
      <h2 className="step-title">{t('createCourse.basics.title', 'Basic Information')}</h2>
      <p className="step-description">
        {t('createCourse.basics.description', "Let's start with the fundamentals of your course. This information helps students find and understand your course.")}
      </p>

      <div className={`form-group ${errors.title ? 'has-error' : ''}`}>
        <label htmlFor="title">
          {t('createCourse.basics.fields.title', 'Course Title')} <span className="required">*</span>
        </label>
        <input
          type="text"
          id="title"
          value={formData.title}
          onChange={(e) => onChange('title', e.target.value)}
          placeholder={t('createCourse.basics.placeholders.title', 'e.g., Algebra Basics')}
          maxLength={80}
        />
        <small className="form-help">
          {t('createCourse.basics.help.whatIsName', 'What is the course name?')}
          <span className="char-count">
            {formData.title.length}/80
          </span>
        </small>
        <small className="form-help examples">
          {t('createCourse.basics.help.examples', 'Examples: \"Algebra Basics\", \"Essay Writing for Beginners\", \"SPM Physics: Forces\"')}
        </small>
        {errors.title && <div className="form-error"><i className="fas fa-exclamation-circle"></i> {t('createCourse.errors.title', 'Title must be between 3-80 characters.')}</div>}
      </div>

      <div className={`form-group ${errors.subtitle ? 'has-error' : ''}`}>
        <label htmlFor="subtitle">{t('createCourse.basics.fields.subtitle', 'Short Subtitle')}</label>
        <input
          type="text"
          id="subtitle"
          value={formData.subtitle}
          onChange={(e) => onChange('subtitle', e.target.value)}
          placeholder={t('createCourse.basics.placeholders.subtitle', 'e.g., Master algebra basics in 2 weeks')}
          maxLength={120}
        />
        <small className="form-help">
          {t('createCourse.basics.help.oneSentence', 'One sentence promise for your students')}
          <span className="char-count">
            {formData.subtitle.length}/120
          </span>
        </small>
        {errors.subtitle && <div className="form-error"><i className="fas fa-exclamation-circle"></i> {t('createCourse.errors.subtitle', 'Subtitle must not exceed 120 characters.')}</div>}
      </div>

      <div className="form-row">
        <div className={`form-group ${errors.educationLevel ? 'has-error' : ''}`}>
          <label htmlFor="educationLevel">
            {t('createCourse.basics.fields.educationLevel', 'Education Level')} <span className="required">*</span>
          </label>
          <select
            id="educationLevel"
            value={formData.educationLevel}
            onChange={(e) => onChange('educationLevel', e.target.value)}
          >
            <option value="PRIMARY">{t('createCourse.basics.level.primary', 'Primary')}</option>
            <option value="SECONDARY">{t('createCourse.basics.level.secondary', 'Secondary')}</option>
            <option value="UNIVERSITY">{t('createCourse.basics.level.university', 'University')}</option>
          </select>
          <small className="form-help">{t('createCourse.basics.help.whoFor', 'Who is this course for?')}</small>
          {errors.educationLevel && <div className="form-error"><i className="fas fa-exclamation-circle"></i> {t('createCourse.errors.educationLevel', 'Education level is required.')}</div>}
        </div>

        <div className={`form-group ${errors.subjectCategory ? 'has-error' : ''}`}>
          <label htmlFor="subjectCategory">
            {t('createCourse.basics.fields.subject', 'Subject')} <span className="required">*</span>
          </label>
          <input
            type="text"
            id="subjectCategory"
            value={formData.subjectCategory}
            onChange={(e) => onChange('subjectCategory', e.target.value)}
            placeholder="e.g., Mathematics, Science, English"
          />
          <small className="form-help">{t('createCourse.basics.help.pickSubject', 'Pick the subject')}</small>
          {errors.subjectCategory && <div className="form-error"><i className="fas fa-exclamation-circle"></i> {t('createCourse.errors.subject', 'Subject is required.')}</div>}
        </div>
      </div>

      <div className={`form-group ${errors.tags ? 'has-error' : ''}`}>
        <label htmlFor="tags">{t('createCourse.basics.fields.tags', 'Keywords/Tags (max 5)')}</label>
        <div className={`tags-container ${errors.tags ? 'has-error' : ''}`}>
          {formData.tags.map((tag, index) => (
            <div key={index} className="tag-item">
              <span>{tag}</span>
              <button type="button" onClick={() => removeTag(tag)}>
                ×
              </button>
            </div>
          ))}
          <input
            type="text"
            placeholder={formData.tags.length < 5 ? t('createCourse.basics.placeholders.tagInput', 'Type and press Enter') : t('createCourse.basics.placeholders.tagMax', 'Max 5 tags')}
            onKeyDown={handleTagInput}
            disabled={formData.tags.length >= 5}
          />
        </div>
        <small className="form-help">
          {t('createCourse.basics.help.addKeywords', 'Add keywords (comma or enter separated)')}
        </small>
        <small className="form-help examples">
          {t('createCourse.basics.help.tagsExamples', 'Examples: algebra, equations, beginner')}
        </small>
        {errors.tags && <div className="form-error"><i className="fas fa-exclamation-circle"></i> {t('createCourse.errors.tags', 'Tags cannot exceed 5 items.')}</div>}
      </div>
    </div>
  );
};

export default BasicsStep;
