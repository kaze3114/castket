import type { NextConfig } from "next";

const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'pub-0880e8d61d8d40aeb4faefabd6b5ed19.r2.dev', // ★あなたのR2ドメイン
      },
      // ... Supabaseのドメインも既存画像の表示のために残しておく
    ],
  },
};

export default nextConfig;

