"use client";

import { useState, useEffect, useCallback, ReactNode } from "react";
import { AuthContext, AuthContextType } from "./AuthProvider";

// Force Node.js runtime instead of Edge
export const runtime = "nodejs";

// Check if we're in a proper browser environment with crypto
const isBrowserWithCrypto = () => {
    return (
        typeof window !== "undefined" &&
        typeof window.crypto !== "undefined" &&
        typeof window.crypto.getRandomValues === "function"
    );
};

export function MsalAuthProvider({ children }: { children: ReactNode }) {
    const [account, setAccount] = useState<{ name?: string; username?: string } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [msalInstance, setMsalInstance] = useState<any>(null);

    useEffect(() => {
        // Skip if not in browser with crypto support
        if (!isBrowserWithCrypto()) {
            console.log("Skipping MSAL init - not in browser with crypto");
            setIsLoading(false);
            return;
        }

        let isMounted = true;

        const initMsal = async () => {
            try {
                // Dynamic import MSAL
                const { PublicClientApplication } = await import("@azure/msal-browser");
                const { msalConfig } = await import("./msalConfig");

                const instance = new PublicClientApplication(msalConfig);
                await instance.initialize();

                if (!isMounted) return;
                setMsalInstance(instance);

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

        initMsal();

        return () => { isMounted = false; };
    }, []);

    const login = useCallback(async () => {
        if (!msalInstance) return;
        try {
            const { loginRequest } = await import("./msalConfig");
            await msalInstance.loginRedirect(loginRequest);
        } catch (error) {
            console.error("Login error:", error);
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

    const getAccessToken = useCallback(async () => {
        if (!msalInstance || !account) return null;
        try {
            const { apiRequest } = await import("./msalConfig");
            const accounts = msalInstance.getAllAccounts();
            if (accounts.length === 0) return null;
            const response = await msalInstance.acquireTokenSilent({
                ...apiRequest,
                account: accounts[0],
            });
            return response.accessToken;
        } catch (error) {
            console.error("Token error:", error);
            return null;
        }
    }, [msalInstance, account]);

    const value: AuthContextType = {
        account,
        isAuthenticated: !!account,
        isLoading,
        login,
        logout,
        getAccessToken,
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
}
