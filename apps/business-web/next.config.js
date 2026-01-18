/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@contracts/core'],
};

module.exports = nextConfig;
