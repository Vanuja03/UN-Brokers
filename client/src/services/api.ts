import axios from 'axios';

export const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || '/api',
  withCredentials: true,
});

function readCookie(name: string) {
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : '';
}

api.interceptors.request.use((config) => {
  const method = config.method?.toLowerCase() ?? 'get';
  if (!['get', 'head', 'options'].includes(method)) {
    const token = readCookie('ub_csrf');
    if (token) config.headers['X-CSRF-Token'] = token;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config as (typeof error.config & { _retry?: boolean }) | undefined;
    const url = String(original?.url ?? '');
    const hasSession = Boolean(readCookie('ub_csrf'));
    if (
      error.response?.status === 401 &&
      original &&
      !original._retry &&
      hasSession &&
      !url.includes('/auth/login') &&
      !url.includes('/auth/refresh')
    ) {
      original._retry = true;
      try {
        await api.post('/auth/refresh');
        return api(original);
      } catch {
        return Promise.reject(error);
      }
    }
    return Promise.reject(error);
  },
);

export function getErrorMessage(error: unknown, fallback: string) {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string } | undefined;
    return data?.message || fallback;
  }
  return fallback;
}

export function getFieldErrors(error: unknown) {
  if (!axios.isAxiosError(error)) return [];
  const data = error.response?.data as { errors?: { field: string; message: string }[] } | undefined;
  return data?.errors ?? [];
}

export function trackEvent(name: string, params?: Record<string, string>) {
  const gtag = (window as Window & { gtag?: (...args: unknown[]) => void }).gtag;
  if (typeof gtag === 'function') gtag('event', name, params);
}

export function whatsappHref(number: string) {
  const digits = number.replace(/[^\d]/g, '');
  return digits ? `https://wa.me/${digits}` : '';
}
