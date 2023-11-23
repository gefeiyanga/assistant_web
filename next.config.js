/** @type {import('next').NextConfig} */
const path = require("path");
// const withBundleAnalyzer = require("@next/bundle-analyzer")({
//   enabled: process.env.ANALYZE === "true",
// });

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
        destination: "http://127.0.0.1:3000/open-ai/chat",
        // destination: "https://60.204.155.1/chat",
      },
      {
        source: "/bard-chat",
        destination: "http://127.0.0.1:3000/bard/chat",
        // destination: "https://60.204.155.1/chat",
      },
      {
        source: "/set-cookies",
        destination: "http://127.0.0.1:3000/bard/set-cookies",
      },
    ];
  },
};

module.exports = nextConfig;
// module.exports = withBundleAnalyzer(nextConfig);
