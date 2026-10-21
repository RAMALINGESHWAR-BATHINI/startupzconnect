import axios from 'axios';

const baseURL = (process.env.NEXT_PUBLIC_API_URL ?? '') + '/api';

const api = axios.create({
  baseURL,
  withCredentials: true,
});

// Intercept 401s and attempt token refresh once
let isRefreshing = false;
let pendingQueue: Array<{ resolve: (v: any) => void; reject: (e: any) => void }> = [];

const processQueue = (error: any, token: null = null) => {
  pendingQueue.forEach(p => error ? p.reject(error) : p.resolve(token));
  pendingQueue = [];
};

api.interceptors.response.use(
  res => res,
  async err => {
    const originalRequest = err.config;
    if (err.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          pendingQueue.push({ resolve, reject });
        }).then(() => api(originalRequest)).catch(e => Promise.reject(e));
      }
      originalRequest._retry = true;
      isRefreshing = true;
      try {
        await axios.post(`${baseURL}/auth/refresh`, {}, { withCredentials: true });
        processQueue(null);
        return api(originalRequest);
      } catch (refreshErr) {
        processQueue(refreshErr);
        return Promise.reject(refreshErr);
      } finally {
        isRefreshing = false;
      }
    }
    return Promise.reject(err);
  }
);

export default api;
