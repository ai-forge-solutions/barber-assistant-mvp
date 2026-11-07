import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Netlify build metadata is not guaranteed to exist in function runtime env.
  // Embed only the public origin, never credentials. Local builds remain request-based.
  env: process.env.DEPLOY_PRIME_URL
    ? { TRUJAS_DEPLOY_ORIGIN: new URL(process.env.DEPLOY_PRIME_URL).origin }
    : {},
};

export default nextConfig;
