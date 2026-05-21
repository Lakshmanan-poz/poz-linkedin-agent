import type { NextConfig } from "next";

const LAMBDA_BACKEND = "https://ypg368g0ai.execute-api.us-east-1.amazonaws.com";

const nextConfig: NextConfig = {
  output: "standalone",
  turbopack: {},
  serverExternalPackages: ["pdfjs-dist", "@e2b/code-interpreter", "@anthropic-ai/sdk"],
  ...(process.env.USE_LAMBDA_API === "true"
    ? {
        async rewrites() {
          return [
            {
              source: "/api/:path*",
              destination: `${LAMBDA_BACKEND}/api/:path*`,
            },
          ];
        },
      }
    : {}),
};

export default nextConfig;
