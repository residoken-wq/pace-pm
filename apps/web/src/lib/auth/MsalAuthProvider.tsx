"use client";

import { useState, useEffect, useCallback, ReactNode } from "react";
import { AuthContext, AuthContextType } from "./AuthProvider";

// This component dynamically imports MSAL inside useEffect to avoid SSR issues
export function MsalAuthProvider({ children }: { children: ReactNode }) {
    const [account, setAccount] = useState<{ name?: string; username?: string } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [msalInstance, setMsalInstance] = useState<any>(null);

    useEffect(() => {
        // Only run in browser
        if (typeof window === "undefined") {
            setIsLoading(false);
            return;
        }

        let isMounted = true;

        const initMsal = async () => {
            try {
                // Dynamic import MSAL inside useEffect
                const msalModule = await import("@azure/msal-browser");
                const configModule = await import("./msalConfig");

                const instance = new msalModule.PublicClientApplication(configModule.msalConfig);
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

        return () => {
            isMounted = false;
        };
    }, []);

    const login = useCallback(async () => {
        if (!msalInstance) return;
        try {
            const configModule = await import("./msalConfig");
            await msalInstance.loginRedirect(configModule.loginRequest);
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
            const configModule = await import("./msalConfig");
            const accounts = msalInstance.getAllAccounts();
            if (accounts.length === 0) return null;
            const response = await msalInstance.acquireTokenSilent({
                ...configModule.loginRequest,
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
