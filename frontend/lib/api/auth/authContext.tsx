/**
 * Auth Context and Hooks with Zustand Integration
 * Provides authentication state and methods throughout the application
 */

"use client";

import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  ReactNode,
} from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { Routes } from "../FrontendRoutes";
import { BackendRoutes } from "../BackendRoutes";
import {
  tokenManager,
  authUtils,
  useTokenStore,
  TokenResponse,
  FirstFactorTokenResponse,
} from "./TokenManager";
import { api, configureApiClient, isErrorWithCodeType } from "../ApiClient";
import {
  UserType,
  LoginCredentialsType,
  RegisterDataType,
} from "../types/auth";



export interface ApiErrorType {
  message: string;
  status: number;
  code?: string;
  details?: unknown;
}

export interface PartialUser {
  email?: string;
  is_email_verified?: boolean;
  is_phone_verified?: boolean;
  tfa_token?: string;
  phone?: string;
}

export function isApiErrorType(error: unknown): error is ApiErrorType {
  return (
    typeof error === "object" &&
    error !== null &&
    "message" in error &&
    typeof (error as any).message === "string" &&
    "status" in error &&
    typeof (error as any).status === "number" &&
    // Optional fields
    (!("code" in error) || typeof (error as any).code === "string") &&
    (!("details" in error) || true) // details can be anything
  );
}


// Auth Store State
interface AuthState {
  user: UserType | null;
  isLoading: boolean;
  error: ApiErrorType | null;
  partialUser: PartialUser | null;

  // Actions
  setUser: (user: UserType | null) => void;
  setLoading: (isLoading: boolean) => void;
  setError: (error: ApiErrorType | null) => void;
  setPartialUser: (partialUser: PartialUser | null) => void;
  updatePartialUser: (partialUser: PartialUser) => void;
  clearError: () => void;
}

// Create Auth Store with Zustand
export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoading: false,
      error: null,
      partialUser: null,

      setUser: (user) => set({ user }),
      setLoading: (isLoading) => set({ isLoading }),
      setError: (error) => set({ error }),
      clearError: () => set({ error: null }),
      setPartialUser: (partialUser) => set({ partialUser }),
      updatePartialUser: (partialUser) => {
        set((state) => ({
          partialUser: { ...state.partialUser, ...partialUser },
        }));
      },
    }),
    {
      name: "auth-user-storage",
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        user: state.user, // Only persist user
        partialUser: state.partialUser,
      }),
    }
  )
);

