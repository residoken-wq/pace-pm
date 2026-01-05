"use client";

import { useState, useEffect, useCallback, ReactNode } from "react";
import { PublicClientApplication } from "@azure/msal-browser";
import { AuthContext, AuthContextType } from "./AuthProvider";
import { msalConfig, loginRequest } from "./msalConfig";

// This component only runs on client - imported via next/dynamic with ssr:false
export function MsalAuthProvider({ children }: { children: ReactNode }) {
    const [account, setAccount] = useState<{ name?: string; username?: string } | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [msal, setMsal] = useState<PublicClientApplication | null>(null);

    useEffect(() => {
        const init = async () => {
            try {
                const instance = new PublicClientApplication(msalConfig);
                await instance.initialize();
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
                setIsLoading(false);
            }
        };

        init();
    }, []);

    const login = useCallback(async () => {
        if (!msal) return;
        try {
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
