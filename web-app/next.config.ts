import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  devIndicators: false, // Disable "Development" indicator in dev mode
  // Ensure serverless functions can access external packages
  serverExternalPackages: ['pg', 'shelljs'],
};

export default nextConfig;
