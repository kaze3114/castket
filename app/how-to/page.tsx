"use client";

import Link from "next/link";
import Image from "next/image";
import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

export default function HowToPage() {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string>("");

  // ヘッダー用ロジック (共通化していない場合は各ページに必要です)
  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUser(user);
        const { data: profile } = await supabase.from("profiles").select("avatar_url").eq("user_id", user.id).single();
        if (profile) setAvatarUrl(profile.avatar_url);
      }
    };
    fetchData();
  }, []);

  const handleLogout = async () => {
    if (!confirm("ログアウトしますか？")) return;
    await supabase.auth.signOut();
    window.location.href = "/";
  };

  // メニューの中身
  const MenuContent = () => (
    <div style={{ display: "flex", flexDirection: isMobileMenuOpen ? "column" : "row", alignItems: isMobileMenuOpen ? "flex-start" : "center", gap: isMobileMenuOpen ? "20px" : "24px", width: isMobileMenuOpen ? "100%" : "auto" }}>
      <nav style={{ display: "flex", gap: "16px", flexDirection: isMobileMenuOpen ? "column" : "row", width: isMobileMenuOpen ? "100%" : "auto" }}>
        <Link href="/how-to" onClick={() => setIsMobileMenuOpen(false)} style={{ fontSize: "0.9rem", color: "var(--accent)", textDecoration: "none", fontWeight: "bold", padding: isMobileMenuOpen ? "12px 0" : "0", borderBottom: isMobileMenuOpen ? "1px solid #eee" : "none", width: isMobileMenuOpen ? "100%" : "auto" }}>使い方</Link>
        {currentUser && <Link href="/feedback" onClick={() => setIsMobileMenuOpen(false)} style={{ fontSize: "0.9rem", color: "#555", textDecoration: "none", fontWeight: "500", padding: isMobileMenuOpen ? "12px 0" : "0", borderBottom: isMobileMenuOpen ? "1px solid #eee" : "none", width: isMobileMenuOpen ? "100%" : "auto" }}>フィードバック</Link>}
        <Link href="/help" onClick={() => setIsMobileMenuOpen(false)} style={{ fontSize: "0.9rem", color: "#555", textDecoration: "none", fontWeight: "500", padding: isMobileMenuOpen ? "12px 0" : "0", borderBottom: isMobileMenuOpen ? "1px solid #eee" : "none", width: isMobileMenuOpen ? "100%" : "auto" }}>ヘルプ</Link>
      </nav>
      <div style={{ width: isMobileMenuOpen ? "100%" : "auto" }}>
        {currentUser ? (
          <div style={{ display: "flex", alignItems: "center", gap: "16px", flexDirection: isMobileMenuOpen ? "column" : "row", width: isMobileMenuOpen ? "100%" : "auto" }}>
            <Link href="/dashboard" onClick={() => setIsMobileMenuOpen(false)} style={{ display: "flex", alignItems: "center", gap: "12px", textDecoration: "none", color: "inherit", width: isMobileMenuOpen ? "100%" : "auto", padding: isMobileMenuOpen ? "8px 0" : "0" }}>
              <div style={{ width: "40px", height: "40px", borderRadius: "50%", overflow: "hidden", border: "2px solid #fff", boxShadow: "0 2px 8px rgba(0,0,0,0.1)", flexShrink: 0 }}>
                {avatarUrl ? <img src={avatarUrl} alt="My Menu" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ width: "100%", height: "100%", background: "#ccc", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem" }}>👤</div>}
              </div>
              {isMobileMenuOpen && <span style={{ fontWeight: "bold", fontSize: "1rem" }}>ダッシュボードへ</span>}
            </Link>
            <button onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }} className="btn btn-ghost" style={{ fontSize: "0.9rem", padding: isMobileMenuOpen ? "12px 0" : "8px 16px", textAlign: isMobileMenuOpen ? "left" : "center", width: isMobileMenuOpen ? "100%" : "auto" }}>ログアウト</button>
          </div>
        ) : (
          <Link href="/login" onClick={() => setIsMobileMenuOpen(false)} className="btn btn-primary" style={{ padding: isMobileMenuOpen ? "12px 0" : "8px 20px", width: isMobileMenuOpen ? "100%" : "auto", display: "block", textAlign: "center", marginTop: isMobileMenuOpen ? "16px" : "0", fontWeight: "bold" }}>ログイン / 登録</Link>
        )}
      </div>
    </div>
  );

  return (
    <>

      {isMobileMenuOpen && (
        <div className="mobile-menu-overlay">
          <div className="mobile-menu-content">
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px", borderBottom: "1px solid #eee", paddingBottom: "16px" }}>
                <span style={{ fontWeight: "bold", fontSize: "1.2rem" }}>Menu</span>
                <button onClick={() => setIsMobileMenuOpen(false)} style={{ background: "none", border: "none", fontSize: "1.8rem", cursor: "pointer", padding: "0 8px" }}>×</button>
              </div>
              <MenuContent />
          </div>
        </div>
      )}

      <main className="section section-soft" style={{ minHeight: "100vh" }}>
        <div className="container" style={{ maxWidth: "800px" }}>
          
          <div style={{ textAlign: "center", marginBottom: "60px" }}>
            <h1 className="section-title" style={{ fontSize: "2rem", marginBottom: "16px" }}>Castketの使い方</h1>
            <p style={{ color: "var(--muted)", lineHeight: 1.8 }}>
              Castket（キャスケット）へようこそ！<br/>
              ここでは、VRChatイベントとキャストをつなぐ<br className="mobile-break"/>
              新しいプラットフォームの活用方法をご紹介します。
            </p>
          </div>

          <div className="card" style={{ padding: "0", overflow: "hidden", marginBottom: "60px", boxShadow: "0 8px 30px rgba(0,0,0,0.1)" }}>
             <Image 
               src="/images/howto.jpg" 
               alt="3ステップでわかるCastketの使い方" 
               width={1200} 
               height={675} 
               style={{ width: "100%", height: "auto" }} 
               priority
             />
          </div>

          <div style={{ display: "grid", gap: "40px" }}>
            <section className="card" style={{ display: "flex", gap: "24px", flexDirection: "column" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", borderBottom: "2px solid var(--accent)", paddingBottom: "12px" }}>
                <span style={{ fontSize: "2rem" }}>🔍</span>
                <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", color: "var(--accent)", margin: 0 }}>1. 見つける</h2>
              </div>
              <div>
                <p style={{ lineHeight: 1.8, marginBottom: "16px" }}>
                  まずは気になるイベントや、魅力的なキャストを探してみましょう。<br/>
                  「ロール（役割）」や「プレイスタイル」で絞り込んで、あなたのイベントにぴったりのパートナーを見つけることができます。
                </p>
                <div style={{ display: "flex", gap: "12px" }}>
                  <Link href="/events" className="btn btn-ghost">イベント一覧へ</Link>
                  <Link href="/casts" className="btn btn-ghost">キャスト一覧へ</Link>
                </div>
              </div>
            </section>

            <section className="card" style={{ display: "flex", gap: "24px", flexDirection: "column" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", borderBottom: "2px solid var(--accent)", paddingBottom: "12px" }}>
                <span style={{ fontSize: "2rem" }}>🤝</span>
                <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", color: "var(--accent)", margin: 0 }}>2. つながる</h2>
              </div>
              <div>
                <p style={{ lineHeight: 1.8 }}>
                  詳細ページにある「応募する」ボタンや「オファーを送る」ボタンから、相手にメッセージを送りましょう。<br/>
                  やり取りの状況はダッシュボードでいつでも確認できます。「承諾」されればマッチング成立です！
                </p>
              </div>
            </section>

            <section className="card" style={{ display: "flex", gap: "24px", flexDirection: "column" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", borderBottom: "2px solid var(--accent)", paddingBottom: "12px" }}>
                <span style={{ fontSize: "2rem" }}>🎉</span>
                <h2 style={{ fontSize: "1.5rem", fontWeight: "bold", color: "var(--accent)", margin: 0 }}>3. 創り出す</h2>
              </div>
              <div>
                <p style={{ lineHeight: 1.8, marginBottom: "16px" }}>
                  マッチングしたメンバーと一緒に、最高のVRChatイベントを作り上げましょう。<br/>
                  イベント終了後は、プロフィールに活動写真を追加して、次のチャンスにつなげることもできます。
                </p>
                <Link href="/login" className="btn btn-primary" style={{ display: "inline-block", padding: "12px 32px" }}>さっそく始める</Link>
              </div>
            </section>
          </div>

        </div>
      </main>
      
      <style jsx>{`
        .mobile-menu-btn { display: none; background: none; border: none; cursor: pointer; color: #333; }
        .mobile-menu-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 999; }
        .mobile-menu-content { position: absolute; top: 0; right: 0; width: 85%; max-width: 320px; height: 100%; background: #fff; padding: 24px; box-shadow: -4px 0 10px rgba(0,0,0,0.1); display: flex; flexDirection: column; }
        @media (max-width: 768px) {
          .pc-menu { display: none !important; }
          .mobile-menu-btn { display: block !important; }
          .mobile-break { display: block; }
        }
        @media (min-width: 769px) { .mobile-break { display: none; } }
      `}</style>
    </>
  );
}