// Auth Context Type
export interface AuthContextType {
  user: UserType | null;
  partialUser: PartialUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: ApiErrorType | null;
  login: (credentials: LoginCredentialsType) => Promise<void>;
  register: (data: RegisterDataType) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  fetchCurrentUser: () => Promise<void>;
  clearError: () => void;
  updatePartialUser: (partialUser: PartialUser) => void;
  doAuthCheck: () => Promise<void>;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth Provider Props
interface AuthProviderProps {
  children: ReactNode;
  onLogout?: () => void;
}

/**
 * Auth Provider Component
 */
export const AuthProvider: React.FC<AuthProviderProps> = ({
  children,
  onLogout,
}) => {
  // Subscribe to Zustand stores
  const user = useAuthStore((state) => state.user);
  const router = useRouter();
  const isLoading = useAuthStore((state) => state.isLoading);
  const error = useAuthStore((state) => state.error);
  const setUser = useAuthStore((state) => state.setUser);
  const setLoading = useAuthStore((state) => state.setLoading);
  const setError = useAuthStore((state) => state.setError);
  const clearError = useAuthStore((state) => state.clearError);
  const partialUser = useAuthStore((state) => state.partialUser);
  const setPartialUser = useAuthStore((state) => state.setPartialUser);
  const updatePartialUser = useAuthStore((state) => state.updatePartialUser);

  // Track if auth has been initialized
  const [initialized, setInitialized] = useState(false);

  /**
   * Initialize auth state on mount
   */
  useEffect(() => {
    if (!initialized) {
      initializeAuth();
      setInitialized(true);
    }
  }, [initialized]);

  /**
   * Configure API client with logout handler
   */
  useEffect(() => {
    configureApiClient({
      onUnauthorized: handleLogout,
    });
  }, []);

  /**
   * Initialize authentication state
   */
  const initializeAuth = async () => {
    setLoading(true);

    try {
      if (authUtils.isAuthenticated()) {
        await fetchCurrentUser();
      } else {
        // Clear stale user data if token is invalid
        if (user) {
          setUser(null);
        }
      }
    } catch (error) {
      console.error("[Auth] Initialization failed:", error);
      // alert(JSON.stringify(error));
      // handleLogout();
      // if ({ message: "Request timeout", status: 408, code: "REQUEST_TIMEOUT", details: undefined })
      if (isErrorWithCodeType(error)) {
        if (
          error?.code == "REQUEST_TIMEOUT" ||
          error?.code == "NETWORK_ERROR"
        ) {
          alert(error.message);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const doAuthCheck = async () => {
    const next = `${Routes.login}?next=${encodeURIComponent(window.location.pathname + window.location.search)}`;
    if (!authUtils.isAuthenticated() && !isLoading) {
      router.replace(next);
    }
  }

  /**
   * Fetch current user data
   */
  const fetchCurrentUser = async (): Promise<void> => {
    try {
      const response = await api.get<UserType>(BackendRoutes.me);
      setUser(response.data);
      updatePartialUser({
        email: response.data.email,
        phone: response.data.phone_number,
        is_email_verified: response.data.is_email_verified,
        is_phone_verified: response.data.is_phone_number_verified,
      });
      setError(null);
    } catch (error) {
      console.error("[Auth] Failed to fetch user:", error);
      throw error;
    }
  };

  function isFirstFactor(
    data: TokenResponse | FirstFactorTokenResponse
  ): data is FirstFactorTokenResponse {
    return "tfa_token" in data;
  }

  /**
   * Login user
   */
  const login = async (credentials: LoginCredentialsType): Promise<void> => {
    setLoading(true);
    setError(null);
    updatePartialUser({
      email: credentials.email,
    });

    try {
      // Call login endpoint
      const response = await api.post<TokenResponse | FirstFactorTokenResponse>(
        BackendRoutes.loginFirstFactor,
        credentials,
        { requiresAuth: false }
      );

      // if the response is for 2FA we should redirect to the 2FA page
      if (isFirstFactor(response.data)) {
        // save the tfa token and redirect to the 2FA page
        localStorage.setItem("tfa_token", response.data.tfa_token);
        updatePartialUser({ tfa_token: response.data.tfa_token });
        router.push(Routes.loginSecondFactor);
        return;
      }

      // Initialize token manager with response
      authUtils.initializeAuth(response.data);

      // Fetch user data
      await fetchCurrentUser();

      console.log("[Auth] Login successful");
    } catch (error) {
      if (isApiErrorType(error)) {
        setError(error);
      }
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Register new user
   */
  const register = async (data: RegisterDataType): Promise<void> => {
    setLoading(true);
    setError(null);
    updatePartialUser({
      email: data.email,
      phone: data.phone_number,
    });

    try {
      // Call registration endpoint
      const response = await api.post<TokenResponse>(
        BackendRoutes.register,
        data,
        { requiresAuth: false }
      );

      // Initialize token manager with response
      authUtils.initializeAuth(response.data);

      // Fetch user data
      await fetchCurrentUser();

      console.log("[Auth] Registration successful");
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Registration failed. Please try again.";

      setError({ message: errorMessage, status: 500 });
      throw error;
    } finally {
      setLoading(false);
    }
  };

  /**
   * Logout user
   */
  const handleLogout = useCallback(async (): Promise<void> => {
    setLoading(true);

    try {
      // Optionally call logout endpoint
      // try {
      //   await api.post('/api/auth/logout/', {});
      // } catch (error) {
      //   // Continue with local logout even if API call fails
      //   console.warn('[Auth] Logout API call failed:', error);
      // }

      // Clear tokens and user state
      authUtils.logout();
      setUser(null);
      setError(null);

      // Call optional logout callback
      if (onLogout) {
        onLogout();
      }

      console.log("[Auth] Logout successful");
    } catch (error) {
      console.error("[Auth] Logout failed:", error);
    } finally {
      setLoading(false);
    }
  }, [onLogout, setUser, setError, setLoading]);

  /**
   * Refresh user data
   */
  const refreshUser = async (): Promise<void> => {
    if (!authUtils.isAuthenticated()) {
      return;
    }

    try {
      await fetchCurrentUser();
    } catch (error) {
      console.error("[Auth] Failed to refresh user:", error);
      throw error;
    }
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user && authUtils.isAuthenticated(),
    isLoading,
    error,
    login,
    register,
    logout: handleLogout,
    refreshUser,
    fetchCurrentUser,
    clearError,
    partialUser,
    updatePartialUser,
    doAuthCheck,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

/**
 * useAuth Hook
 * Access auth context from any component
 */
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);

  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return context;
};

/**
 * useRequireAuth Hook
 * Redirect to login if not authenticated
 */
export const useRequireAuth = (
  redirectTo: string = Routes.login
): AuthContextType => {
  const auth = useAuth();
  const router = useRouter();
  const [hasChecked, setHasChecked] = useState(false);

  useEffect(() => {
    if (!auth.isLoading && hasChecked && !auth.isAuthenticated) {
      router.push(redirectTo);
    }
    if (!auth.isLoading && !hasChecked) {
      setHasChecked(true);
    }
  }, [auth.isAuthenticated, auth.isLoading, redirectTo, hasChecked]);

  return auth;
};

/**
 * Protected Route Component
 */
interface ProtectedRouteProps {
  children: ReactNode;
  fallback?: ReactNode;
  redirectTo?: string;
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  fallback = <div>Loading...</div>,
  redirectTo = Routes.login,
}) => {
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      window.location.href = redirectTo;
    }
  }, [isAuthenticated, isLoading, redirectTo]);

  if (isLoading) {
    return <>{fallback}</>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return <>{children}</>;
};

/**
 * Token Status Hook
 * Get current token status and time until expiry (using Zustand store)
 */
export const useTokenStatus = () => {
  const getTimeUntilExpiry = useTokenStore((state) => state.getTimeUntilExpiry);
  const isValid = useTokenStore((state) => state.isAccessTokenValid());

  const [timeUntilExpiry, setTimeUntilExpiry] = useState<number | null>(
    getTimeUntilExpiry()
  );

  useEffect(() => {
    const updateStatus = () => {
      setTimeUntilExpiry(getTimeUntilExpiry());
    };

    updateStatus();
    const interval = setInterval(updateStatus, 1000);

    return () => clearInterval(interval);
  }, [getTimeUntilExpiry]);

  return {
    timeUntilExpiry,
    isValid,
    formattedTime: timeUntilExpiry
      ? `${Math.floor(timeUntilExpiry / 60)}m ${timeUntilExpiry % 60}s`
      : null,
  };
};

/**
 * Hook to access token store directly (for advanced usage)
 */
export const useTokens = () => {
  const access = useTokenStore((state) => state.access);
  const refresh = useTokenStore((state) => state.refresh);
  const accessExpiry = useTokenStore((state) => state.accessExpiry);
  const refreshExpiry = useTokenStore((state) => state.refreshExpiry);
  const isRefreshing = useTokenStore((state) => state.isRefreshing);

  return {
    access,
    refresh,
    accessExpiry,
    refreshExpiry,
    isRefreshing,
  };
};

/**
 * Hook to access auth store directly (for advanced usage)
 */
export const useAuthUser = () => {
  return useAuthStore((state) => state.user);
};
