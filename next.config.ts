import type { NextConfig } from "next";
import createMDX from "@next/mdx";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      // Google's avatar CDN (lh3/lh4/lh5/lh6...), for the profile picture
      // Google provides at sign-in — see src/lib/auth/user.ts:avatarUrlOf.
      {
        protocol: "https",
        hostname: "**.googleusercontent.com",
      },
    ],
  },
};

// Enables importing .mdx content — used for the /guides articles (see
// src/content/advice/ and docs/conventions.md). remark-gfm adds table
// support, which the articles rely on. Passed as a string, not the imported
// function, because Turbopack (this project's dev/build default) can't
// serialize plugin functions across the Rust boundary.
const withMDX = createMDX({
  options: {
    remarkPlugins: ["remark-gfm"],
  },
});

export default withMDX(nextConfig);
