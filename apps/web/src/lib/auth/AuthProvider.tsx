"use client";

import { createContext, useContext, ReactNode } from "react";

// Types
export interface AuthContextType {
    account: { name?: string; username?: string } | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: () => Promise<void>;
    logout: () => Promise<void>;
    getAccessToken: () => Promise<string | null>;
}

// Default context for loading state
export const defaultAuth: AuthContextType = {
    account: null,
    isAuthenticated: false,
    isLoading: true,
    login: async () => { },
    logout: async () => { },
    getAccessToken: async () => null,
};

export const AuthContext = createContext<AuthContextType>(defaultAuth);

// Simple provider wrapper (no MSAL here, just context)
export function AuthProvider({
    children,
    value = defaultAuth
}: {
    children: ReactNode;
    value?: AuthContextType;
}) {
    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}

// Hook
export function useAuth() {
    return useContext(AuthContext);
}
