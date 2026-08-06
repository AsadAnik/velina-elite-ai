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

  const isAdminEndpoint = (url?: string, method?: string) => {
    if (!url) return false;
    if (url.startsWith('/admin') || url.startsWith('/auth/admin')) return true;
    if (url.startsWith('/customers')) return true;
    
    const m = method?.toLowerCase();
    
    if (url.startsWith('/shipping-costs')) {
      return m !== 'get';
    }
    
    if (url.startsWith('/orders')) {
      if (url.startsWith('/orders/my-orders')) return false;
      if (m === 'post' && url === '/orders') return false; // Create order is customer
      return true;
    }
    
    if (url.startsWith('/categories') || url.startsWith('/sub-categories') || url.startsWith('/products')) {
      return m !== 'get';
    }
    
    return false;
  };

  const isAdmin = isAdminEndpoint(config.url, config.method);
  const adminToken = localStorage.getItem('velina_admin_token');
  const customerToken = localStorage.getItem('velina_customer_token');
  
  const token = isAdmin ? adminToken : customerToken;

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
          const isAdminEndpoint = (url?: string, method?: string) => {
            if (!url) return false;
            if (url.startsWith('/admin') || url.startsWith('/auth/admin')) return true;
            if (url.startsWith('/customers')) return true;
            
            const m = method?.toLowerCase();
            
            if (url.startsWith('/shipping-costs')) {
              return m !== 'get';
            }
            
            if (url.startsWith('/orders')) {
              if (url.startsWith('/orders/my-orders')) return false;
              if (m === 'post' && url === '/orders') return false;
              return true;
            }
            
            if (url.startsWith('/categories') || url.startsWith('/sub-categories') || url.startsWith('/products')) {
              return m !== 'get';
            }
            
            return false;
          };

          const isAdmin = isAdminEndpoint(error.config?.url, error.config?.method);

          if (isAdmin) {
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
