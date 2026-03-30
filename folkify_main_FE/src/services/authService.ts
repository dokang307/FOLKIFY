/**
 * Authentication Service
 * Handles user authentication with backend API
 */

import { api } from "../config/api";

/**
 * Normalize user object from backend (snake_case) to frontend (camelCase)
 */
function normalizeUser(user: any): User {
  return {
    ...user,
    fullName: user.fullName || user.full_name || "",
  };
}

export interface User {
  id: string;
  email: string;
  fullName: string; // Used in frontend
  full_name?: string; // Received from backend (snake_case)
  role: string;
  account_type?: string;
  account_status?: string;
  createdAt?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export interface RegisterInput {
  name: string; // Will be mapped to fullName for API
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export const authService = {
  /**
   * Register a new user
   */
  async register(input: RegisterInput): Promise<AuthResponse> {
    const response = await api.post<{ success: boolean; data: AuthResponse }>(
      "/api/auth/register",
      {
        fullName: input.name, // Map 'name' to 'fullName' for backend
        email: input.email,
        password: input.password,
      },
      true, // Skip auth for registration
    );
    // Backend returns { success: true, data: { accessToken, refreshToken, user } }
    const data = response.data;
    data.user = normalizeUser(data.user);
    return data;
  },

  /**
   * Login user
   */
  async login(input: LoginInput): Promise<AuthResponse> {
    const response = await api.post<{ success: boolean; data: AuthResponse }>(
      "/api/auth/login",
      input,
      true, // Skip auth for login
    );
    // Backend returns { success: true, data: { accessToken, refreshToken, user } }
    const data = response.data;
    data.user = normalizeUser(data.user);
    return data;
  },

  /**
   * Get current user profile
   */
  async getProfile(): Promise<User> {
    const response = await api.get<User>("/api/auth/profile");
    return response;
  },

  /**
   * Logout user (client-side only)
   */
  logout(): void {
    localStorage.removeItem("folkify_token");
    localStorage.removeItem("folkify_user");
    localStorage.removeItem("folkify_logged_in");
  },

  /**
   * Save auth data to localStorage
   */
  saveAuthData(token: string, user: User): void {
    localStorage.setItem("folkify_token", token);
    localStorage.setItem("folkify_user", JSON.stringify(user));
    localStorage.setItem("folkify_logged_in", "1");
  },

  /**
   * Get saved user from localStorage
   */
  getSavedUser(): User | null {
    const userStr = localStorage.getItem("folkify_user");
    if (!userStr) return null;

    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    const token = localStorage.getItem("folkify_token");
    const loggedIn = localStorage.getItem("folkify_logged_in");
    return !!(token && loggedIn === "1");
  },

  /**
   * Get auth token
   */
  getToken(): string | null {
    return localStorage.getItem("folkify_token");
  },
};
