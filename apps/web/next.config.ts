import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable Turbopack for auth pages to fix MSAL crypto issue
  experimental: {
    // Force webpack for specific routes if needed
  },
  // Transpile MSAL package
  transpilePackages: ["@azure/msal-browser"],
};

export default nextConfig;
