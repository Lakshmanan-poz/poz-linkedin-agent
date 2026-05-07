import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  turbopack: {},
  serverExternalPackages: ["pdfjs-dist", "@e2b/code-interpreter", "@anthropic-ai/sdk"],
};

export default nextConfig;
