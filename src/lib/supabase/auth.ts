import { Profile } from "../types";

const AUTH_KEY = "sarpras_auth";
const COOKIE_NAME = "sarpras_session";

/**
 * Get current logged in user from local storage
 */
export const getCurrentUser = (): Profile | null => {
  if (typeof window === "undefined") return null;
  const authData = localStorage.getItem(AUTH_KEY);
  if (!authData) return null;
  try {
    return JSON.parse(authData) as Profile;
  } catch (error) {
    console.error("Failed to parse auth data", error);
    return null;
  }
};

/**
 * Persist user data to local storage and cookies after login
 */
export const setAuthSession = (user: Profile) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(AUTH_KEY, JSON.stringify(user));
  
  // Set cookie for middleware access
  const expires = new Date();
  expires.setTime(expires.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days
  document.cookie = `${COOKIE_NAME}=${encodeURIComponent(JSON.stringify(user))};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
};

/**
 * Clear user data from local storage and cookies
 */
export const clearAuthSession = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(AUTH_KEY);
  
  // Clear cookie
  document.cookie = `${COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
  
  window.location.href = "/sign-in";
};

/**
 * Check if current user has one of the required roles
 */
export const hasRole = (roles: ("admin" | "petugas" | "pengguna")[]): boolean => {
  const user = getCurrentUser();
  if (!user) return false;
  return roles.includes(user.role);
};

// Aliases for backward compatibility or better naming
export const getUser = getCurrentUser;
export const logout = clearAuthSession;
