"use client";

import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import {
    PublicClientApplication,
    AccountInfo,
    InteractionRequiredAuthError,
} from "@azure/msal-browser";
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

// MSAL instance
let msalInstance: PublicClientApplication | null = null;

const getMsalInstance = () => {
    if (!msalInstance && typeof window !== "undefined") {
        msalInstance = new PublicClientApplication(msalConfig);
    }
    return msalInstance;
};

// Auth Provider Component
export function AuthProvider({ children }: { children: ReactNode }) {
    const [account, setAccount] = useState<AccountInfo | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const init = async () => {
            const msal = getMsalInstance();
            if (!msal) return;

            try {
                await msal.initialize();

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

        init();
    }, []);

    const login = async () => {
        const msal = getMsalInstance();
        if (!msal) return;

        try {
            setIsLoading(true);
            await msal.loginRedirect(loginRequest);
        } catch (error) {
            console.error("Login error:", error);
            setIsLoading(false);
        }
    };

    const logout = async () => {
        const msal = getMsalInstance();
        if (!msal) return;

        try {
            await msal.logoutRedirect();
        } catch (error) {
            console.error("Logout error:", error);
        }
    };

    const getAccessToken = async (): Promise<string | null> => {
        const msal = getMsalInstance();
        if (!msal || !account) return null;

        try {
            const response = await msal.acquireTokenSilent({
                ...loginRequest,
                account,
            });
            return response.accessToken;
        } catch (error) {
            if (error instanceof InteractionRequiredAuthError) {
                await msal.acquireTokenRedirect(loginRequest);
            }
            console.error("Token error:", error);
            return null;
        }
    };

    const getGraphToken = async (): Promise<string | null> => {
        const msal = getMsalInstance();
        if (!msal || !account) return null;

        try {
            const response = await msal.acquireTokenSilent({
                ...graphScopes,
                account,
            });
            return response.accessToken;
        } catch (error) {
            if (error instanceof InteractionRequiredAuthError) {
                await msal.acquireTokenRedirect(graphScopes);
            }
            console.error("Graph token error:", error);
            return null;
        }
    };

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
