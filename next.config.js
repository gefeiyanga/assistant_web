/** @type {import('next').NextConfig} */
const path = require("path");

const nextConfig = {
  reactStrictMode: true,
  compress: false,
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
        // destination: "http://127.0.0.1:3000/open-ai/chat",
        destination: "https://60.204.155.1/chat",
      },
      {
        source: "/translate",
        destination: "https://fanyi-api.baidu.com/api/trans/vip/translate",
      },
    ];
  },
};

module.exports = nextConfig;
