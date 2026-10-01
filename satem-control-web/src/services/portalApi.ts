import axios from 'axios';

let portalAccessToken: string | null = null;

export function setPortalAccessToken(token: string | null) {
  portalAccessToken = token;
}

export function getPortalAccessToken() {
  return portalAccessToken;
}

const API_URL = import.meta.env.VITE_API_URL !== undefined && import.meta.env.VITE_API_URL !== ''
  ? import.meta.env.VITE_API_URL
  : (import.meta.env.DEV ? '' : 'https://api.satemsoluciones.com');

export const portalApi = axios.create({
  baseURL: `${API_URL}/api/v1/portal`,
  withCredentials: true,
});

portalApi.interceptors.request.use((config) => {
  if (portalAccessToken && config.headers) {
    config.headers.Authorization = `Bearer ${portalAccessToken}`;
  }
  return config;
});

portalApi.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    const isAuthEndpoint =
      originalRequest.url?.includes('/auth/login') ||
      originalRequest.url?.includes('/auth/refresh') ||
      originalRequest.url?.includes('/auth/accept-invite');

    if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
      originalRequest._retry = true;
      try {
        const res = await axios.post(`${API_URL}/api/v1/portal/auth/refresh`, {}, { withCredentials: true });
        const newToken = res.data.data.accessToken;
        setPortalAccessToken(newToken);
        originalRequest.headers.Authorization = `Bearer ${newToken}`;
        return portalApi(originalRequest);
      } catch (refreshErr) {
        setPortalAccessToken(null);
      }
    }
    return Promise.reject(error);
  }
);
