/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      {
        source: "/latest.yml",
        destination: "/api/latest.yml?platform=win32",
      },
      {
        source: "/latest-mac.yml",
        destination: "/api/latest.yml?platform=darwin",
      },
      {
        source: "/latest-linux.yml",
        destination: "/api/latest.yml?platform=linux",
      },
    ];
  },
};

export default nextConfig;
