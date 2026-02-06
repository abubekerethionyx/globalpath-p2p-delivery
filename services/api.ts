import axios from 'axios';
import { API_URL } from '../config';

const api = axios.create({
    baseURL: API_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);

api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response) {
            const { status, data, config } = error.response;

            // Check for various ways the API might signal an expired token
            const message = (typeof data === 'string' ? data : data?.message || data?.error || '').toLowerCase();
            const isTokenExpired = status === 401 ||
                (status === 500 && (
                    message.includes('token has expired') ||
                    message.includes('signature has expired') ||
                    message.includes('expired')
                ));

            if (isTokenExpired) {
                // Don't redirect if it's a login attempt (invalid credentials)
                const isLoginRequest = config.url?.includes('/users/login') ||
                    config.url?.includes('/users/google-login');

                if (!isLoginRequest) {
                    // Clear local storage regardless of whether we redirect
                    localStorage.removeItem('token');
                    localStorage.removeItem('user');

                    // If we're not already on the login page, and NOT on the feed page, redirect
                    const currentPath = window.location.pathname;
                    if (currentPath !== '/login' && currentPath !== '/feed') {
                        // Optional: save the current path to redirect back after login
                        if (currentPath !== '/') {
                            localStorage.setItem('redirectAfterLogin', currentPath);
                        }
                        window.location.href = '/login?expired=true';
                    }
                }
            }
        }
        return Promise.reject(error);
    }
);

export default api;
