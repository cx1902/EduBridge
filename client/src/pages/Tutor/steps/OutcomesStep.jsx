import React from 'react';

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
    if (formData.learningOutcomes.length > 3) {
      const newOutcomes = formData.learningOutcomes.filter((_, i) => i !== index);
      onChange('learningOutcomes', newOutcomes);
    }
  };

  return (
    <div>
      <h2 className="step-title">Learning Outcomes & Audience</h2>
      <p className="step-description">
        Define what students will learn and who should take this course. Clear outcomes help
        students set expectations and motivate their learning journey.
      </p>

      <div className={`form-group ${errors.learningOutcomes ? 'has-error' : ''}`}>
        <label>
          Learning Outcomes <span className="required">*</span>
        </label>
        <p className="form-help">
          By the end, students will be able to… (one line each)
        </p>
        <p className="form-help examples">
          Template: "By the end, students can [action] [object]"
          <br />
          Example: "Solve linear equations with one variable"
        </p>

        <ul className="outcomes-list">
          {formData.learningOutcomes.map((outcome, index) => (
            <li key={index} className={`outcome-item ${errors.learningOutcomes && outcome.length > 0 && (outcome.length < 10 || outcome.length > 120) ? 'has-error' : ''}`}>
              <input
                type="text"
                value={outcome}
                onChange={(e) => handleOutcomeChange(index, e.target.value)}
                placeholder={`Learning outcome ${index + 1}`}
                maxLength={120}
              />
              {formData.learningOutcomes.length > 3 && (
                <button
                  type="button"
                  className="btn-remove"
                  onClick={() => removeOutcome(index)}
                  title="Remove outcome"
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
          Add another outcome (max 5)
        </button>

        {errors.learningOutcomes && (
          <div className="form-error">
            <i className="fas fa-exclamation-circle"></i> {errors.learningOutcomes}
          </div>
        )}
      </div>

      <div className={`form-group ${errors.description ? 'has-error' : ''}`}>
        <label htmlFor="description">
          Course Description <span className="required">*</span>
        </label>
        <textarea
          id="description"
          value={formData.description}
          onChange={(e) => onChange('description', e.target.value)}
          placeholder="Provide a detailed description of your course..."
          rows={6}
        />
        <small className="form-help">
          Describe what the course covers, teaching methods, and student expectations
          <span className="char-count">{formData.description.length} characters (minimum 50)</span>
        </small>
        {errors.description && (
          <div className="form-error">
            <i className="fas fa-exclamation-circle"></i> {errors.description}
          </div>
        )}
      </div>

      <div className="form-group">
        <label htmlFor="prerequisites">Prerequisites</label>
        <textarea
          id="prerequisites"
          value={formData.prerequisites}
          onChange={(e) => onChange('prerequisites', e.target.value)}
          placeholder="e.g., Basic arithmetic, understanding of fractions"
          rows={3}
        />
        <small className="form-help">What should students know first?</small>
      </div>

      <div className="form-group">
        <label htmlFor="targetAudience">Target Audience</label>
        <textarea
          id="targetAudience"
          value={formData.targetAudience}
          onChange={(e) => onChange('targetAudience', e.target.value)}
          placeholder="e.g., Students aged 13-16 preparing for secondary exams"
          rows={3}
        />
        <small className="form-help">Who should take this course?</small>
      </div>
    </div>
  );
};

export default OutcomesStep;
