/**
 * Authentication Module
 * Now uses backend API instead of localStorage
 */

import { authService, type User } from "../services/authService";

type StoredUser = {
  name: string;
  email: string;
  password?: string;
};

/**
 * Register a new user via API
 */
export async function registerUser(input: {
  name: string;
  email: string;
  password: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  if (typeof window === "undefined") {
    return { ok: false, error: "Không thể đăng ký lúc này." };
  }

  try {
    const response = await authService.register({
      name: input.name.trim(),
      email: input.email.trim().toLowerCase(),
      password: input.password,
    });

    // Save auth data (use accessToken from backend)
    authService.saveAuthData(response.accessToken, response.user);

    return { ok: true };
  } catch (error: any) {
    return {
      ok: false,
      error: error.message || "Đăng ký thất bại. Vui lòng thử lại.",
    };
  }
}

/**
 * Authenticate user via API
 */
export async function authenticateUser(input: {
  email: string;
  password: string;
}): Promise<{ ok: true; user: StoredUser } | { ok: false; error: string }> {
  try {
    const response = await authService.login({
      email: input.email.trim().toLowerCase(),
      password: input.password,
    });

    // Save auth data (use accessToken from backend)
    authService.saveAuthData(response.accessToken, response.user);

    return {
      ok: true,
      user: {
        name: response.user.fullName, // Backend uses fullName
        email: response.user.email,
      },
    };
  } catch (error: any) {
    const errorMessage = error.message || "Đăng nhập thất bại";

    if (
      errorMessage.includes("not found") ||
      errorMessage.includes("Invalid")
    ) {
      return { ok: false, error: "Email hoặc mật khẩu không đúng." };
    }

    return { ok: false, error: errorMessage };
  }
}

/**
 * Get current user from localStorage or API
 */
export function getCurrentUser(): StoredUser | null {
  if (typeof window === "undefined") {
    return null;
  }

  // Try to get from localStorage first
  const savedUser = authService.getSavedUser();
  if (savedUser) {
    return {
      name: savedUser.fullName, // Backend uses fullName
      email: savedUser.email,
    };
  }

  return null;
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  return authService.isAuthenticated();
}

/**
 * Login user (save auth data)
 */
export function login(emailOrToken?: string, user?: User) {
  if (typeof window === "undefined") {
    return;
  }

  // If called with token and user (from API response)
  if (user && emailOrToken) {
    authService.saveAuthData(emailOrToken, user);
  } else {
    // Legacy support: just mark as logged in
    window.localStorage.setItem("folkify_logged_in", "1");
  }
}

/**
 * Logout user
 */
export function logout() {
  if (typeof window === "undefined") {
    return;
  }

  authService.logout();
}

/**
 * Get auth token
 */
export function getToken(): string | null {
  return authService.getToken();
}
