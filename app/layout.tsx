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

export const metadata: Metadata = {
  title: "Castket |　VRChatイベントプラットフォーム",
  description: "VRChatのイベント主催者とキャストをつなぐマッチングプラットフォーム",
};

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
