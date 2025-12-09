import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Add turbopack configuration to resolve workspace root warning
  turbopack: {
    root: __dirname,
  },
};

export default nextConfig;
