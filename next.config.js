/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // !! WARN !!
    // Dangerously allow production builds to successfully complete even if
    // your project has type errors.
    // !! WARN !!
    ignoreBuildErrors: false,
  },
  eslint: {
    ignoreDuringBuilds: false,
  },
  experimental: {
    // Increase serverComponentsExternalPackages timeout
    serverComponentsExternalPackages: ['@mastra/core', '@mastra/pg'],
    // Increase build timeout
    staticPageGenerationTimeout: 300,
  },
  // Additional timeout configurations
  env: {
    TIMEOUT_DURATION: '300000', // 5 minutes in milliseconds
  },
}

export default nextConfig