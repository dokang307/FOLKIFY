/**
 * API Configuration and HTTP Client
 * Handles all API requests to the backend
 */

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:3000";

interface RequestOptions extends RequestInit {
  skipAuth?: boolean;
}

class ApiClient {
  private baseURL: string;

  constructor(baseURL: string) {
    this.baseURL = baseURL;
  }

  private getAuthToken(): string | null {
    return localStorage.getItem("folkify_token");
  }

  private getHeaders(skipAuth: boolean = false): HeadersInit {
    const headers: HeadersInit = {
      "Content-Type": "application/json",
    };

    if (!skipAuth) {
      const token = this.getAuthToken();
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }
    }

    return headers;
  }

  async request<T = any>(
    endpoint: string,
    options: RequestOptions = {},
  ): Promise<T> {
    const { skipAuth = false, ...fetchOptions } = options;

    const url = `${this.baseURL}${endpoint}`;
    const headers = this.getHeaders(skipAuth);

    try {
      const response = await fetch(url, {
        ...fetchOptions,
        headers: {
          ...headers,
          ...fetchOptions.headers,
        },
      });

      // Handle non-JSON responses
      const contentType = response.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        return {} as T;
      }

      const data = await response.json();

      if (!response.ok) {
        // Backend returns { success: false, error: "message", code: "ERROR_CODE" }
        const errorMessage =
          data.error || data.message || `HTTP ${response.status}`;
        throw new Error(errorMessage);
      }

      return data;
    } catch (error) {
      if (error instanceof Error) {
        throw error;
      }
      throw new Error("Network request failed");
    }
  }

  async get<T = any>(endpoint: string, skipAuth: boolean = false): Promise<T> {
    return this.request<T>(endpoint, { method: "GET", skipAuth });
  }

  async post<T = any>(
    endpoint: string,
    data?: any,
    skipAuth: boolean = false,
  ): Promise<T> {
    return this.request<T>(endpoint, {
      method: "POST",
      body: data ? JSON.stringify(data) : undefined,
      skipAuth,
    });
  }

  async put<T = any>(
    endpoint: string,
    data?: any,
    skipAuth: boolean = false,
  ): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PUT",
      body: data ? JSON.stringify(data) : undefined,
      skipAuth,
    });
  }

  async patch<T = any>(
    endpoint: string,
    data?: any,
    skipAuth: boolean = false,
  ): Promise<T> {
    return this.request<T>(endpoint, {
      method: "PATCH",
      body: data ? JSON.stringify(data) : undefined,
      skipAuth,
    });
  }

  async delete<T = any>(
    endpoint: string,
    skipAuth: boolean = false,
  ): Promise<T> {
    return this.request<T>(endpoint, { method: "DELETE", skipAuth });
  }
}

// Export singleton instance
export const api = new ApiClient(API_URL);

// Export API_URL for reference
export { API_URL };
