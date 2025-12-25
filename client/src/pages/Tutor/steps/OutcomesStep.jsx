import React from 'react';
import { useTranslation } from 'react-i18next';

const OutcomesStep = ({ formData, onChange, errors }) => {
  const handleOutcomeChange = (index, value) => {
    const newOutcomes = [...formData.learningOutcomes];
    newOutcomes[index] = value;
    onChange('learningOutcomes', newOutcomes);
  };

  const addOutcome = () => {
    if (formData.learningOutcomes.length < 5) {
      onChange('learningOutcomes', [...formData.learningOutcomes, '']);
    }
  };

  const removeOutcome = (index) => {
    if (formData.learningOutcomes.length > 1) {
      const newOutcomes = formData.learningOutcomes.filter((_, i) => i !== index);
      onChange('learningOutcomes', newOutcomes);
    }
  };

  const { t } = useTranslation('common');
  return (
    <div>
      <h2 className="step-title">{t('createCourse.outcomes.title', 'Learning Outcomes & Audience')}</h2>
      <p className="step-description">
        {t('createCourse.outcomes.description', 'Define what students will learn and who should take this course. Clear outcomes help students set expectations and motivate their learning journey.')}
      </p>

      <div className={`form-group ${errors.learningOutcomes ? 'has-error' : ''}`}>
        <label>
          {t('createCourse.outcomes.fields.learningOutcomes', 'Learning Outcomes')} <span className="required">*</span>
        </label>
        <p className="form-help">
          {t('createCourse.outcomes.help.simple', 'Add short phrases or words for each outcome (one per line).')}
        </p>

        <ul className="outcomes-list">
          {formData.learningOutcomes.map((outcome, index) => (
            <li key={index} className="outcome-item">
              <input
                type="text"
                value={outcome}
                onChange={(e) => handleOutcomeChange(index, e.target.value)}
                placeholder={t('createCourse.outcomes.placeholders.outcome', 'Learning outcome {{index}}', { index: index + 1 })}
                maxLength={120}
              />
              {formData.learningOutcomes.length > 3 && (
                <button
                  type="button"
                  className="btn-remove"
                  onClick={() => removeOutcome(index)}
                  title={t('createCourse.outcomes.actions.remove', 'Remove outcome')}
                >
                  <i className="fas fa-trash"></i>
                </button>
              )}
            </li>
          ))}
        </ul>

        <button
          type="button"
          className="btn-add-outcome"
          onClick={addOutcome}
          disabled={formData.learningOutcomes.length >= 5}
        >
          <i className="fas fa-plus"></i>
          {t('createCourse.outcomes.actions.addAnother', 'Add another outcome (max 5)')}
        </button>

        {errors.learningOutcomes && (
          <div className="form-error">
            <i className="fas fa-exclamation-circle"></i> {t('createCourse.errors.learningOutcomes', 'Please add at least 3 learning outcomes.')}
          </div>
        )}
      </div>

      <div className={`form-group ${errors.description ? 'has-error' : ''}`}>
        <label htmlFor="description">
          {t('createCourse.outcomes.fields.description', 'Course Description')} <span className="required">*</span>
        </label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) => onChange('description', e.target.value)}
          placeholder={t('createCourse.outcomes.placeholders.description', 'Provide a detailed description of your course...')}
          rows={6}
        />
        <small className="form-help">
          {t('createCourse.outcomes.help.describe', 'Describe what the course covers, teaching methods, and student expectations')}
          <span className="char-count">{formData.description.length} {t('createCourse.outcomes.help.characters', 'characters (minimum 50)')}</span>
        </small>
        {errors.description && (
          <div className="form-error">
            <i className="fas fa-exclamation-circle"></i> {t('createCourse.errors.description', 'Description must be at least 50 characters.')}
          </div>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="prerequisites">{t('createCourse.outcomes.fields.prerequisites', 'Prerequisites')}</label>
        <textarea
          id="prerequisites"
          value={formData.prerequisites}
          onChange={(e) => onChange('prerequisites', e.target.value)}
          placeholder={t('createCourse.outcomes.placeholders.prerequisites', 'e.g., Basic arithmetic, understanding of fractions')}
          rows={3}
        />
        <small className="form-help">{t('createCourse.outcomes.help.knowFirst', 'What should students know first?')}</small>
      </div>

      <div className="form-group">
        <label htmlFor="targetAudience">{t('createCourse.outcomes.fields.audience', 'Target Audience')}</label>
        <textarea
          id="targetAudience"
          value={formData.targetAudience}
          onChange={(e) => onChange('targetAudience', e.target.value)}
          placeholder={t('createCourse.outcomes.placeholders.audience', 'e.g., Students aged 13-16 preparing for secondary exams')}
          rows={3}
        />
        <small className="form-help">{t('createCourse.outcomes.help.whoShouldTake', 'Who should take this course?')}</small>
      </div>
    </div>
  );
};

export default OutcomesStep;
