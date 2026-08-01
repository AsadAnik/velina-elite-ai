import axios, { AxiosRequestConfig } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://velina-elite.onrender.com";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

apiClient.interceptors.request.use((config) => {
  if (typeof window === 'undefined') {
    return config;
  }

  const token = localStorage.getItem('velina_admin_token');
  if (token) {
    config.headers = config.headers ?? {};
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

export async function fetchApi<T>(endpoint: string, options: AxiosRequestConfig = {}): Promise<T> {
  try {
    const headers: Record<string, string | null> = { ...(options.headers as Record<string, string>) };

    if (options.data instanceof FormData) {
      headers["Content-Type"] = null;
    }

    const response = await apiClient({
      url: endpoint,
      ...options,
      headers,
    });
    return response.data;
  } catch (error: unknown) {
    if (axios.isAxiosError(error) && error.response) {
      const msg = error.response.data?.message;
      const text = Array.isArray(msg) ? msg.join(', ') : (msg || error.response.data?.error || "An error occurred");

      if (error.response.status === 401 || error.response.status === 403) {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('velina_admin_token');
          localStorage.removeItem('velina_admin_user');
          window.location.href = '/admin/login';
        }
      }

      throw new Error(text);
    }

    throw error;
  }
}
