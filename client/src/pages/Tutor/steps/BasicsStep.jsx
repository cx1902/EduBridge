import React from 'react';

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

  return (
    <div>
      <h2 className="step-title">Basic Information</h2>
      <p className="step-description">
        Let's start with the fundamentals of your course. This information helps students find
        and understand your course.
      </p>

      <div className={`form-group ${errors.title ? 'has-error' : ''}`}>
        <label htmlFor="title">
          Course Title <span className="required">*</span>
        </label>
        <input
          type="text"
          id="title"
          value={formData.title}
          onChange={(e) => onChange('title', e.target.value)}
          placeholder="e.g., Algebra Basics"
          maxLength={80}
        />
        <small className="form-help">
          What is the course name?
          <span className="char-count">
            {formData.title.length}/80
          </span>
        </small>
        <small className="form-help examples">
          Examples: "Algebra Basics", "Essay Writing for Beginners", "SPM Physics: Forces"
        </small>
        {errors.title && <div className="form-error"><i className="fas fa-exclamation-circle"></i> {errors.title}</div>}
      </div>

      <div className={`form-group ${errors.subtitle ? 'has-error' : ''}`}>
        <label htmlFor="subtitle">Short Subtitle</label>
        <input
          type="text"
          id="subtitle"
          value={formData.subtitle}
          onChange={(e) => onChange('subtitle', e.target.value)}
          placeholder="e.g., Master algebra basics in 2 weeks"
          maxLength={120}
        />
        <small className="form-help">
          One sentence promise for your students
          <span className="char-count">
            {formData.subtitle.length}/120
          </span>
        </small>
        {errors.subtitle && <div className="form-error"><i className="fas fa-exclamation-circle"></i> {errors.subtitle}</div>}
      </div>

      <div className="form-row">
        <div className={`form-group ${errors.educationLevel ? 'has-error' : ''}`}>
          <label htmlFor="educationLevel">
            Education Level <span className="required">*</span>
          </label>
          <select
            id="educationLevel"
            value={formData.educationLevel}
            onChange={(e) => onChange('educationLevel', e.target.value)}
          >
            <option value="PRIMARY">Primary</option>
            <option value="SECONDARY">Secondary</option>
            <option value="UNIVERSITY">University</option>
          </select>
          <small className="form-help">Who is this course for?</small>
          {errors.educationLevel && <div className="form-error"><i className="fas fa-exclamation-circle"></i> {errors.educationLevel}</div>}
        </div>

        <div className={`form-group ${errors.subjectCategory ? 'has-error' : ''}`}>
          <label htmlFor="subjectCategory">
            Subject <span className="required">*</span>
          </label>
          <input
            type="text"
            id="subjectCategory"
            value={formData.subjectCategory}
            onChange={(e) => onChange('subjectCategory', e.target.value)}
            placeholder="e.g., Mathematics, Science, English"
          />
          <small className="form-help">Pick the subject</small>
          {errors.subjectCategory && <div className="form-error"><i className="fas fa-exclamation-circle"></i> {errors.subjectCategory}</div>}
        </div>
      </div>

      <div className={`form-group ${errors.tags ? 'has-error' : ''}`}>
        <label htmlFor="tags">Keywords/Tags (max 5)</label>
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
            placeholder={formData.tags.length < 5 ? 'Type and press Enter' : 'Max 5 tags'}
            onKeyDown={handleTagInput}
            disabled={formData.tags.length >= 5}
          />
        </div>
        <small className="form-help">
          Add keywords (comma or enter separated)
        </small>
        <small className="form-help examples">
          Examples: algebra, equations, beginner
        </small>
        {errors.tags && <div className="form-error"><i className="fas fa-exclamation-circle"></i> {errors.tags}</div>}
      </div>
    </div>
  );
};

export default BasicsStep;
