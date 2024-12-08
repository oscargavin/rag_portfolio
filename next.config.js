/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  experimental: {
    appDir: true,
  },
  cleanDistDir: true,
  pages: false, // explicitly disable pages directory
};

module.exports = nextConfig;