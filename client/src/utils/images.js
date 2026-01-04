export const DEFAULT_COURSE_IMAGE = '/course-default.png';

export const getCourseImageUrl = (url) => {
  if (!url) return DEFAULT_COURSE_IMAGE;

  // If it's already a full URL
  if (url.startsWith('http')) {
    return url;
  }

  // If it's a relative path (e.g., /uploads/image.jpg)
  if (url.startsWith('/')) {
    // Get API URL from env or default
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
    
    // Remove '/api' suffix to get the base server URL
    // e.g., http://localhost:3000/api -> http://localhost:3000
    const BASE_URL = API_URL.replace(/\/api\/?$/, '');
    
    return `${BASE_URL}${url}`;
  }

  return url;
};
