"use client";

import { createContext, useContext, useEffect, useState, ReactNode, useCallback } from "react";

// Types
interface AuthContextType {
    account: { name?: string; username?: string } | null;
    isAuthenticated: boolean;
    isLoading: boolean;
    login: () => Promise<void>;
    logout: () => Promise<void>;
    getAccessToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Empty auth context for SSR
const defaultAuth: AuthContextType = {
    account: null,
    isAuthenticated: false,
    isLoading: true,
    login: async () => { },
    logout: async () => { },
    getAccessToken: async () => null,
};

// Client-only Auth Provider
function ClientAuthProvider({ children }: { children: ReactNode }) {
    const [account, setAccount] = useState<{ name?: string; username?: string } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [msal, setMsal] = useState<any>(null);

    useEffect(() => {
        let isMounted = true;

        const init = async () => {
            try {
                const { PublicClientApplication } = await import("@azure/msal-browser");
                const { msalConfig } = await import("./msalConfig");

                const instance = new PublicClientApplication(msalConfig);
                await instance.initialize();

                if (!isMounted) return;
                setMsal(instance);

                const response = await instance.handleRedirectPromise();
                if (response?.account) {
                    setAccount({ name: response.account.name, username: response.account.username });
                } else {
                    const accounts = instance.getAllAccounts();
                    if (accounts.length > 0) {
                        setAccount({ name: accounts[0].name, username: accounts[0].username });
                    }
                }
            } catch (error) {
                console.error("MSAL init error:", error);
            } finally {
                if (isMounted) setIsLoading(false);
            }
        };

        init();
        return () => { isMounted = false; };
    }, []);

    const login = useCallback(async () => {
        if (!msal) return;
        try {
            const { loginRequest } = await import("./msalConfig");
            await msal.loginRedirect(loginRequest);
        } catch (error) {
            console.error("Login error:", error);
        }
    }, [msal]);

    const logout = useCallback(async () => {
        if (!msal) return;
        try {
            await msal.logoutRedirect();
        } catch (error) {
            console.error("Logout error:", error);
        }
    }, [msal]);

    const getAccessToken = useCallback(async () => {
        if (!msal || !account) return null;
        try {
            const { loginRequest } = await import("./msalConfig");
            const accounts = msal.getAllAccounts();
            if (accounts.length === 0) return null;

            const response = await msal.acquireTokenSilent({
                ...loginRequest,
                account: accounts[0],
            });
            return response.accessToken;
        } catch (error) {
            console.error("Token error:", error);
            return null;
        }
    }, [msal, account]);

    return (
        <AuthContext.Provider
            value={{ account, isAuthenticated: !!account, isLoading, login, logout, getAccessToken }}
        >
            {children}
        </AuthContext.Provider>
    );
}

// Main AuthProvider - wraps client provider
export function AuthProvider({ children }: { children: ReactNode }) {
    const [mounted, setMounted] = useState(false);

    useEffect(() => {
        setMounted(true);
    }, []);

    // During SSR, provide default context
    if (!mounted) {
        return (
            <AuthContext.Provider value={defaultAuth}>
                {children}
            </AuthContext.Provider>
        );
    }

    return <ClientAuthProvider>{children}</ClientAuthProvider>;
}

// Hook
export function useAuth() {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error("useAuth must be used within an AuthProvider");
    }
    return context;
}
