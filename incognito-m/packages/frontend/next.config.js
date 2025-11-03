/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: { domains: ['your-s3-domain.com'] }
}
module.exports = nextConfig;
