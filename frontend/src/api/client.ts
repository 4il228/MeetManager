import axios from 'axios';

const backendPort = import.meta.env.VITE_BACKEND_PORT || '8011';
const defaultBaseUrl = import.meta.env.DEV
  ? `http://127.0.0.1:${backendPort}/api/v1`
  : '/api/v1';

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || defaultBaseUrl,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      error.response?.status === 401 &&
      !error.config?.url?.includes('/auth/login') &&
      !error.config?.url?.includes('/auth/me') &&
      window.location.pathname !== '/login'
    ) {
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export default apiClient;
