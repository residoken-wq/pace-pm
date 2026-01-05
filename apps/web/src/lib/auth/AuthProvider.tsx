"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";
import type { PublicClientApplication, AccountInfo } from "@azure/msal-browser";
import { msalConfig, loginRequest, graphScopes } from "./msalConfig";

// Types
interface AuthContextType {
    account: AccountInfo | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: () => Promise<void>;
    logout: () => Promise<void>;
    getAccessToken: () => Promise<string | null>;
    getGraphToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth Provider Component
export function AuthProvider({ children }: { children: ReactNode }) {
    const [msalInstance, setMsalInstance] = useState<PublicClientApplication | null>(null);
    const [account, setAccount] = useState<AccountInfo | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    // Initialize MSAL only on client side
    useEffect(() => {
        const initMsal = async () => {
            // Only run in browser
            if (typeof window === "undefined") {
                setIsLoading(false);
                return;
            }

            try {
                // Dynamic import to avoid SSR issues
                const { PublicClientApplication } = await import("@azure/msal-browser");

                const msal = new PublicClientApplication(msalConfig);
                await msal.initialize();

                setMsalInstance(msal);

                // Handle redirect response
                const response = await msal.handleRedirectPromise();
                if (response?.account) {
                    setAccount(response.account);
                } else {
                    // Check for existing accounts
                    const accounts = msal.getAllAccounts();
                    if (accounts.length > 0) {
                        setAccount(accounts[0]);
                    }
                }
            } catch (error) {
                console.error("MSAL init error:", error);
            } finally {
                setIsLoading(false);
            }
        };

        initMsal();
    }, []);

    const login = useCallback(async () => {
        if (!msalInstance) return;

        try {
            setIsLoading(true);
            await msalInstance.loginRedirect(loginRequest);
        } catch (error) {
            console.error("Login error:", error);
            setIsLoading(false);
        }
    }, [msalInstance]);

    const logout = useCallback(async () => {
        if (!msalInstance) return;

        try {
            await msalInstance.logoutRedirect();
        } catch (error) {
            console.error("Logout error:", error);
        }
    }, [msalInstance]);

    const getAccessToken = useCallback(async (): Promise<string | null> => {
        if (!msalInstance || !account) return null;

        try {
            const { InteractionRequiredAuthError } = await import("@azure/msal-browser");

            const response = await msalInstance.acquireTokenSilent({
                ...loginRequest,
                account,
            });
            return response.accessToken;
        } catch (error) {
            const { InteractionRequiredAuthError } = await import("@azure/msal-browser");
            if (error instanceof InteractionRequiredAuthError) {
                await msalInstance.acquireTokenRedirect(loginRequest);
            }
            console.error("Token error:", error);
            return null;
        }
    }, [msalInstance, account]);

    const getGraphToken = useCallback(async (): Promise<string | null> => {
        if (!msalInstance || !account) return null;

        try {
            const response = await msalInstance.acquireTokenSilent({
                ...graphScopes,
                account,
            });
            return response.accessToken;
        } catch (error) {
            const { InteractionRequiredAuthError } = await import("@azure/msal-browser");
            if (error instanceof InteractionRequiredAuthError) {
                await msalInstance.acquireTokenRedirect(graphScopes);
            }
            console.error("Graph token error:", error);
            return null;
        }
    }, [msalInstance, account]);

    return (
        <AuthContext.Provider
            value={{
                account,
                isAuthenticated: !!account,
                isLoading,
                login,
                logout,
                getAccessToken,
                getGraphToken,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

// Hook to use auth
export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
