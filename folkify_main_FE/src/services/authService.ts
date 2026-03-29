/**
 * Authentication Service
 * Handles user authentication with backend API
 */

import { api } from "../config/api";

export interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt?: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface RegisterInput {
  name: string;
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
    const response = await api.post<AuthResponse>(
      "/api/auth/register",
      input,
      true, // Skip auth for registration
    );
    return response;
  },

  /**
   * Login user
   */
  async login(input: LoginInput): Promise<AuthResponse> {
    const response = await api.post<AuthResponse>(
      "/api/auth/login",
      input,
      true, // Skip auth for login
    );
    return response;
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
