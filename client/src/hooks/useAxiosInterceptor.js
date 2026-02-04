import { useEffect } from 'react';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';
import { useNavigate } from 'react-router-dom';

const useAxiosInterceptor = () => {
    const logout = useAuthStore((state) => state.logout);
    const navigate = useNavigate();

    useEffect(() => {
        const interceptor = axios.interceptors.response.use(
            (response) => response,
            async (error) => {
                const originalRequest = error.config;

                // Prevent infinite loop: if the error comes from logout, don't try to logout again
                if (originalRequest.url?.includes('/auth/logout')) {
                    return Promise.reject(error);
                }

                if (error.response && error.response.status === 401) {
                    // If 401 (Unauthorized), clear auth and redirect
                    // This typically means the token has expired
                    await logout();
                    navigate('/login');
                }
                return Promise.reject(error);
            }
        );

        // Cleanup interceptor on unmount
        return () => {
            axios.interceptors.response.eject(interceptor);
        };
    }, [logout, navigate]);
};

export default useAxiosInterceptor;
