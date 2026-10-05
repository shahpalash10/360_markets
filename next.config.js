const path = require("path");

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: path.join(__dirname),
  images: {
    domains: ['images.unsplash.com', 'avatar.vercel.sh', 'github.com'],
  },
  webpack: (config, { dev, isServer }) => {
    if (dev) {
      config.cache = false;
    }

    config.resolve.alias = {
      ...config.resolve.alias,
      bufferutil: false,
      'utf-8-validate': false,
    };

    config.resolve.modules = [
      path.resolve(__dirname, 'node_modules'),
      'node_modules',
    ];

    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        buffer: false,
      };
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        buffer: false,
      };
    }

    return config;
  },
};

module.exports = nextConfig;
