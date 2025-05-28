/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    // Enable Web Workers
    config.output.workerChunkLoading = 'import';
    config.output.globalObject = 'self';
    
    return config;
  },
  // Allow importing worker files
  serverExternalPackages: ['@xenova/transformers'],
};

module.exports = nextConfig;
