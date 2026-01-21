"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ROLE_OPTIONS } from "@/lib/constants";

// スライドショー画像
const HERO_IMAGES = [
  "https://slvwccgxjoixxgpvpqxq.supabase.co/storage/v1/object/sign/Top_banner/VRChat_2024-09-29_14-43-36.240_1920x1080.jpg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9lNTE2OWIxOS1kZTc4LTQ3M2ItYTdhNy02YjJiODUzYTQ0MjIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJUb3BfYmFubmVyL1ZSQ2hhdF8yMDI0LTA5LTI5XzE0LTQzLTM2LjI0MF8xOTIweDEwODAuanBnIiwiaWF0IjoxNzY4OTkwNzgzLCJleHAiOjE4MDA1MjY3ODN9.yfNSrtZWC7x31EnJ09MGSwNy_Ak1ZvD7nmHIpvJb_Ls",
  "https://slvwccgxjoixxgpvpqxq.supabase.co/storage/v1/object/sign/Top_banner/VRChat_2024-11-01_23-35-35.442_3840x2160.jpg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9lNTE2OWIxOS1kZTc4LTQ3M2ItYTdhNy02YjJiODUzYTQ0MjIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJUb3BfYmFubmVyL1ZSQ2hhdF8yMDI0LTExLTAxXzIzLTM1LTM1LjQ0Ml8zODQweDIxNjAuanBnIiwiaWF0IjoxNzY4OTkwODE1LCJleHAiOjE4MDA1MjY4MTV9.lbt7AHPQc57ThylM2GMi0S2h9nLNtBS0BOB9177fA6c",
  "https://slvwccgxjoixxgpvpqxq.supabase.co/storage/v1/object/sign/Top_banner/VRChat_2024-11-17_01-09-52.563_3840x2160.jpg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9lNTE2OWIxOS1kZTc4LTQ3M2ItYTdhNy02YjJiODUzYTQ0MjIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJUb3BfYmFubmVyL1ZSQ2hhdF8yMDI0LTExLTE3XzAxLTA5LTUyLjU2M18zODQweDIxNjAuanBnIiwiaWF0IjoxNzY4OTkwODMxLCJleHAiOjE4MDA1MjY4MzF9.PWrMaPZnssLGfxGIVwoIdDNJoTotxFuvDNWlvFsJL1M",
  "https://slvwccgxjoixxgpvpqxq.supabase.co/storage/v1/object/sign/Top_banner/VRChat_2025-11-16_00-03-00.620_3840x2160.jpg?token=eyJraWQiOiJzdG9yYWdlLXVybC1zaWduaW5nLWtleV9lNTE2OWIxOS1kZTc4LTQ3M2ItYTdhNy02YjJiODUzYTQ0MjIiLCJhbGciOiJIUzI1NiJ9.eyJ1cmwiOiJUb3BfYmFubmVyL1ZSQ2hhdF8yMDI1LTExLTE2XzAwLTAzLTAwLjYyMF8zODQweDIxNjAuanBnIiwiaWF0IjoxNzY4OTkxNzIxLCJleHAiOjE4MDA1Mjc3MjF9.NhJ5NlpDp9IqlK4HjgDhbRSZ19F-BbqhDWTMF6jqMHo",
]
export default function Home() {
  const router = useRouter();
  
  // データ表示用ステート
  const [popularCasts, setPopularCasts] = useState<any[]>([]); 
  const [newCasts, setNewCasts] = useState<any[]>([]);         
  const [featuredEvents, setFeaturedEvents] = useState<any[]>([]); 
  const [upcomingEvents, setUpcomingEvents] = useState<any[]>([]); 
  const [newsList, setNewsList] = useState<any[]>([]);
  
  const [currentHeroIndex, setCurrentHeroIndex] = useState(0);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [avatarUrl, setAvatarUrl] = useState<string>("");
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const getRoleLabel = (value: string | null) => {
    if (!value) return "";
    const found = ROLE_OPTIONS.find((opt) => opt.value === value);
    return found ? found.label : value;
  };

  const pickRandom = (array: any[], count: number) => {
    const shuffled = [...array].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  };

  const getNextEventDate = (event: any, today: string) => {
    if (event.schedule_type === "one_time") return event.event_date || "9999-99-99";
    if (event.schedule_type === "irregular" && event.irregular_dates) {
      const futureDates = event.irregular_dates.filter((d: string) => d >= today).sort();
      return futureDates[0] || "9999-99-99";
    }
    if (event.schedule_type === "weekly") return today; 
    return "9999-99-99";
  };

  const handleLogout = async () => {
    if (!confirm("ログアウトしますか？")) return;
    await supabase.auth.signOut();
    window.location.reload(); 
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentHeroIndex((prev) => (prev + 1) % HERO_IMAGES.length);
    }, 5000);

    const fetchData = async () => {
      const today = new Date();
      const todayStr = today.toISOString().split("T")[0];
      const periodDate = new Date();
      periodDate.setDate(today.getDate() - 30);
      const periodIso = periodDate.toISOString();

      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setCurrentUser(user);
        const { data: profile } = await supabase.from("profiles").select("avatar_url").eq("user_id", user.id).single();
        if (profile) setAvatarUrl(profile.avatar_url);
      }

      const { data: newsData } = await supabase.from("news").select("*").order("created_at", { ascending: false }).limit(3);
      if (newsData) setNewsList(newsData);

      const { data: eventsData } = await supabase.from("events").select("*").order("created_at", { ascending: false });
      const { data: eventLikes } = await supabase.from("likes").select("event_id").gte("created_at", periodIso);
      const eventLikeCounts: { [key: string]: number } = {};
      if (eventLikes) {
        eventLikes.forEach((like) => { eventLikeCounts[like.event_id] = (eventLikeCounts[like.event_id] || 0) + 1; });
      }

      if (eventsData) {
        const activeEvents = eventsData.filter((event) => {
          if (event.schedule_type === "one_time") return event.event_date >= todayStr;
          if (event.schedule_type === "irregular" && event.irregular_dates) return event.irregular_dates.some((d: string) => d >= todayStr);
          return true;
        });

        const featuredEventPool = [...activeEvents].sort((a, b) => (eventLikeCounts[b.id] || 0) - (eventLikeCounts[a.id] || 0)).slice(0, 20);
        setFeaturedEvents(pickRandom(featuredEventPool, 4));

        const sortedByDate = [...activeEvents].sort((a, b) => {
          const dateA = getNextEventDate(a, todayStr);
          const dateB = getNextEventDate(b, todayStr);
          return dateA < dateB ? -1 : dateA > dateB ? 1 : 0;
        });
        setUpcomingEvents(sortedByDate.slice(0, 4));
      }

      const { data: profilesData } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
      const { data: profileLikes } = await supabase.from("profile_likes").select("target_cast_id").gte("created_at", periodIso);
      const castLikeCounts: { [key: string]: number } = {};
      if (profileLikes) {
        profileLikes.forEach((like) => { castLikeCounts[like.target_cast_id] = (castLikeCounts[like.target_cast_id] || 0) + 1; });
      }

      if (profilesData) {
        setNewCasts(pickRandom(profilesData.slice(0, 20), 4));
        const popularSorted = [...profilesData].sort((a, b) => (castLikeCounts[b.user_id] || 0) - (castLikeCounts[a.user_id] || 0));
        setPopularCasts(pickRandom(popularSorted.slice(0, 20), 4));
      }
    };

    fetchData();
    return () => clearInterval(timer);
  }, []);

  const CastCard = ({ cast }: { cast: any }) => (
    <Link href={`/casts/${cast.user_id}`} style={{ textDecoration: "none", color: "inherit" }}>
      <div className="card hover-up" style={{ padding: "16px", display: "flex", alignItems: "center", gap: "12px" }}>
        <div style={{ width: "50px", height: "50px", borderRadius: "50%", overflow: "hidden", background: "#eee", flexShrink: 0 }}>
          {cast.avatar_url ? <img src={cast.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#ccc" }}>?</div>}
        </div>
        <div style={{ overflow: "hidden" }}>
          <div style={{ fontWeight: "bold", fontSize: "0.95rem", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{cast.display_name}</div>
          <div style={{ fontSize: "0.75rem", color: "var(--muted)" }}>{getRoleLabel(cast.role)}</div>
        </div>
      </div>
    </Link>
  );

  const EventCard = ({ event }: { event: any }) => (
    <Link href={`/events/${event.id}`} style={{ textDecoration: "none", color: "inherit" }}>
      <article className="card hover-up" style={{ padding: "0", overflow: "hidden", height: "100%", display: "flex", flexDirection: "column" }}>
        <div style={{ width: "100%", aspectRatio: "16/9", background: "#eee", position: "relative" }}>
          {event.banner_url ? <img src={event.banner_url} alt={event.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#aaa", fontSize: "0.8rem" }}>NO IMAGE</div>}
          {event.requirements && <div style={{ position: "absolute", bottom: "0", left: "0", right: "0", background: "rgba(124, 58, 237, 0.9)", color: "#fff", padding: "2px 8px", fontSize: "0.7rem", fontWeight: "bold", textAlign: "center" }}>募集中</div>}
        </div>
        <div style={{ padding: "12px", flex: 1 }}>
          <h3 style={{ fontSize: "0.95rem", fontWeight: "bold", marginBottom: "4px", lineHeight: 1.4 }}>{event.title}</h3>
          <div style={{ fontSize: "0.8rem", color: "var(--muted)" }}>{event.schedule_type === "one_time" ? event.event_date : "定期/不定期"}</div>
        </div>
      </article>
    </Link>
  );

  // ★モバイルメニューとPCメニューの中身（スタイル調整済み）
  const MenuContent = () => (
    <div style={{ 
      display: "flex", 
      flexDirection: isMobileMenuOpen ? "column" : "row", 
      alignItems: isMobileMenuOpen ? "flex-start" : "center",
      width: "100%",
      gap: isMobileMenuOpen ? "20px" : "24px"
    }}>
      {/* ナビゲーションリンク */}
      <nav style={{ display: "flex", gap: "16px", flexDirection: isMobileMenuOpen ? "column" : "row", width: isMobileMenuOpen ? "100%" : "auto" }}>
        <Link href="/feedback" onClick={() => setIsMobileMenuOpen(false)} style={{ fontSize: "0.9rem", color: "#555", textDecoration: "none", fontWeight: "500", padding: isMobileMenuOpen ? "12px 0" : "0", borderBottom: isMobileMenuOpen ? "1px solid #eee" : "none", width: isMobileMenuOpen ? "100%" : "auto" }}>フィードバック</Link>
        <Link href="/help" onClick={() => setIsMobileMenuOpen(false)} style={{ fontSize: "0.9rem", color: "#555", textDecoration: "none", fontWeight: "500", padding: isMobileMenuOpen ? "12px 0" : "0", borderBottom: isMobileMenuOpen ? "1px solid #eee" : "none", width: isMobileMenuOpen ? "100%" : "auto" }}>ヘルプ</Link>
      </nav>

      {/* ログイン・ユーザーボタンエリア */}
      <div style={{ width: isMobileMenuOpen ? "100%" : "auto" }}>
        {currentUser ? (
          <div style={{ display: "flex", alignItems: "center", gap: "16px", flexDirection: isMobileMenuOpen ? "column" : "row", width: "100%" }}>
            <Link href="/dashboard" title="ダッシュボードへ" onClick={() => setIsMobileMenuOpen(false)} style={{ display: "flex", alignItems: "center", gap: "12px", textDecoration: "none", color: "inherit", width: isMobileMenuOpen ? "100%" : "auto", padding: isMobileMenuOpen ? "8px 0" : "0" }}>
              <div className="header-avatar-container">
                {avatarUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={avatarUrl} alt="My Menu" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                ) : (
                  <div style={{ width: "100%", height: "100%", background: "#ccc", color: "#fff", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "1.2rem" }}>👤</div>
                )}
              </div>
              {isMobileMenuOpen && <span style={{ fontWeight: "bold", fontSize: "1rem" }}>マイページへ</span>}
            </Link>
            <button onClick={() => { handleLogout(); setIsMobileMenuOpen(false); }} className="btn btn-ghost" style={{ fontSize: "0.9rem", padding: isMobileMenuOpen ? "12px 0" : "8px 16px", textAlign: isMobileMenuOpen ? "left" : "center", width: isMobileMenuOpen ? "100%" : "auto" }}>ログアウト</button>
          </div>
        ) : (
          /* ▼▼▼ ここを修正：モバイル時は幅100%で大きく表示 ▼▼▼ */
          <Link 
            href="/login" 
            onClick={() => setIsMobileMenuOpen(false)} 
            className="btn btn-primary" 
            style={{ 
              padding: isMobileMenuOpen ? "12px 0" : "8px 20px", 
              width: isMobileMenuOpen ? "100%" : "auto", 
              display: "block", 
              textAlign: "center",
              marginTop: isMobileMenuOpen ? "16px" : "0",
              fontWeight: "bold"
            }}
          >
            ログイン / 登録
          </Link>
        )}
      </div>
    </div>
  );

  return (
    <>
      <header className="site-header">
        <div className="container header-inner" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <Link href="/" className="logo-wrap" style={{ textDecoration: 'none' }}>
            <div className="logo-mark">C</div>
            <div className="logo-text-block"><div className="logo-text-main">Castket</div><div className="logo-text-sub">VRChat Event Platform</div></div>
          </Link>
          
          {/* PC用メニュー */}
          <div className="pc-menu" style={{ display: "flex", alignItems: "center" }}>
            <MenuContent />
          </div>

          {/* スマホ用ハンバーガーボタン */}
          <button className="mobile-menu-btn" onClick={() => setIsMobileMenuOpen(true)}>
             <span style={{ fontSize: "1.5rem" }}>≡</span>
          </button>
        </div>
      </header>

      {/* モバイルメニューオーバーレイ */}
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

      <main>
        <section className="hero-section">
          <div className="hero-bg-container">
            {HERO_IMAGES.map((src, index) => (
              <div key={index} className={`hero-bg-slide ${index === currentHeroIndex ? "active" : ""}`} style={{ backgroundImage: `url(${src})` }} />
            ))}
            <div className="hero-overlay"></div>
          </div>
          <div className="container hero-content">
            <h1 className="hero-title animate-fade-up">キミの<span className="text-gradient">「舞台」</span>は、<br/>ここで見つかる。</h1>
            <p className="hero-subtitle animate-fade-up delay-200">Castketは、クリエイターとパフォーマーをつなぐ、<br className="mobile-break" /><span className="text-highlight">VRChat特化型キャスティング・ハブ</span>です。</p>
            <div style={{ display: "flex", justifyContent: "center", gap: "20px", flexWrap: "wrap" }}>
              <Link href="/events" className="hero-btn btn-event">📅 イベントを探す</Link>
              <Link href="/casts" className="hero-btn btn-cast">✨ キャストを探す</Link>
            </div>
          </div>
        </section>

        <div className="container section">
          {newsList.length > 0 && (
            <div style={{ marginBottom: "60px" }}>
              <h2 className="section-title" style={{ textAlign: "left", fontSize: "1.2rem", marginBottom: "16px" }}>📢 お知らせ</h2>
              <div className="card" style={{ padding: "8px 24px" }}>
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                  {newsList.map((news) => (
                    <li key={news.id} style={{ borderBottom: "1px solid #eee", padding: "12px 0", display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "baseline" }}>
                      <span style={{ fontSize: "0.85rem", color: "var(--muted)", fontFamily: "monospace" }}>{new Date(news.created_at).toLocaleDateString()}</span>
                      {news.url ? <a href={news.url} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none", color: "var(--text)", fontWeight: "500" }}>{news.title} ↗</a> : <span style={{ fontWeight: "500" }}>{news.title}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          )}

          <div className="two-col-grid" style={{ marginBottom: "60px" }}>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}><h2 className="section-title" style={{ margin: 0, fontSize: "1.2rem", textAlign: "left" }}>✨ 注目のキャスト</h2><Link href="/casts" style={{ fontSize: "0.85rem", color: "var(--accent)" }}>もっと見る</Link></div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>{popularCasts.map(cast => <CastCard key={cast.user_id} cast={cast} />)}</div>
            </div>
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}><h2 className="section-title" style={{ margin: 0, fontSize: "1.2rem", textAlign: "left" }}>🆕 新着キャスト</h2><Link href="/casts" style={{ fontSize: "0.85rem", color: "var(--accent)" }}>もっと見る</Link></div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>{newCasts.map(cast => <CastCard key={cast.user_id} cast={cast} />)}</div>
            </div>
          </div>

          <div className="two-col-grid">
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}><h2 className="section-title" style={{ margin: 0, fontSize: "1.2rem", textAlign: "left" }}>🔥 注目のイベント</h2><Link href="/events" style={{ fontSize: "0.85rem", color: "var(--accent)" }}>もっと見る</Link></div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>{featuredEvents.map(event => <EventCard key={event.id} event={event} />)}</div>
            </div>
            <div>
               <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}><h2 className="section-title" style={{ margin: 0, fontSize: "1.2rem", textAlign: "left" }}>⏳ 開催間近のイベント</h2><Link href="/events" style={{ fontSize: "0.85rem", color: "var(--accent)" }}>もっと見る</Link></div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>{upcomingEvents.map(event => <EventCard key={event.id} event={event} />)}</div>
            </div>
          </div>
        </div>
      </main>

      <footer style={{ background: "#333", color: "#fff", padding: "60px 20px", marginTop: "60px" }}>
        <div className="container" style={{ textAlign: "center" }}>
          <div style={{ fontSize: "1.5rem", fontWeight: "bold", marginBottom: "16px" }}>Castket</div>
          <p style={{ color: "#aaa", fontSize: "0.9rem" }}>Created for VRChat Community</p>
          <div style={{ marginTop: "32px", color: "#666", fontSize: "0.8rem" }}>&copy; 2026 Castket All rights reserved.</div>
        </div>
      </footer>

      <style jsx>{`
        .mobile-menu-btn { display: none; background: none; border: none; cursor: pointer; color: #333; }
        .mobile-menu-overlay { position: fixed; top: 0; left: 0; width: 100%; height: 100%; background: rgba(0,0,0,0.5); z-index: 999; }
        .mobile-menu-content { position: absolute; top: 0; right: 0; width: 85%; max-width: 320px; height: 100%; background: #fff; padding: 24px; box-shadow: -4px 0 10px rgba(0,0,0,0.1); display: flex; flexDirection: column; }
        
        @media (max-width: 768px) {
          .pc-menu { display: none !important; }
          .mobile-menu-btn { display: block !important; }
        }

        .header-avatar-container { width: 40px; height: 40px; border-radius: 50%; overflow: hidden; border: 2px solid #fff; box-shadow: 0 2px 8px rgba(0,0,0,0.1); transition: transform 0.2s; cursor: pointer; }
        .header-avatar-container:hover { transform: scale(1.1); border-color: var(--accent); }
        .hero-section { position: relative; padding: 100px 20px; text-align: center; overflow: hidden; background: #fdfbfb; }
        .hero-bg-container { position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: 1; }
        .hero-bg-slide { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background-size: cover; background-position: center; opacity: 0; transition: opacity 2s ease-in-out; }
        .hero-bg-slide.active { opacity: 1; }
        .hero-overlay { position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: rgba(255, 255, 255, 0.75); z-index: 2; }
        .hero-content { position: relative; z-index: 10; }
        .hero-title { font-size: 2.5rem; font-weight: 800; margin-bottom: 24px; color: #333; line-height: 1.3; }
        .hero-subtitle { font-size: 1.1rem; color: #444; margin-bottom: 40px; font-weight: 500; }
        .two-col-grid { display: grid; grid-template-columns: 1fr; gap: 40px; }
        @media (min-width: 768px) { .two-col-grid { grid-template-columns: 1fr 1fr; } }
      `}</style>
    </>
  );
}