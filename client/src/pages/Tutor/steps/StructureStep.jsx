import React from 'react';
import { useTranslation } from 'react-i18next';

const StructureStep = ({ formData, onChange, errors }) => {
  const { t } = useTranslation('common');
  return (
    <div>
      <h2 className="step-title">{t('createCourse.structure.title', 'Structure & Media')}</h2>
      <p className="step-description">
        {t('createCourse.structure.description', 'Define the course scope and add visual elements to attract students. These details help set proper expectations.')}
      </p>

      <div className="form-row">
        <div className={`form-group ${errors.estimatedHours ? 'has-error' : ''}`}>
          <label htmlFor="estimatedHours">{t('createCourse.structure.fields.estimatedHours', 'Estimated Total Time (hours)')}</label>
          <input
            type="number"
            id="estimatedHours"
            value={formData.estimatedHours}
            onChange={(e) => onChange('estimatedHours', e.target.value)}
            min="0"
            step="1"
          placeholder={t('createCourse.structure.placeholders.estimatedHours', 'e.g., 6')}
          />
          <small className="form-help">{t('createCourse.structure.help.timeExpect', 'Time students should expect to complete the course')}</small>
          {errors.estimatedHours && (
            <div className="form-error">
              <i className="fas fa-exclamation-circle"></i> {errors.estimatedHours}
            </div>
          )}
        </div>

        <div className={`form-group ${errors.difficulty ? 'has-error' : ''}`}>
          <label htmlFor="difficulty">
            {t('createCourse.structure.fields.difficulty', 'Difficulty Level')} <span className="required">*</span>
          </label>
          <select
            id="difficulty"
            value={formData.difficulty}
            onChange={(e) => onChange('difficulty', e.target.value)}
          >
            <option value="BEGINNER">{t('createCourse.structure.level.beginner', 'Beginner')}</option>
            <option value="INTERMEDIATE">{t('createCourse.structure.level.intermediate', 'Intermediate')}</option>
            <option value="ADVANCED">{t('createCourse.structure.level.advanced', 'Advanced')}</option>
          </select>
          <small className="form-help">{t('createCourse.structure.help.skillLevel', 'Skill level expectation')}</small>
          {errors.difficulty && (
            <div className="form-error">
              <i className="fas fa-exclamation-circle"></i> {errors.difficulty}
            </div>
          )}
        </div>
      </div>

      <div className={`form-group ${errors.thumbnailUrl ? 'has-error' : ''}`}>
        <label htmlFor="thumbnailUrl">
          {t('createCourse.structure.fields.coverUrl', 'Cover Image URL')}
        </label>
        <input
          type="url"
          id="thumbnailUrl"
          value={formData.thumbnailUrl}
          onChange={(e) => onChange('thumbnailUrl', e.target.value)}
          placeholder={t('createCourse.structure.placeholders.coverUrl', 'https://example.com/cover-image.jpg')}
        />
        <small className="form-help">
          {t('createCourse.structure.help.coverMin', 'Minimum 1200×675 pixels recommended')}
        </small>
        <small className="form-help examples">
          {t('createCourse.structure.help.coverTip', 'Tip: \"Use a clean image with big shapes; avoid tiny text.\"')}
        </small>
        {errors.thumbnailUrl && (
          <div className="form-error">
            <i className="fas fa-exclamation-circle"></i> {errors.thumbnailUrl}
          </div>
        )}
      </div>

      {formData.thumbnailUrl && (
        <div className="form-group">
          <label htmlFor="thumbnailAltText">{t('createCourse.structure.fields.coverAlt', 'Cover Image Alt Text')}</label>
          <input
            type="text"
            id="thumbnailAltText"
            value={formData.thumbnailAltText}
            onChange={(e) => onChange('thumbnailAltText', e.target.value)}
            placeholder={t('createCourse.structure.placeholders.coverAlt', 'Describe the cover image for accessibility')}
          />
          <small className="form-help">
            {t('createCourse.structure.help.coverAlt', 'Helps visually impaired students understand the image')}
          </small>
        </div>
      )}

      <div className="form-group">
        <label htmlFor="introVideoUrl">{t('createCourse.structure.fields.introUrl', 'Intro/Trailer Video URL')}</label>
        <input
          type="url"
          id="introVideoUrl"
          value={formData.introVideoUrl}
          onChange={(e) => onChange('introVideoUrl', e.target.value)}
          placeholder={t('createCourse.structure.placeholders.introUrl', 'https://youtube.com/watch?v=...')}
        />
        <small className="form-help examples">
          {t('createCourse.structure.help.introTip', "Tip: \"30–60 seconds, say who it's for, what they'll learn, and results.\"")}
        </small>
      </div>
    </div>
  );
};

export default StructureStep;
