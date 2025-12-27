import React, { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import axios from 'axios'
import { useAuthStore } from '../../store/authStore'
import './CourseEditor.css'

const CourseEditor = () => {
  const navigate = useNavigate()
  const { courseId } = useParams()
  const { token } = useAuthStore()
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('overview')
  const [course, setCourse] = useState(null)
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    description: '',
    subjectCategory: '',
    educationLevel: 'SECONDARY',
    difficulty: 'BEGINNER',
    prerequisites: '',
    price: 0,
    pricingModel: 'FREE',
    estimatedHours: 0,
    language: 'en',
    thumbnailUrl: '',
    thumbnailAltText: '',
    introVideoUrl: '',
    learningOutcomes: ['', '', ''],
    targetAudience: '',
    tags: ['', '', ''],
    slug: '',
    metaDescription: ''
  })

  const [validationErrors, setValidationErrors] = useState({})
  const [charCounts, setCharCounts] = useState({
    title: 0,
    subtitle: 0,
    description: 0,
    metaDescription: 0
  })
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (courseId && courseId !== 'new' && courseId !== 'undefined') {
      fetchCourse()
    }
  }, [courseId])

  useEffect(() => {
    if (formData) {
      updateCharCounts()
    }
  }, [
    formData.title,
    formData.subtitle,
    formData.description,
    formData.metaDescription
  ])

  const fetchCourse = async () => {
    try {
      setLoading(true)
      const API_URL =
        import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
      const config = { headers: { Authorization: `Bearer ${token}` } }

      const response = await axios.get(
        `${API_URL}/tutor/courses/${courseId}`,
        config
      )

      const courseData = response.data

      // Helper to safely parse JSON fields
      const parseJson = (data, fallback) => {
        if (!data) return fallback
        if (Array.isArray(data)) return data
        if (typeof data === 'string') {
          try {
            return JSON.parse(data)
          } catch (e) {
            console.error('JSON parse error:', e)
            return fallback
          }
        }
        return fallback
      }

      setFormData({
        title: courseData.title || '',
        subtitle: courseData.subtitle || '',
        description: courseData.description || '',
        subjectCategory: courseData.subjectCategory || '',
        educationLevel: courseData.educationLevel || 'SECONDARY',
        difficulty: courseData.difficulty || 'BEGINNER',
        prerequisites: courseData.prerequisites || '',
        price: courseData.price || 0,
        pricingModel: courseData.pricingModel || 'FREE',
        estimatedHours: courseData.estimatedHours || 0,
        language: courseData.language || 'en',
        thumbnailUrl: courseData.thumbnailUrl || '',
        thumbnailAltText: courseData.thumbnailAltText || '',
        introVideoUrl: courseData.introVideoUrl || '',
        learningOutcomes: parseJson(courseData.learningOutcomes, ['', '', '']),
        targetAudience: courseData.targetAudience || '',
        tags: parseJson(courseData.tags, ['', '', '']),
        slug: courseData.slug || '',
        metaDescription: courseData.metaDescription || ''
      })
      setCourse(courseData)
    } catch (error) {
      console.error('Error fetching course:', error)
      const errorMsg =
        error.response?.data?.error || error.message || 'Failed to load course'

      // Handle 401 Unauthorized explicitly
      if (error.response?.status === 401) {
        alert('Your session has expired. Please log in again.')
        // Optionally redirect to login page
        // navigate('/login');
      } else {
        alert(`Error: ${errorMsg}`)
      }
    } finally {
      setLoading(false)
    }
  }

  const updateCharCounts = () => {
    setCharCounts({
      title: formData.title.length,
      subtitle: formData.subtitle.length,
      description: formData.description.length,
      metaDescription: formData.metaDescription.length
    })
  }

  const handleFileUpload = async e => {
    const file = e.target.files[0]
    if (!file) return

    if (!file.type.match('image.*')) {
      alert('Please select an image file (PNG, JPG)')
      return
    }

    if (file.size > 5 * 1024 * 1024) {
      alert('File size too large. Maximum size is 5MB.')
      return
    }

    const formDataUpload = new FormData()
    formDataUpload.append('image', file)

    // Get fresh token from store or local storage
    const currentToken =
      useAuthStore.getState().token || localStorage.getItem('token')

    try {
      setUploading(true)
      const API_URL =
        import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

      const response = await axios.post(
        `${API_URL}/upload/image`,
        formDataUpload,
        {
          headers: {
            'Content-Type': 'multipart/form-data',
            Authorization: `Bearer ${currentToken}`
          }
        }
      )

      if (response.data.success) {
        setFormData(prev => ({ ...prev, thumbnailUrl: response.data.data.url }))
      }
    } catch (error) {
      console.error('Upload failed:', error)
      alert('Failed to upload image. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  const handleInputChange = e => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))

    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[name]
        return newErrors
      })
    }
  }

  const handleArrayChange = (arrayName, index, value) => {
    setFormData(prev => {
      const newArray = [...prev[arrayName]]
      newArray[index] = value
      return { ...prev, [arrayName]: newArray }
    })
  }

  const addArrayItem = arrayName => {
    setFormData(prev => ({
      ...prev,
      [arrayName]: [...prev[arrayName], '']
    }))
  }

  const removeArrayItem = (arrayName, index) => {
    setFormData(prev => ({
      ...prev,
      [arrayName]: prev[arrayName].filter((_, i) => i !== index)
    }))
  }

  const validateForm = () => {
    const errors = {}

    // Title validation
    if (!formData.title || formData.title.length < 3) {
      errors.title = 'Title must be at least 3 characters'
    } else if (formData.title.length > 80) {
      errors.title = 'Title must not exceed 80 characters'
    }

    // Subtitle validation
    if (formData.subtitle && formData.subtitle.length > 120) {
      errors.subtitle = 'Subtitle must not exceed 120 characters'
    }

    // Description validation
    if (!formData.description || formData.description.length < 50) {
      errors.description = 'Description must be at least 50 characters'
    }

    // Required fields
    if (!formData.subjectCategory) {
      errors.subjectCategory = 'Subject category is required'
    }

    // Learning outcomes validation
    const validOutcomes = formData.learningOutcomes.filter(o => o.trim() !== '')
    if (validOutcomes.length < 1) {
      errors.learningOutcomes = 'At least 1 learning outcome is required'
    } else if (validOutcomes.length > 5) {
      errors.learningOutcomes = 'Maximum 5 learning outcomes allowed'
    }

    // Tags validation
    const validTags = formData.tags.filter(t => t.trim() !== '')
    if (validTags.length > 5) {
      errors.tags = 'Maximum 5 tags allowed'
    }

    // Meta description validation
    if (formData.metaDescription && formData.metaDescription.length > 160) {
      errors.metaDescription = 'Meta description must not exceed 160 characters'
    }

    // Thumbnail alt text required if thumbnail exists
    if (formData.thumbnailUrl && !formData.thumbnailAltText) {
      errors.thumbnailAltText = 'Alt text is required for accessibility'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleSubmit = async e => {
    e.preventDefault()

    if (!validateForm()) {
      alert('Please fix the validation errors before submitting')
      return
    }

    try {
      setLoading(true)
      const config = { headers: { Authorization: `Bearer ${token}` } }
      const API_URL =
        import.meta.env.VITE_API_URL || 'http://localhost:3000/api'

      // Filter out empty array items
      const submitData = {
        ...formData,
        learningOutcomes: formData.learningOutcomes.filter(
          o => o.trim() !== ''
        ),
        tags: formData.tags.filter(t => t.trim() !== '')
      }

      if (courseId) {
        // Update existing course
        await axios.put(
          `${API_URL}/tutor/courses/${courseId}`,
          submitData,
          config
        )
        alert('Course updated successfully')
        fetchCourse()
      } else {
        // Create new course
        const response = await axios.post(
          `${API_URL}/tutor/courses`,
          submitData,
          config
        )
        alert('Course created successfully')
        navigate(`/tutor/course-editor/${response.data.course.id}`)
      }
    } catch (error) {
      console.error('Error saving course:', error)
      alert(error.response?.data?.error || 'Failed to save course')
    } finally {
      setLoading(false)
    }
  }

  const handlePublish = async () => {
    if (!courseId) {
      alert('Please save the course first before publishing')
      return
    }

    try {
      const API_URL =
        import.meta.env.VITE_API_URL || 'http://localhost:3000/api'
      await axios.patch(
        `${API_URL}/tutor/courses/${courseId}/publish`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      )
      alert('Course published successfully')
      fetchCourse()
    } catch (error) {
      console.error('Error publishing course:', error)
      alert(error.response?.data?.error || 'Failed to publish course')
    }
  }

  const renderOverviewTab = () => (
    <div className='tab-content'>
      <section className='form-section'>
        <h3>Basic Information</h3>

        <div className='form-group'>
          <label htmlFor='title'>
            Title <span className='required'>*</span>
            <span className='char-count'>{charCounts.title}/200</span>
          </label>
          <input
            type='text'
            id='title'
            name='title'
            value={formData.title}
            onChange={handleInputChange}
            maxLength='200'
            className={validationErrors.title ? 'error' : ''}
          />
          {validationErrors.title && (
            <span className='error-message'>{validationErrors.title}</span>
          )}
        </div>

        <div className='form-group'>
          <label htmlFor='subtitle'>
            Subtitle
            <span className='char-count'>{charCounts.subtitle}/120</span>
          </label>
          <input
            type='text'
            id='subtitle'
            name='subtitle'
            value={formData.subtitle}
            onChange={handleInputChange}
            maxLength='120'
            placeholder='One-line value proposition'
            className={validationErrors.subtitle ? 'error' : ''}
          />
          {validationErrors.subtitle && (
            <span className='error-message'>{validationErrors.subtitle}</span>
          )}
        </div>

        <div className='form-row'>
          <div className='form-group'>
            <label htmlFor='educationLevel'>
              Education Level <span className='required'>*</span>
            </label>
            <select
              id='educationLevel'
              name='educationLevel'
              value={formData.educationLevel}
              onChange={handleInputChange}
            >
              <option value='PRIMARY'>Primary</option>
              <option value='SECONDARY'>Secondary</option>
              <option value='UNIVERSITY'>University</option>
            </select>
          </div>

          <div className='form-group'>
            <label htmlFor='difficulty'>
              Difficulty <span className='required'>*</span>
            </label>
            <select
              id='difficulty'
              name='difficulty'
              value={formData.difficulty}
              onChange={handleInputChange}
            >
              <option value='BEGINNER'>Beginner</option>
              <option value='INTERMEDIATE'>Intermediate</option>
              <option value='ADVANCED'>Advanced</option>
            </select>
          </div>
        </div>

        <div className='form-group'>
          <label htmlFor='subjectCategory'>
            Subject Category <span className='required'>*</span>
          </label>
          <input
            type='text'
            id='subjectCategory'
            name='subjectCategory'
            value={formData.subjectCategory}
            onChange={handleInputChange}
            placeholder='e.g., Mathematics, Science, Programming'
            className={validationErrors.subjectCategory ? 'error' : ''}
          />
          {validationErrors.subjectCategory && (
            <span className='error-message'>
              {validationErrors.subjectCategory}
            </span>
          )}
        </div>

        <div className='form-group'>
          <label htmlFor='description'>
            Description <span className='required'>*</span>
            <span className='char-count'>
              {charCounts.description} chars (min 50)
            </span>
          </label>
          <textarea
            id='description'
            name='description'
            value={formData.description}
            onChange={handleInputChange}
            rows='6'
            placeholder='Detailed course overview...'
            className={validationErrors.description ? 'error' : ''}
          />
          {validationErrors.description && (
            <span className='error-message'>
              {validationErrors.description}
            </span>
          )}
        </div>
      </section>

      <section className='form-section'>
        <h3>
          Learning Outcomes (1-5 required) <span className='required'>*</span>
        </h3>
        {validationErrors.learningOutcomes && (
          <span className='error-message'>
            {validationErrors.learningOutcomes}
          </span>
        )}
        {formData.learningOutcomes.map((outcome, index) => (
          <div key={index} className='form-group array-item'>
            <label>{index + 1}. By the end, students can...</label>
            <div className='array-input-group'>
              <input
                type='text'
                value={outcome}
                onChange={e =>
                  handleArrayChange('learningOutcomes', index, e.target.value)
                }
                placeholder='e.g., solve linear equations with one variable'
              />
              {formData.learningOutcomes.length > 1 && (
                <button
                  type='button'
                  className='btn-remove'
                  onClick={() => removeArrayItem('learningOutcomes', index)}
                >
                  <i className='fas fa-times'></i>
                </button>
              )}
            </div>
          </div>
        ))}
        {formData.learningOutcomes.length < 5 && (
          <button
            type='button'
            className='btn-add-item'
            onClick={() => addArrayItem('learningOutcomes')}
          >
            <i className='fas fa-plus'></i> Add Outcome
          </button>
        )}
      </section>

      <section className='form-section'>
        <h3>Tags (Optional, max 5)</h3>
        <p className='field-hint'>Use lowercase, hyphen-separated keywords</p>
        {validationErrors.tags && (
          <span className='error-message'>{validationErrors.tags}</span>
        )}
        <div className='tags-container'>
          {formData.tags.map((tag, index) => (
            <div key={index} className='tag-item'>
              <input
                type='text'
                value={tag}
                onChange={e => handleArrayChange('tags', index, e.target.value)}
                placeholder='e.g., algebra'
              />
              <button
                type='button'
                className='btn-remove-tag'
                onClick={() => removeArrayItem('tags', index)}
              >
                ×
              </button>
            </div>
          ))}
        </div>
        {formData.tags.length < 5 && (
          <button
            type='button'
            className='btn-add-item'
            onClick={() => addArrayItem('tags')}
          >
            <i className='fas fa-plus'></i> Add Tag
          </button>
        )}
      </section>

      <section className='form-section'>
        <h3>Cover & Trailer</h3>

        <div className='form-row'>
          <div className='form-group'>
            <label htmlFor='thumbnailUrl'>Cover Image</label>
            <div className='file-upload-container'>
              <input
                type='file'
                id='thumbnailUpload'
                accept='image/*'
                onChange={handleFileUpload}
                disabled={uploading}
                className='file-input'
              />
              {uploading && <span className='upload-status'>Uploading...</span>}
            </div>

            {formData.thumbnailUrl && (
              <div className='image-preview' style={{ marginTop: '10px' }}>
                <img
                  src={formData.thumbnailUrl}
                  alt='Course cover preview'
                  style={{
                    maxWidth: '100%',
                    maxHeight: '200px',
                    borderRadius: '8px',
                    objectFit: 'cover'
                  }}
                />
                <button
                  type='button'
                  onClick={() =>
                    setFormData(prev => ({ ...prev, thumbnailUrl: '' }))
                  }
                  className='btn-remove-image'
                  style={{
                    display: 'block',
                    marginTop: '5px',
                    color: 'red',
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer'
                  }}
                >
                  Remove Image
                </button>
              </div>
            )}
          </div>

          <div className='form-group'>
            <label htmlFor='thumbnailAltText'>
              Cover Image Alt Text
              {formData.thumbnailUrl && <span className='required'>*</span>}
            </label>
            <input
              type='text'
              id='thumbnailAltText'
              name='thumbnailAltText'
              value={formData.thumbnailAltText}
              onChange={handleInputChange}
              placeholder='Describe the image for accessibility'
              className={validationErrors.thumbnailAltText ? 'error' : ''}
            />
            {validationErrors.thumbnailAltText && (
              <span className='error-message'>
                {validationErrors.thumbnailAltText}
              </span>
            )}
          </div>
        </div>

        <div className='form-group'>
          <label htmlFor='introVideoUrl'>Intro Video URL (optional)</label>
          <input
            type='text'
            id='introVideoUrl'
            name='introVideoUrl'
            value={formData.introVideoUrl}
            onChange={handleInputChange}
            placeholder='https://youtube.com/watch?v=...'
          />
          <span className='field-hint'>30-60 second course trailer</span>
        </div>
      </section>

      <section className='form-section'>
        <h3>Audience & Prerequisites</h3>

        <div className='form-group'>
          <label htmlFor='targetAudience'>Target Audience</label>
          <textarea
            id='targetAudience'
            name='targetAudience'
            value={formData.targetAudience}
            onChange={handleInputChange}
            rows='3'
            placeholder='Who benefits most from this course?'
          />
        </div>

        <div className='form-group'>
          <label htmlFor='prerequisites'>Prerequisites</label>
          <textarea
            id='prerequisites'
            name='prerequisites'
            value={formData.prerequisites}
            onChange={handleInputChange}
            rows='3'
            placeholder='What students should know before starting...'
          />
        </div>
      </section>

      <section className='form-section'>
        <h3>Pricing & Access</h3>

        <div className='form-row'>
          <div className='form-group'>
            <label htmlFor='pricingModel'>Pricing Model</label>
            <select
              id='pricingModel'
              name='pricingModel'
              value={formData.pricingModel}
              onChange={handleInputChange}
            >
              <option value='FREE'>Free</option>
              <option value='ONE_TIME'>One-time Purchase</option>
              <option value='SUBSCRIPTION'>Subscription</option>
            </select>
          </div>

          {formData.pricingModel !== 'FREE' && (
            <div className='form-group'>
              <label htmlFor='price'>Price ($)</label>
              <input
                type='number'
                id='price'
                name='price'
                value={formData.price}
                onChange={handleInputChange}
                min='0'
                step='0.01'
              />
            </div>
          )}

          <div className='form-group'>
            <label htmlFor='estimatedHours'>Estimated Hours</label>
            <input
              type='number'
              id='estimatedHours'
              name='estimatedHours'
              value={formData.estimatedHours}
              onChange={handleInputChange}
              min='0'
            />
          </div>
        </div>
      </section>

      <section className='form-section'>
        <h3>SEO Settings</h3>

        <div className='form-group'>
          <label htmlFor='slug'>
            URL Slug {courseId && '(auto-generated if empty)'}
          </label>
          <input
            type='text'
            id='slug'
            name='slug'
            value={formData.slug}
            onChange={handleInputChange}
            placeholder='auto-generated-from-title'
            disabled={!!courseId}
          />
          <span className='field-hint'>
            Lowercase letters, numbers, and hyphens only
          </span>
        </div>

        <div className='form-group'>
          <label htmlFor='metaDescription'>
            Meta Description
            <span className='char-count'>{charCounts.metaDescription}/160</span>
          </label>
          <textarea
            id='metaDescription'
            name='metaDescription'
            value={formData.metaDescription}
            onChange={handleInputChange}
            rows='2'
            maxLength='160'
            placeholder='Brief description for search engines...'
            className={validationErrors.metaDescription ? 'error' : ''}
          />
          {validationErrors.metaDescription && (
            <span className='error-message'>
              {validationErrors.metaDescription}
            </span>
          )}
        </div>
      </section>
    </div>
  )

  if (loading && !course) {
    return <div className='loading'>Loading course editor...</div>
  }

  return (
    <div className='course-editor'>
      <header className='page-header'>
        <nav className='breadcrumb'>
          <button className='back-btn' onClick={() => navigate('/tutor')}>
            <span className='chev'>‹</span> Back to Dashboard
          </button>
        </nav>
        <h1 className='page-title'>
          {courseId && courseId !== 'new' ? 'Edit Course' : 'Create New Course'}
        </h1>
      </header>

      <div className='editor-tabs'>
        <button
          className={`tab ${activeTab === 'overview' ? 'active' : ''}`}
          onClick={() => setActiveTab('overview')}
        >
          Overview
        </button>
        <button
          className={`tab ${activeTab === 'curriculum' ? 'active' : ''}`}
          onClick={() => setActiveTab('curriculum')}
          disabled={!courseId}
        >
          Curriculum
        </button>
        <button
          className={`tab ${activeTab === 'quizzes' ? 'active' : ''}`}
          onClick={() => setActiveTab('quizzes')}
          disabled={!courseId}
        >
          Quizzes
        </button>
        <button
          className={`tab ${activeTab === 'students' ? 'active' : ''}`}
          onClick={() => setActiveTab('students')}
          disabled={!courseId}
        >
          Students
        </button>
      </div>

      <form onSubmit={handleSubmit} className='editor-form'>
        {activeTab === 'overview' && renderOverviewTab()}
        {activeTab === 'curriculum' && (
          <div className='tab-content'>
            <p>Curriculum tab - Coming soon</p>
          </div>
        )}
        {activeTab === 'quizzes' && (
          <div className='tab-content'>
            <p>Quizzes tab - Coming soon</p>
          </div>
        )}
        {activeTab === 'students' && (
          <div className='tab-content'>
            <p>Students tab - Coming soon</p>
          </div>
        )}

        <div className='editor-actions'>
          <button type='submit' className='btn-save' disabled={loading}>
            {loading ? 'Saving...' : 'Save Draft'}
          </button>

          {courseId && course?.status !== 'PUBLISHED' && (
            <button
              type='button'
              className='btn-publish'
              onClick={handlePublish}
              disabled={loading}
            >
              Publish Course
            </button>
          )}
        </div>
      </form>
    </div>
  )
}

export default CourseEditor
