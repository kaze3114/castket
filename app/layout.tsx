import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "react-hot-toast";
import NotificationListener from "@/components/NotificationListener";
import Header from "@/components/Header";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});


export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
<body>
        {/* ▼ 追加: ここに置くと全ページの上部に表示されます */}
        <Header />
        
        <main style={{ minHeight: "calc(100vh - 56px)" }}>
          {children}
        </main>
        
        <Toaster position="bottom-right" />
      </body>
    </html>
      );
}

export const metadata: Metadata = {
  title: 'Castket | VRChatイベントプラットフォーム',
  description: 'イベントクリエイターとパフォーマーをつなぐVRChat特化型キャスティング・ハブ',
  openGraph: {
    title: 'Castket | VRChatイベントプラットフォーム',
    description: 'イベントクリエイターとパフォーマーをつなぐVRChat特化型キャスティング・ハブ',
    url: 'https://www.castket.net',
    siteName: 'Castket',
    images: [
      {
        url: 'https://www.castket.net/ogp-image.png', // 【重要】絶対パスで指定
        width: 1200,
        height: 630,
      },
    ],
    locale: 'ja_JP',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image', // 大きな画像で表示する設定
    title: 'Castket | VRChatイベントプラットフォーム',
    description: 'イベントクリエイターとパフォーマーをつなぐVRChat特化型キャスティング・ハブ',
    images: ['https://www.castket.net/ogp-image.png'], // 【重要】絶対パスで指定
  },
}