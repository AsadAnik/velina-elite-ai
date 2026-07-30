import axios, { AxiosRequestConfig } from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "https://velina-elite.onrender.com";

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

export async function fetchApi<T>(endpoint: string, options: AxiosRequestConfig = {}): Promise<T> {
  try {
    // When data is FormData, we must explicitly set Content-Type to null so that
    // axios drops the instance-level default ("application/json") and lets the
    // browser set the correct multipart/form-data boundary automatically.
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
  } catch (error: any) {
    if (error.response) {
      const msg = error.response.data?.message;
      const text = Array.isArray(msg) ? msg.join(', ') : (msg || error.response.data?.error || "An error occurred");
      throw new Error(text);
    }
    throw error;
  }
}
