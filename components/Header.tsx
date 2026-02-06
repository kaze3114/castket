"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function Header() {
  const [user, setUser] = useState<any>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  // ▼ 追加: モバイルメニューが開いているかどうかの状態
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  
  const router = useRouter();
  const pathname = usePathname();
  const isTopPage = pathname === "/";

  const navItems = [
    { label: "マイページ", href: "/dashboard" },
    { label: "キャスト一覧", href: "/casts" },
    { label: "イベント一覧", href: "/events" },
    { label: "イベント作成", href: "/dashboard/events" },
    { label: "フィードバック", href: "/feedback" },
    { label: "ヘルプ", href: "/help" },
  ];

  // ページ移動したらメニューを自動で閉じる
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [pathname]);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      setUser(user);
      
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("avatar_url")
          .eq("user_id", user.id)
          .single();
        if (profile) setAvatarUrl(profile.avatar_url);
      }
    };
    getUser();

    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser(session.user);
      } else {
        setUser(null);
        setAvatarUrl(null);
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast.success("ログアウトしました");
    setUser(null);
    router.push("/login");
    router.refresh();
  };

  if (isTopPage) return null;

  return (
    <>
      <header style={{
        height: "60px",
        borderBottom: "1px solid rgba(238, 238, 238, 0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 24px",
        backgroundColor: "rgba(255, 255, 255, 0.8)", 
        backdropFilter: "blur(10px)",
        WebkitBackdropFilter: "blur(10px)",
        position: "sticky",
        top: 0,
        zIndex: 1000
      }}>
        {/* 1. ロゴエリア */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <Link href="/" style={{ textDecoration: "none", fontSize: "1.5rem", fontWeight: "bold", color: "#333", display: "flex", alignItems: "center", gap: "8px" }}>
            <span>✨ Castket</span>
          </Link>
        </div>

        {/* 2. PC用ナビゲーション (900px以下で消える設定済み) */}
        <nav className="header-nav">
          {navItems.map((item) => {
            let isActive = false;
            if (item.href === "/dashboard") {
              isActive = pathname === "/dashboard";
            } else {
              const itemPath = item.href.split('?')[0];
              isActive = pathname === itemPath || (itemPath !== "/" && pathname.startsWith(itemPath));
            }

            return (
              <Link key={item.label} href={item.href} className={`nav-link ${isActive ? "active" : ""}`}>
                {item.label}
                {isActive && <span className="active-bar" />}
              </Link>
            );
          })}
        </nav>

        {/* 3. 右側エリア（ユーザーアイコン + ハンバーガーボタン） */}
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          
          {/* ユーザーアイコン (常に表示) */}
          {user ? (
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              {/* PCのみログアウトを表示（スマホではメニュー内に入れるのもアリですが今回はアイコンだけ） */}
              <button onClick={handleLogout} className="btn-ghost header-nav" style={{ fontSize: "0.85rem", color: "#666", border:"none", background:"none", cursor:"pointer" }}>
                ログアウト
              </button>

              <Link href="/dashboard">
                <div style={{ width: "36px", height: "36px", borderRadius: "50%", backgroundColor: "#eee", overflow: "hidden", border: "1px solid #ddd", cursor: "pointer" }}>
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#aaa" }}>👤</div>
                  )}
                </div>
              </Link>
            </div>
          ) : (
            <div className="header-nav" style={{ display: "flex", gap: "12px" }}>
              <Link href="/login" style={{ textDecoration: "none", color: "#555", fontSize: "0.9rem", fontWeight: "bold" }}>ログイン</Link>
              <Link href="/login" className="btn btn-primary" style={{ fontSize: "0.9rem", padding: "8px 16px" }}>登録</Link>
            </div>
          )}

          {/* ▼▼▼ ハンバーガーボタン (スマホのみ表示) ▼▼▼ */}
          <button 
            className="mobile-menu-btn"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label="Menu"
          >
            {isMobileMenuOpen ? "✕" : "☰"}
          </button>

        </div>
      </header>

      {/* ▼▼▼ モバイルメニューの本体 ▼▼▼ */}
      <div className={`mobile-nav-overlay ${isMobileMenuOpen ? "open" : ""}`}>
        {navItems.map((item) => (
          <Link key={item.label} href={item.href} className="mobile-nav-link">
            {item.label}
          </Link>
        ))}
        
        {/* スマホ用ログアウトボタン */}
        {user && (
          <button 
            onClick={handleLogout} 
            className="mobile-nav-link" 
            style={{ background: "none", border: "none", cursor: "pointer", color: "#d32f2f" }}
          >
            ログアウト
          </button>
        )}
        
        {/* 未ログイン時のスマホ用メニュー */}
        {!user && (
          <>
            <Link href="/login" className="mobile-nav-link">ログイン</Link>
            <Link href="/login" className="mobile-nav-link" style={{ color: "var(--accent)" }}>登録する</Link>
          </>
        )}
      </div>
    </>
  );
}