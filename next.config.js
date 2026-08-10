/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['images.unsplash.com', 'avatar.vercel.sh', 'github.com'],
  },
};

module.exports = nextConfig;
