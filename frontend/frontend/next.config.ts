import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",

  images: {
    unoptimized: true,

    remotePatterns: [
      {
        protocol: "https",
        hostname: "bricomenage.com",
        pathname: "/api/uploads/**",
      },
      {
        protocol: "https",
        hostname: "www.bricomenage.com",
        pathname: "/api/uploads/**",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
        pathname: "/**",
      },
      {
        protocol: "https",
        hostname: "images.pexels.com",
        pathname: "/**",
      },
    ],
  },

  trailingSlash: true,

  allowedDevOrigins: [
    "localhost:3000",
    "127.0.0.1:3000",
    "bricomenage.com",
    "www.bricomenage.com",
  ],
};

export default nextConfig;
