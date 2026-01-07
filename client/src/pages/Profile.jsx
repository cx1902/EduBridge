import React, { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '../store/authStore';
import { useTranslation } from 'react-i18next';
import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
const BASE_URL = import.meta.env.VITE_API_URL?.replace('/api', '') || 'http://localhost:3000';

const Profile = () => {
  const { user, updateUser } = useAuthStore();
  const { t } = useTranslation('common');
  const [isEditing, setIsEditing] = useState(false);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [imagePreview, setImagePreview] = useState('');
  const fileInputRef = useRef(null);

  // Initialize image preview with full URL
  useEffect(() => {
    // Check for email update status
    const params = new URLSearchParams(window.location.search);
    const status = params.get('status');
    const msg = params.get('message');

    if (status === 'email_updated') {
      setMessage({ type: 'success', text: t('profile.emailUpdateSuccess') || 'Email updated successfully!' });
      // Clean up URL
      window.history.replaceState({}, '', window.location.pathname);
    } else if (status === 'error') {
      setMessage({ type: 'error', text: msg?.replace(/_/g, ' ') || 'An error occurred' });
    }

    if (user?.profilePictureUrl) {
      // If it's already a full URL (starts with http), use it as is
      // Otherwise, prepend the base URL
      const imageUrl = user.profilePictureUrl.startsWith('http')
        ? user.profilePictureUrl
        : `${BASE_URL}${user.profilePictureUrl}`;
      setImagePreview(imageUrl);
    } else {
      setImagePreview('');
    }
  }, [user?.profilePictureUrl]);

  const [formData, setFormData] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phoneNumber: user?.phoneNumber || '',
    dateOfBirth: user?.dateOfBirth ? user.dateOfBirth.split('T')[0] : '',
    bio: user?.bio || '',
  });

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
    setMessage({ type: '', text: '' });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setMessage({ type: 'error', text: t('profile.errorImageSize') });
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        setMessage({ type: 'error', text: t('profile.errorImageType') });
        return;
      }

      // Create preview
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveImage = () => {
    setImagePreview('');
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ type: '', text: '' });

    try {
      const formDataToSend = new FormData();

      // Add text fields
      Object.keys(formData).forEach(key => {
        // Special handling for dateOfBirth: only send if it has a value
        // Sending empty string for date might cause backend parsing issues or be ignored
        if (key === 'dateOfBirth') {
          if (formData[key]) {
            formDataToSend.append(key, formData[key]);
          }
        } else {
          // For other fields, send even if empty (to allow clearing phone/bio)
          formDataToSend.append(key, formData[key]);
        }
      });

      // Add image file if changed
      if (fileInputRef.current?.files[0]) {
        formDataToSend.append('profilePicture', fileInputRef.current.files[0]);
      }

      // Check if email has changed
      if (formData.email !== user.email) {
        try {
          await axios.post(`${API_URL}/users/profile/email-change-request`, {
            newEmail: formData.email
          });

          setMessage({
            type: 'info',
            text: t('profile.emailConfirmationSent') || 'A confirmation email has been sent to your CURRENT address. Please check your inbox to complete the change.'
          });

          // Revert email in form data to prevent UI confusion until verified? 
          // Or keep it? Let's keep it but tell them it's pending.
          // Actually, let's stop here if only email changed? 
          // But maybe they changed other things too.
          // We should proceed to update OTHER changes.

        } catch (emailError) {
          console.error('Email change error', emailError);
          setMessage({
            type: 'error',
            text: emailError.response?.data?.message || 'Failed to request email change'
          });
          setIsLoading(false);
          return; // Stop if email change request fails
        }
      }

      const response = await axios.put(`${API_URL}/users/profile`, formDataToSend, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // Update user in store with full image URL
      const updatedUser = response.data.data.user;
      if (updatedUser.profilePictureUrl && !updatedUser.profilePictureUrl.startsWith('http')) {
        updatedUser.profilePictureUrl = `${BASE_URL}${updatedUser.profilePictureUrl}`;
      }
      updateUser(updatedUser);

      setMessage({ type: 'success', text: t('profile.success') });
      setIsEditing(false);
    } catch (error) {
      const errorMessage = error.response?.data?.message || t('profile.errorUpdate');
      setMessage({ type: 'error', text: errorMessage });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setFormData({
      firstName: user?.firstName || '',
      lastName: user?.lastName || '',
      email: user?.email || '',
      phoneNumber: user?.phoneNumber || '',
      dateOfBirth: user?.dateOfBirth ? user.dateOfBirth.split('T')[0] : '',
      bio: user?.bio || '',
    });
    // Reset image preview to user's current profile picture
    if (user?.profilePictureUrl) {
      const imageUrl = user.profilePictureUrl.startsWith('http')
        ? user.profilePictureUrl
        : `${BASE_URL}${user.profilePictureUrl}`;
      setImagePreview(imageUrl);
    } else {
      setImagePreview('');
    }
    setIsEditing(false);
    setMessage({ type: '', text: '' });
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="container">
      <div className="profile-header">
        <h1>{t('profile.title')}</h1>
        {!isEditing && (
          <button onClick={() => {
            setIsEditing(true);
            setShowWarningModal(true);
          }} className="btn btn-primary">
            {t('profile.editProfile')}
          </button>
        )}
      </div>

      {showWarningModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          backgroundColor: 'rgba(0,0,0,0.5)',
          zIndex: 1000,
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center'
        }}>
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '0.75rem',
            maxWidth: '500px',
            width: '90%',
            boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
            textAlign: 'center'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>⚠️</div>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', marginBottom: '1rem', color: '#1f2937' }}>
              Important Notice
            </h2>
            <p style={{ color: '#4b5563', marginBottom: '1.5rem', lineHeight: '1.5' }}>
              <strong>Warning:</strong> {t('profile.emailChangeWarning') || 'Changing your email address requires confirmation via your current email. Please ensure you have access to it.'}
            </p>
            <button
              onClick={() => setShowWarningModal(false)}
              className="btn btn-primary"
              style={{ width: '100%' }}
            >
              I Understand
            </button>
          </div>
        </div>
      )}

      {message.text && (
        <div className={`alert alert-${message.type} mt-md`}>
          {message.text}
        </div>
      )}

      <div className="card mt-lg">
        <form onSubmit={handleSubmit}>
          {/* Profile Picture Section */}
          <div className="profile-picture-section">
            <div className="profile-picture-container">
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt="Profile"
                  className="profile-picture-large"
                />
              ) : (
                <div className="profile-picture-placeholder">
                  <span className="profile-initials">
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </span>
                </div>
              )}
            </div>

            {isEditing && (
              <div className="profile-picture-actions">
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleImageChange}
                  accept="image/*"
                  style={{ display: 'none' }}
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="btn btn-outline btn-sm"
                >
                  {t('profile.changePhoto')}
                </button>
                {imagePreview && (
                  <button
                    type="button"
                    onClick={handleRemoveImage}
                    className="btn btn-ghost btn-sm"
                  >
                    {t('profile.removePhoto')}
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Personal Information */}
          <div className="form-section">
            <h3>{t('profile.personalInfo')}</h3>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="firstName">{t('profile.firstName')} {t('profile.required')}</label>
                <input
                  type="text"
                  id="firstName"
                  name="firstName"
                  value={formData.firstName}
                  onChange={handleChange}
                  disabled={!isEditing}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="lastName">{t('profile.lastName')} {t('profile.required')}</label>
                <input
                  type="text"
                  id="lastName"
                  name="lastName"
                  value={formData.lastName}
                  onChange={handleChange}
                  disabled={!isEditing}
                  required
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="email">{t('profile.email')}</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                disabled={!isEditing}
                className={!isEditing ? "input-disabled" : ""}
              />
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="phoneNumber">{t('profile.phoneNumber')}</label>
                <input
                  type="tel"
                  id="phoneNumber"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  disabled={!isEditing}
                  placeholder={t('profile.phonePlaceholder')}
                />
              </div>

              <div className="form-group">
                <label htmlFor="dateOfBirth">{t('profile.dateOfBirth')}</label>
                <input
                  type="date"
                  id="dateOfBirth"
                  name="dateOfBirth"
                  value={formData.dateOfBirth}
                  onChange={handleChange}
                  disabled={!isEditing}
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="bio">{t('profile.bio')}</label>
              <textarea
                id="bio"
                name="bio"
                value={formData.bio}
                onChange={handleChange}
                disabled={!isEditing}
                rows="4"
                placeholder={t('profile.bioPlaceholder')}
              />
            </div>
          </div>

          {/* Account Information */}
          <div className="form-section">
            <h3>{t('profile.accountInfo')}</h3>

            <div className="form-row">
              <div className="form-group">
                <label>{t('profile.role')}</label>
                <input
                  type="text"
                  value={user?.role || ''}
                  disabled
                  className="input-disabled"
                />
              </div>

              <div className="form-group">
                <label>{t('profile.memberSince')}</label>
                <input
                  type="text"
                  value={user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : ''}
                  disabled
                  className="input-disabled"
                />
              </div>
            </div>

            {user?.role === 'STUDENT' && (
              <div className="form-row">
                <div className="form-group">
                  <label>{t('profile.totalPoints')}</label>
                  <input
                    type="text"
                    value={user?.totalPoints || 0}
                    disabled
                    className="input-disabled"
                  />
                </div>

                <div className="form-group">
                  <label>{t('profile.currentStreak')}</label>
                  <input
                    type="text"
                    value={t('profile.streakDays', { count: user?.currentStreak || 0 })}
                    disabled
                    className="input-disabled"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          {isEditing && (
            <div className="form-actions">
              <button
                type="button"
                onClick={handleCancel}
                className="btn btn-outline"
                disabled={isLoading}
              >
                {t('action.cancel')}
              </button>
              <button
                type="submit"
                className="btn btn-primary"
                disabled={isLoading}
              >
                {isLoading ? t('profile.saving') : t('profile.saveChanges')}
              </button>
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default Profile;
