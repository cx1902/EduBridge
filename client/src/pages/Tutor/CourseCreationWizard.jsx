import React, { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import axios from 'axios'
import { useAuthStore } from '../../store/authStore'
import './CourseCreationWizard.css'
import { useTranslation } from 'react-i18next'

// Step components (will be implemented separately)
import BasicsStep from './steps/BasicsStep'
import OutcomesStep from './steps/OutcomesStep'
import StructureStep from './steps/StructureStep'
import PricingStep from './steps/PricingStep'

const CourseCreationWizard = () => {
  const navigate = useNavigate()
  const { token, user } = useAuthStore()
  const [currentStep, setCurrentStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [showSuccessModal, setShowSuccessModal] = useState(false)
  const [createdCourse, setCreatedCourse] = useState(null)
  const [errors, setErrors] = useState({})
  const { t } = useTranslation('common')

  const [formData, setFormData] = useState({
    // Step 1: Basics
    title: '',
    subtitle: '',
    educationLevel: 'SECONDARY',
    subjectCategory: '',
    tags: [],

    // Step 2: Outcomes & Audience
    learningOutcomes: [''],
    prerequisites: '',
    targetAudience: '',
    description: '',

    // Step 3: Structure & Media
    estimatedHours: 0,
    difficulty: 'BEGINNER',
    thumbnailUrl: '',
    thumbnailAltText: '',
    introVideoUrl: '',

    // Step 4: Pricing & Access
    pricingModel: 'FREE',
    price: 0,
    status: 'DRAFT',

    // Step 5: SEO & Compliance (optional)
    slug: '',
    metaDescription: '',
    language: 'en'
  })

  const steps = [
    {
      number: 1,
      label: t('createCourse.steps.basics', 'Basics'),
      component: BasicsStep
    },
    {
      number: 2,
      label: t('createCourse.steps.outcomes', 'Outcomes'),
      component: OutcomesStep
    },
    {
      number: 3,
      label: t('createCourse.steps.structure', 'Structure'),
      component: StructureStep
    },
    {
      number: 4,
      label: t('createCourse.steps.pricing', 'Pricing'),
      component: PricingStep
    }
  ]

  const progressPercent = ((currentStep - 1) / (steps.length - 1)) * 100

  const handleInputChange = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    // Clear error for this field when user starts typing
    if (errors[field]) {
      setErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
    }
  }

  const validateStep = step => {
    const newErrors = {}

    if (step === 1) {
      // Validate Basics
      if (
        !formData.title ||
        formData.title.length < 3 ||
        formData.title.length > 80
      ) {
        newErrors.title = 'Title must be between 3-80 characters.'
      }
      if (formData.subtitle && formData.subtitle.length > 120) {
        newErrors.subtitle = 'Subtitle must not exceed 120 characters.'
      }
      if (!formData.subjectCategory) {
        newErrors.subjectCategory = 'Subject is required.'
      }
      if (!formData.educationLevel) {
        newErrors.educationLevel = 'Education level is required.'
      }
      if (formData.tags.length > 5) {
        newErrors.tags = 'Tags cannot exceed 5 items.'
      }
    } else if (step === 2) {
      // Validate Outcomes & Audience
      const validOutcomes = formData.learningOutcomes
        .map(o => o.trim())
        .filter(o => o.length > 0)
      if (validOutcomes.length < 1) {
        newErrors.learningOutcomes = 'Please add at least 1 learning outcome.'
      }
      if (validOutcomes.length > 5) {
        newErrors.learningOutcomes = 'Learning outcomes cannot exceed 5 items.'
      }
      if (!formData.description || formData.description.length < 50) {
        newErrors.description = 'Description must be at least 50 characters.'
      }
    } else if (step === 3) {
      // Validate Structure & Media
      if (!formData.difficulty) {
        newErrors.difficulty = 'Difficulty level is required.'
      }
      if (formData.estimatedHours && formData.estimatedHours < 0) {
        newErrors.estimatedHours = 'Estimated hours must be a positive number.'
      }
    } else if (step === 4) {
      // Validate Pricing & Access
      if (!formData.pricingModel) {
        newErrors.pricingModel = 'Pricing model is required.'
      }
      if (
        formData.pricingModel !== 'FREE' &&
        (!formData.price || formData.price <= 0)
      ) {
        newErrors.price = 'Price must be greater than 0 for paid courses.'
      }
      if (formData.metaDescription && formData.metaDescription.length > 160) {
        newErrors.metaDescription =
          'Meta description must not exceed 160 characters.'
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleNext = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length))
    }
  }

  const handlePrevious = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1))
  }

  const handleSubmit = async (saveType = 'draft') => {
    if (!validateStep(currentStep)) {
      return
    }

    try {
      setLoading(true)

      // Filter out empty learning outcomes
      const validOutcomes = formData.learningOutcomes.filter(
        o => o.trim().length > 0
      )

      // Prepare submission data
      const submissionData = {
        title: formData.title,
        subtitle: formData.subtitle || null,
        description: formData.description,
        subjectCategory: formData.subjectCategory,
        educationLevel: formData.educationLevel,
        difficulty: formData.difficulty,
        prerequisites: formData.prerequisites || null,
        learningOutcomes: validOutcomes,
        targetAudience: formData.targetAudience || null,
        estimatedHours: parseInt(formData.estimatedHours) || 0,
        thumbnailUrl: formData.thumbnailUrl || null,
        thumbnailAltText: formData.thumbnailAltText || null,
        introVideoUrl: formData.introVideoUrl || null,
        pricingModel: formData.pricingModel,
        price:
          formData.pricingModel === 'FREE' ? 0 : parseFloat(formData.price),
        slug: formData.slug || null,
        metaDescription: formData.metaDescription || null,
        language: formData.language || 'en',
        tags: formData.tags,
        status: saveType === 'publish' ? 'PUBLISHED' : 'DRAFT'
      }

      const API_URL =
        import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
      const response = await axios.post(
        `${API_URL}/tutor/courses`,
        submissionData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      )

      if (response.data.success) {
        setCreatedCourse(response.data.data)
        setShowSuccessModal(true)
      }
    } catch (error) {
      console.error('Error creating course:', error)
      if (error.response?.data?.error) {
        alert(error.response.data.error)
      } else {
        alert('Failed to create course. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const handleCancel = () => {
    if (
      confirm('Are you sure you want to cancel? All progress will be lost.')
    ) {
      // Redirect to appropriate dashboard based on user role
      if (user?.role === 'ADMIN') {
        navigate('/admin')
      } else {
        navigate('/tutor')
      }
    }
  }

  const CurrentStepComponent = steps[currentStep - 1]?.component

  return (
    <div className='course-wizard'>
      <div className='wizard-header'>
        <h1>{t('createCourse.header.title', 'Create New Course')}</h1>
        <p>
          {t(
            'createCourse.header.subtitle',
            'Follow these steps to create a comprehensive course for your students'
          )}
        </p>
      </div>

      {/* Step Indicator */}
      <div className='step-indicator'>
        <div className='progress-line'>
          <div
            className='progress-fill'
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        {steps.map((step, index) => (
          <div
            key={step.number}
            className={`step-item ${
              step.number === currentStep
                ? 'active'
                : step.number < currentStep
                ? 'completed'
                : ''
            }`}
          >
            <div className='step-circle'>
              <span>{step.number}</span>
            </div>
            <span className='step-label'>{step.label}</span>
          </div>
        ))}
      </div>

      {/* Wizard Content */}
      <div className='wizard-content'>
        <div className='step-content'>
          {CurrentStepComponent && (
            <CurrentStepComponent
              formData={formData}
              onChange={handleInputChange}
              errors={errors}
            />
          )}
        </div>

        {/* Wizard Actions */}
        <div className='wizard-actions'>
          <div className='left-actions'>
            <button
              type='button'
              className='btn-secondary'
              onClick={handleCancel}
            >
              {t('createCourse.actions.cancel', 'Cancel')}
            </button>
            {currentStep > 1 && (
              <button
                type='button'
                className='btn-secondary'
                onClick={handlePrevious}
              >
                {t('createCourse.actions.previous', '← Previous')}
              </button>
            )}
          </div>

          <div className='right-actions'>
            {currentStep < steps.length ? (
              <button
                type='button'
                className='btn-primary'
                onClick={handleNext}
              >
                {t('createCourse.actions.next', 'Next →')}
              </button>
            ) : (
              <>
                <button
                  type='button'
                  className='btn-secondary'
                  onClick={() => handleSubmit('draft')}
                  disabled={loading}
                >
                  {loading ? (
                    <span className='loading-spinner' />
                  ) : (
                    t('createCourse.actions.saveDraft', 'Save Draft')
                  )}
                </button>
                <button
                  type='button'
                  className='btn-primary'
                  onClick={() => handleSubmit('publish')}
                  disabled={loading}
                >
                  {loading ? (
                    <span className='loading-spinner' />
                  ) : (
                    t('createCourse.actions.publish', 'Publish Course')
                  )}
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Success Modal */}
      {showSuccessModal && createdCourse && (
        <div className='success-modal-overlay'>
          <div className='success-modal'>
            <div className='icon-container'>
              <i className='fas fa-check-circle'></i>
            </div>
            <h2>
              {t('createCourse.success.title', 'Course Created Successfully!')}
            </h2>
            <p>
              {t(
                'createCourse.success.text',
                'Your course "{{title}}" has been created. What would you like to do next?',
                { title: createdCourse.title }
              )}
            </p>

            <div className='next-steps'>
              <button
                className='next-step-btn'
                onClick={() =>
                  navigate(`/tutor/courses/${createdCourse.id}/lessons`)
                }
              >
                <i className='fas fa-book-open'></i>
                <div className='step-content'>
                  <strong>
                    {t('createCourse.success.addLessons.title', 'Add Lessons')}
                  </strong>
                  <span>
                    {t(
                      'createCourse.success.addLessons.text',
                      'Begin building your curriculum content'
                    )}
                  </span>
                </div>
              </button>

              <button
                className='next-step-btn'
                onClick={() =>
                  navigate(`/tutor/courses/${createdCourse.id}/quizzes`)
                }
              >
                <i className='fas fa-question-circle'></i>
                <div className='step-content'>
                  <strong>
                    {t('createCourse.success.quiz.title', 'Create Quiz Bank')}
                  </strong>
                  <span>
                    {t(
                      'createCourse.success.quiz.text',
                      'Set up assessment questions'
                    )}
                  </span>
                </div>
              </button>

              <button
                className='next-step-btn'
                onClick={() => navigate(`/courses/${createdCourse.id}`)}
              >
                <i className='fas fa-eye'></i>
                <div className='step-content'>
                  <strong>
                    {t(
                      'createCourse.success.preview.title',
                      'Preview as Student'
                    )}
                  </strong>
                  <span>
                    {t(
                      'createCourse.success.preview.text',
                      'View course from student perspective'
                    )}
                  </span>
                </div>
              </button>
            </div>

            <div className='modal-actions'>
              <button
                className='btn-secondary'
                onClick={() =>
                  navigate(user?.role === 'ADMIN' ? '/admin' : '/tutor')
                }
              >
                {t('createCourse.success.back', 'Back to Dashboard')}
              </button>
              <button
                className='btn-primary'
                onClick={() =>
                  navigate(`/tutor/courses/${createdCourse.id}/lessons`)
                }
              >
                {t('createCourse.success.addLessons.title', 'Add Lessons')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default CourseCreationWizard
