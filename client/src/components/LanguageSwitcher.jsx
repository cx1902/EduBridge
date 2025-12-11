import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useAuthStore } from '../store/authStore';
import axios from 'axios';
import './LanguageSwitcher.css';

const LanguageSwitcher = () => {
  const { t, i18n } = useTranslation();
  const { user, updateUser } = useAuthStore();
  const [isOpen, setIsOpen] = useState(false);
  const [updating, setUpdating] = useState(false);

  const languages = [
    { code: 'en', name: 'English', flag: '🇬🇧' },
    { code: 'zh-CN', name: '简体中文', flag: '🇨🇳' },
    { code: 'zh-TW', name: '繁體中文', flag: '🇹🇼' },
  ];

  const currentLanguage = languages.find(lang => lang.code === i18n.language) || languages[0];

  const handleLanguageChange = async (languageCode) => {
    if (languageCode === i18n.language) {
      setIsOpen(false);
      return;
    }

    setUpdating(true);
    
    try {
      // Update i18n immediately for instant UI feedback
      await i18n.changeLanguage(languageCode);
      
      // If user is authenticated, save to database
      if (user) {
        const response = await axios.patch('/api/users/preferences/language', {
          language: languageCode
        });
        
        if (response.data.success) {
          // Update user state with new language preference
          updateUser({ preferredLanguage: languageCode });
        }
      }
      
      setIsOpen(false);
    } catch (error) {
      console.error('Error updating language:', error);
      // Language is still changed in UI even if API fails
      // User will see the change but it won't persist across sessions if not logged in
    } finally {
      setUpdating(false);
    }
  };

  return (
    <div className="language-switcher">
      <button
        className="language-switcher-button"
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Select language"
        disabled={updating}
      >
        <span className="language-flag">{currentLanguage.flag}</span>
        <span className="language-code">{currentLanguage.code.toUpperCase()}</span>
        <span className="language-arrow">▼</span>
      </button>

      {isOpen && (
        <>
          <div className="language-switcher-overlay" onClick={() => setIsOpen(false)} />
          <div className="language-switcher-dropdown">
            {languages.map((lang) => (
              <button
                key={lang.code}
                className={`language-option ${lang.code === i18n.language ? 'active' : ''}`}
                onClick={() => handleLanguageChange(lang.code)}
                disabled={updating}
              >
                <span className="language-flag">{lang.flag}</span>
                <span className="language-name">{lang.name}</span>
                {lang.code === i18n.language && (
                  <span className="language-checkmark">✓</span>
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

export default LanguageSwitcher;
