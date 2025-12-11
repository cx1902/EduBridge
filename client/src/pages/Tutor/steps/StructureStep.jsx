import React from 'react';

const StructureStep = ({ formData, onChange, errors }) => {
  return (
    <div>
      <h2 className="step-title">Structure & Media</h2>
      <p className="step-description">
        Define the course scope and add visual elements to attract students. These details help
        set proper expectations.
      </p>

      <div className="form-row">
        <div className={`form-group ${errors.estimatedHours ? 'has-error' : ''}`}>
          <label htmlFor="estimatedHours">Estimated Total Time (hours)</label>
          <input
            type="number"
            id="estimatedHours"
            value={formData.estimatedHours}
            onChange={(e) => onChange('estimatedHours', e.target.value)}
            min="0"
            step="1"
            placeholder="e.g., 6"
          />
          <small className="form-help">Time students should expect to complete the course</small>
          {errors.estimatedHours && (
            <div className="form-error">
              <i className="fas fa-exclamation-circle"></i> {errors.estimatedHours}
            </div>
          )}
        </div>

        <div className={`form-group ${errors.difficulty ? 'has-error' : ''}`}>
          <label htmlFor="difficulty">
            Difficulty Level <span className="required">*</span>
          </label>
          <select
            id="difficulty"
            value={formData.difficulty}
            onChange={(e) => onChange('difficulty', e.target.value)}
          >
            <option value="BEGINNER">Beginner</option>
            <option value="INTERMEDIATE">Intermediate</option>
            <option value="ADVANCED">Advanced</option>
          </select>
          <small className="form-help">Skill level expectation</small>
          {errors.difficulty && (
            <div className="form-error">
              <i className="fas fa-exclamation-circle"></i> {errors.difficulty}
            </div>
          )}
        </div>
      </div>

      <div className={`form-group ${errors.thumbnailUrl ? 'has-error' : ''}`}>
        <label htmlFor="thumbnailUrl">
          Cover Image URL <span className="required">*</span>
        </label>
        <input
          type="url"
          id="thumbnailUrl"
          value={formData.thumbnailUrl}
          onChange={(e) => onChange('thumbnailUrl', e.target.value)}
          placeholder="https://example.com/cover-image.jpg"
        />
        <small className="form-help">
          Minimum 1200×675 pixels recommended
        </small>
        <small className="form-help examples">
          Tip: "Use a clean image with big shapes; avoid tiny text."
        </small>
        {errors.thumbnailUrl && (
          <div className="form-error">
            <i className="fas fa-exclamation-circle"></i> {errors.thumbnailUrl}
          </div>
        )}
      </div>

      {formData.thumbnailUrl && (
        <div className="form-group">
          <label htmlFor="thumbnailAltText">Cover Image Alt Text</label>
          <input
            type="text"
            id="thumbnailAltText"
            value={formData.thumbnailAltText}
            onChange={(e) => onChange('thumbnailAltText', e.target.value)}
            placeholder="Describe the cover image for accessibility"
          />
          <small className="form-help">
            Helps visually impaired students understand the image
          </small>
        </div>
      )}

      <div className="form-group">
        <label htmlFor="introVideoUrl">Intro/Trailer Video URL</label>
        <input
          type="url"
          id="introVideoUrl"
          value={formData.introVideoUrl}
          onChange={(e) => onChange('introVideoUrl', e.target.value)}
          placeholder="https://youtube.com/watch?v=..."
        />
        <small className="form-help examples">
          Tip: "30–60 seconds, say who it's for, what they'll learn, and results."
        </small>
      </div>
    </div>
  );
};

export default StructureStep;
