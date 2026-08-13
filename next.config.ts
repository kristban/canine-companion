import type { NextConfig } from "next";

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

export default nextConfig;
