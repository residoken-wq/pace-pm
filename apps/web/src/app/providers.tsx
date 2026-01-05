"use client";

import dynamic from "next/dynamic";
import { AuthProvider, defaultAuth } from "@/lib/auth";

// Load MSAL provider ONLY on client side - completely skip SSR
const MsalAuthProvider = dynamic(
    () => import("@/lib/auth/MsalAuthProvider").then(mod => mod.MsalAuthProvider),
    {
        ssr: false,
        loading: () => null,
    }
);

export function Providers({ children }: { children: React.ReactNode }) {
    return (
        <MsalAuthProvider>
            {children}
        </MsalAuthProvider>
    );
}
