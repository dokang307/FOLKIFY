const AUTH_KEY = "folkify_logged_in";
const USERS_KEY = "folkify_users";
const CURRENT_USER_EMAIL_KEY = "folkify_current_user_email";

type StoredUser = {
  name: string;
  email: string;
  password: string;
};

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

function getStoredUsers(): StoredUser[] {
  if (typeof window === "undefined") {
    return [];
  }

  const raw = window.localStorage.getItem(USERS_KEY);
  if (!raw) {
    return [];
  }

  try {
    const parsed = JSON.parse(raw) as StoredUser[];
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(
      (user) =>
        typeof user?.name === "string" &&
        typeof user?.email === "string" &&
        typeof user?.password === "string",
    );
  } catch {
    return [];
  }
}

function setStoredUsers(users: StoredUser[]) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(USERS_KEY, JSON.stringify(users));
}

export function registerUser(input: {
  name: string;
  email: string;
  password: string;
}): { ok: true } | { ok: false; error: string } {
  if (typeof window === "undefined") {
    return { ok: false, error: "Không thể đăng ký lúc này." };
  }

  const name = input.name.trim();
  const email = normalizeEmail(input.email);
  const password = input.password;
  const users = getStoredUsers();

  if (users.some((user) => normalizeEmail(user.email) === email)) {
    return { ok: false, error: "Email này đã được đăng ký." };
  }

  users.push({ name, email, password });
  setStoredUsers(users);
  return { ok: true };
}

export function authenticateUser(input: {
  email: string;
  password: string;
}): { ok: true; user: StoredUser } | { ok: false; error: string } {
  const email = normalizeEmail(input.email);
  const password = input.password;
  const users = getStoredUsers();
  const matchedUser = users.find(
    (user) => normalizeEmail(user.email) === email,
  );

  if (!matchedUser) {
    return { ok: false, error: "Email chưa được đăng ký." };
  }

  if (matchedUser.password !== password) {
    return { ok: false, error: "Mật khẩu không đúng." };
  }

  return { ok: true, user: matchedUser };
}

export function getCurrentUser() {
  if (typeof window === "undefined") {
    return null;
  }

  const currentEmail = normalizeEmail(
    window.localStorage.getItem(CURRENT_USER_EMAIL_KEY) ?? "",
  );

  if (!currentEmail) {
    return null;
  }

  const users = getStoredUsers();
  return (
    users.find((user) => normalizeEmail(user.email) === currentEmail) ?? null
  );
}

export function isAuthenticated() {
  if (typeof window === "undefined") {
    return false;
  }

  return window.localStorage.getItem(AUTH_KEY) === "1";
}

export function login(email?: string) {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(AUTH_KEY, "1");
  if (email) {
    window.localStorage.setItem(CURRENT_USER_EMAIL_KEY, normalizeEmail(email));
  }
}

export function logout() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(AUTH_KEY);
  window.localStorage.removeItem(CURRENT_USER_EMAIL_KEY);
}
