import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import axios from 'axios'
import { useAuthStore } from '../../../store/authStore'

const StructureStep = ({ formData, onChange, errors }) => {
  const { t } = useTranslation('common')
  const { token } = useAuthStore()
  const [uploading, setUploading] = useState(false)

  const handleFileUpload = async e => {
    const file = e.target.files[0]
    if (!file) return

    // Validate file type
    if (!file.type.match('image.*')) {
      alert('Please select an image file (PNG, JPG)')
      return
    }

    // Validate file size (5MB)
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
        onChange('thumbnailUrl', response.data.data.url)
      }
    } catch (error) {
      console.error('Upload failed:', error)
      alert('Failed to upload image. Please try again.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div>
      <h2 className='step-title'>
        {t('createCourse.structure.title', 'Structure & Media')}
      </h2>
      <p className='step-description'>
        {t(
          'createCourse.structure.description',
          'Define the course scope and add visual elements to attract students. These details help set proper expectations.'
        )}
      </p>

      <div className='form-row'>
        <div
          className={`form-group ${errors.estimatedHours ? 'has-error' : ''}`}
        >
          <label htmlFor='estimatedHours'>
            {t(
              'createCourse.structure.fields.estimatedHours',
              'Estimated Total Time (hours)'
            )}
          </label>
          <input
            type='number'
            id='estimatedHours'
            value={formData.estimatedHours}
            onChange={e => onChange('estimatedHours', e.target.value)}
            min='0'
            step='1'
            placeholder={t(
              'createCourse.structure.placeholders.estimatedHours',
              'e.g., 6'
            )}
          />
          <small className='form-help'>
            {t(
              'createCourse.structure.help.timeExpect',
              'Time students should expect to complete the course'
            )}
          </small>
          {errors.estimatedHours && (
            <div className='form-error'>
              <i className='fas fa-exclamation-circle'></i>{' '}
              {errors.estimatedHours}
            </div>
          )}
        </div>

        <div className={`form-group ${errors.difficulty ? 'has-error' : ''}`}>
          <label htmlFor='difficulty'>
            {t('createCourse.structure.fields.difficulty', 'Difficulty Level')}{' '}
            <span className='required'>*</span>
          </label>
          <select
            id='difficulty'
            value={formData.difficulty}
            onChange={e => onChange('difficulty', e.target.value)}
          >
            <option value='BEGINNER'>
              {t('createCourse.structure.level.beginner', 'Beginner')}
            </option>
            <option value='INTERMEDIATE'>
              {t('createCourse.structure.level.intermediate', 'Intermediate')}
            </option>
            <option value='ADVANCED'>
              {t('createCourse.structure.level.advanced', 'Advanced')}
            </option>
          </select>
          <small className='form-help'>
            {t(
              'createCourse.structure.help.skillLevel',
              'Skill level expectation'
            )}
          </small>
          {errors.difficulty && (
            <div className='form-error'>
              <i className='fas fa-exclamation-circle'></i> {errors.difficulty}
            </div>
          )}
        </div>
      </div>

      <div className={`form-group ${errors.thumbnailUrl ? 'has-error' : ''}`}>
        <label htmlFor='thumbnailUrl'>
          {t('createCourse.structure.fields.coverUrl', 'Cover Image')}
        </label>

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
              onClick={() => onChange('thumbnailUrl', '')}
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

        <small className='form-help'>
          {t(
            'createCourse.structure.help.coverMin',
            'Minimum 1200×675 pixels recommended. Max 5MB.'
          )}
        </small>
        {errors.thumbnailUrl && (
          <div className='form-error'>
            <i className='fas fa-exclamation-circle'></i> {errors.thumbnailUrl}
          </div>
        )}
      </div>

      {formData.thumbnailUrl && (
        <div className='form-group'>
          <label htmlFor='thumbnailAltText'>
            {t(
              'createCourse.structure.fields.coverAlt',
              'Cover Image Alt Text'
            )}
          </label>
          <input
            type='text'
            id='thumbnailAltText'
            value={formData.thumbnailAltText}
            onChange={e => onChange('thumbnailAltText', e.target.value)}
            placeholder={t(
              'createCourse.structure.placeholders.coverAlt',
              'Describe the cover image for accessibility'
            )}
          />
          <small className='form-help'>
            {t(
              'createCourse.structure.help.coverAlt',
              'Helps visually impaired students understand the image'
            )}
          </small>
        </div>
      )}

      <div className='form-group'>
        <label htmlFor='introVideoUrl'>
          {t(
            'createCourse.structure.fields.introUrl',
            'Intro/Trailer Video URL'
          )}
        </label>
        <input
          type='url'
          id='introVideoUrl'
          value={formData.introVideoUrl}
          onChange={e => onChange('introVideoUrl', e.target.value)}
          placeholder={t(
            'createCourse.structure.placeholders.introUrl',
            'https://youtube.com/watch?v=...'
          )}
        />
        <small className='form-help examples'>
          {t(
            'createCourse.structure.help.introTip',
            'Tip: "30–60 seconds, say who it\'s for, what they\'ll learn, and results."'
          )}
        </small>
      </div>
    </div>
  )
}

export default StructureStep
