import React, { useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

const OAuthCallback = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { setToken, setUser, fetchCurrentUser } = useAuthStore();

  useEffect(() => {
    const handleCallback = async () => {
      const token = searchParams.get('token');
      const refreshToken = searchParams.get('refreshToken');
      const error = searchParams.get('error');

      if (error) {
        console.error('OAuth error:', error);
        navigate('/login?error=' + error);
        return;
      }

      if (token && refreshToken) {
        // Store tokens
        localStorage.setItem('token', token);
        localStorage.setItem('refreshToken', refreshToken);
        
        // Set in auth store
        setToken(token);

        // Fetch user data
        const user = await fetchCurrentUser();

        if (user) {
          // Redirect based on role
          if (user.role === 'STUDENT') {
            navigate('/student');
          } else if (user.role === 'TUTOR') {
            navigate('/tutor');
          } else if (user.role === 'ADMIN') {
            navigate('/admin');
          } else {
            navigate('/');
          }
        } else {
          navigate('/login?error=fetch_user_failed');
        }
      } else {
        navigate('/login?error=missing_tokens');
      }
    };

    handleCallback();
  }, [searchParams, navigate, setToken, setUser, fetchCurrentUser]);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      flexDirection: 'column',
      gap: '1rem'
    }}>
      <div className="loading-spinner"></div>
      <p>Completing sign in...</p>
    </div>
  );
};

export default OAuthCallback;
