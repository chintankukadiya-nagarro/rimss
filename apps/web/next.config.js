/** @type {import('next').NextConfig} */
const API_PROXY_ORIGIN =
  process.env.API_PROXY_ORIGIN ?? "http://127.0.0.1:4000";

const nextConfig = {
  transpilePackages: [],
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: `${API_PROXY_ORIGIN}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;
