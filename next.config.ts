/** @type {import('next').NextConfig} */
const nextConfig = {
  // Allow plotly and other large deps
  transpilePackages: ["react-plotly.js", "plotly.js-dist-min"],
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://0.0.0.0:8000/api/:path*',
      },
    ];
  },
};

export default nextConfig;
