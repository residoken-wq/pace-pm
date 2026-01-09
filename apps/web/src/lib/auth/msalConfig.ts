// MSAL Configuration for Microsoft Entra ID
export const msalConfig = {
    auth: {
        clientId: process.env.NEXT_PUBLIC_AZURE_AD_CLIENT_ID || "",
        authority: `https://login.microsoftonline.com/${process.env.NEXT_PUBLIC_AZURE_AD_TENANT_ID}`,
        redirectUri: typeof window !== "undefined" ? window.location.origin : "",
        postLogoutRedirectUri: typeof window !== "undefined" ? window.location.origin : "",
    },
    cache: {
        cacheLocation: "sessionStorage" as const,
        storeAuthStateInCookie: false,
    },
};

// Scopes for API access
export const loginRequest = {
    scopes: ["User.Read", "openid", "profile", "email"],
};

// API scopes for backend (Using ClientID/.default to match default App Registration pattern)
export const apiRequest = {
    scopes: [`${process.env.NEXT_PUBLIC_AZURE_AD_CLIENT_ID}/.default`],
};

// Graph API scopes
export const graphScopes = {
    scopes: [
        "User.Read",
        "Team.ReadBasic.All",
        "Channel.ReadBasic.All",
        "Files.ReadWrite.All",
        "Calendars.ReadWrite",
        "Tasks.ReadWrite",
    ],
};
