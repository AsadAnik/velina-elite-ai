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

  // Determine if this is an admin request based on the endpoint
  const isAdminEndpoint = config.url?.startsWith('/categories') || 
                          config.url?.startsWith('/sub-categories') ||
                          config.url?.startsWith('/products') ||
                          config.url?.startsWith('/orders') ||
                          config.url?.startsWith('/customers') ||
                          config.url?.startsWith('/admin') ||
                          config.url?.startsWith('/auth/admin');

  const adminToken = localStorage.getItem('velina_admin_token');
  const customerToken = localStorage.getItem('velina_customer_token');
  
  // Use appropriate token based on endpoint type
  const token = isAdminEndpoint ? adminToken : customerToken;

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
        const isAuthEndpoint = ['/auth/login', '/auth/register', '/auth/admin/login'].includes(endpoint);

        if (!isAuthEndpoint && typeof window !== 'undefined') {
          // Determine if this is an admin request based on the endpoint
          const isAdminEndpoint = endpoint.startsWith('/categories') || 
                                  endpoint.startsWith('/sub-categories') ||
                                  endpoint.startsWith('/products') ||
                                  endpoint.startsWith('/orders') ||
                                  endpoint.startsWith('/customers') ||
                                  endpoint.startsWith('/admin') ||
                                  endpoint.startsWith('/auth/admin');

          if (isAdminEndpoint) {
            localStorage.removeItem('velina_admin_token');
            localStorage.removeItem('velina_admin_user');
            window.location.href = '/admin/login';
          } else {
            localStorage.removeItem('velina_customer_token');
            localStorage.removeItem('velina_customer_user');
            window.location.href = '/auth';
          }
        }
      }

      throw new Error(text);
    }

    throw error;
  }
}
