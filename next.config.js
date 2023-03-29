/** @type {import('next').NextConfig} */
const path = require("path");

const nextConfig = {
  reactStrictMode: true,
  sassOptions: {
    includePaths: [path.join(__dirname, "styles")],
  },
  experimental: {
    proxyTimeout: 3 * 60 * 1000,
  },
  rewrites: () => {
    return [
      {
        source: "/chat",
        destination: "http://localhost:3000/open-ai/chat",
      },
    ];
  },
};

module.exports = nextConfig;
