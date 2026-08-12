import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",

  images: {
    unoptimized: true,
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