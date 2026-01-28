import { Profile } from "../types";

const AUTH_KEY = "sarpras_auth";

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
 * Persist user data to local storage after login
 */
export const setAuthSession = (user: Profile) => {
  if (typeof window === "undefined") return;
  localStorage.setItem(AUTH_KEY, JSON.stringify(user));
};

/**
 * Clear user data from local storage
 */
export const clearAuthSession = () => {
  if (typeof window === "undefined") return;
  localStorage.removeItem(AUTH_KEY);
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
