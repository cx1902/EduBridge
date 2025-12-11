import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Import translation files
import enCommon from './locales/en/common.json';
import enAuth from './locales/en/auth.json';
import enAdmin from './locales/en/admin.json';
import enStudent from './locales/en/student.json';
import enTutor from './locales/en/tutor.json';
import enCourses from './locales/en/courses.json';
import enSessions from './locales/en/sessions.json';
import enErrors from './locales/en/errors.json';
import enDashboard from './locales/en/dashboard.json';

import zhCNCommon from './locales/zh-CN/common.json';
import zhCNAuth from './locales/zh-CN/auth.json';
import zhCNAdmin from './locales/zh-CN/admin.json';
import zhCNStudent from './locales/zh-CN/student.json';
import zhCNTutor from './locales/zh-CN/tutor.json';
import zhCNCourses from './locales/zh-CN/courses.json';
import zhCNSessions from './locales/zh-CN/sessions.json';
import zhCNErrors from './locales/zh-CN/errors.json';
import zhCNDashboard from './locales/zh-CN/dashboard.json';

import zhTWCommon from './locales/zh-TW/common.json';
import zhTWAuth from './locales/zh-TW/auth.json';
import zhTWAdmin from './locales/zh-TW/admin.json';
import zhTWStudent from './locales/zh-TW/student.json';
import zhTWTutor from './locales/zh-TW/tutor.json';
import zhTWCourses from './locales/zh-TW/courses.json';
import zhTWSessions from './locales/zh-TW/sessions.json';
import zhTWErrors from './locales/zh-TW/errors.json';
import zhTWDashboard from './locales/zh-TW/dashboard.json';

// Detect user's browser language
const getBrowserLanguage = () => {
  const browserLang = navigator.language || navigator.userLanguage;
  if (browserLang.startsWith('zh')) {
    return browserLang.includes('TW') || browserLang.includes('HK') ? 'zh-TW' : 'zh-CN';
  }
  return 'en';
};

// Get language from localStorage (for guest users)
const getStoredLanguage = () => {
  return localStorage.getItem('preferredLanguage') || getBrowserLanguage();
};

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: {
        common: enCommon,
        auth: enAuth,
        admin: enAdmin,
        student: enStudent,
        tutor: enTutor,
        courses: enCourses,
        sessions: enSessions,
        errors: enErrors,
        dashboard: enDashboard,
      },
      'zh-CN': {
        common: zhCNCommon,
        auth: zhCNAuth,
        admin: zhCNAdmin,
        student: zhCNStudent,
        tutor: zhCNTutor,
        courses: zhCNCourses,
        sessions: zhCNSessions,
        errors: zhCNErrors,
        dashboard: zhCNDashboard,
      },
      'zh-TW': {
        common: zhTWCommon,
        auth: zhTWAuth,
        admin: zhTWAdmin,
        student: zhTWStudent,
        tutor: zhTWTutor,
        courses: zhTWCourses,
        sessions: zhTWSessions,
        errors: zhTWErrors,
        dashboard: zhTWDashboard,
      },
    },
    lng: getStoredLanguage(),
    fallbackLng: 'en',
    defaultNS: 'common',
    ns: ['common', 'auth', 'admin', 'student', 'tutor', 'courses', 'sessions', 'errors', 'dashboard'],
    interpolation: {
      escapeValue: false, // React already escapes
    },
    react: {
      useSuspense: false,
    },
  });

// Update localStorage when language changes
i18n.on('languageChanged', (lng) => {
  localStorage.setItem('preferredLanguage', lng);
  // Update HTML lang attribute for accessibility
  document.documentElement.lang = lng;
});

export default i18n;
