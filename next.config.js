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
        source: "/assistant/:path*",
        destination: "http://127.0.0.1:3000/assistant/:path*",
        // destination: "https://60.204.155.1/assistant",
      },
    ];
  },
};

module.exports = nextConfig;
// module.exports = withBundleAnalyzer(nextConfig);
