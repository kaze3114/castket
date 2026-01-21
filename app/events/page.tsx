"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import dayjs from "dayjs";
import "dayjs/locale/ja";
// ▼ 定数をインポート
import { EVENT_TAGS } from "@/lib/constants";

dayjs.locale("ja");

export default function EventListPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [viewMode, setViewMode] = useState<"grid" | "list" | "compact">("grid");
  const [sortBy, setSortBy] = useState<"date" | "likes" | "capacity">("date");

  // 絞り込みステート
  const [filterFreq, setFilterFreq] = useState<string | null>(null);
  const [filterTime, setFilterTime] = useState<string | null>(null);
  const [filterGenre, setFilterGenre] = useState<string | null>(null);

  useEffect(() => {
    const fetchEvents = async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*, likes(count)") 
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error);
      } else {
        const formattedEvents = (data || []).map((event: any) => ({
          ...event,
          likesCount: event.likes ? event.likes[0]?.count || 0 : 0,
          tags: event.tags || []
        }));
        setEvents(formattedEvents);
      }
      setLoading(false);
    };

    fetchEvents();
  }, []);

  // 絞り込みロジック
  const filteredEvents = events.filter((event) => {
    if (filterFreq) {
      if (event.schedule_type !== filterFreq) return false;
    }
    if (filterTime) {
      if (event.schedule_type === "one_time" && event.event_date) {
        const eventDate = dayjs(event.event_date);
        const now = dayjs();
        if (filterTime === "this_month") {
          if (!eventDate.isSame(now, "month")) return false;
        } else if (filterTime === "next_month") {
          if (!eventDate.isSame(now.add(1, "month"), "month")) return false;
        } else if (filterTime === "future") {
          const endOfNextMonth = now.add(1, "month").endOf("month");
          if (!eventDate.isAfter(endOfNextMonth)) return false;
        }
      }
    }
    // ▼ constantsのタグで絞り込み
    if (filterGenre) {
      if (!event.tags || !event.tags.includes(filterGenre)) return false;
    }
    return true;
  });

  // 並べ替えロジック
  const sortedEvents = [...filteredEvents].sort((a, b) => {
    if (sortBy === "date") {
      return dayjs(a.event_date).diff(dayjs(b.event_date));
    }
    if (sortBy === "likes") {
      return b.likesCount - a.likesCount;
    }
    if (sortBy === "capacity") {
      const capA = a.capacity || 9999;
      const capB = b.capacity || 9999;
      return capA - capB;
    }
    return 0;
  });

  const clearFilters = () => {
    setFilterFreq(null);
    setFilterTime(null);
    setFilterGenre(null);
  };

  if (loading) return <div style={{ padding: "40px", textAlign: "center" }}>読み込み中...</div>;

  return (
    <>
      <header className="site-header">
        <div className="container header-inner">
          <Link href="/" className="logo-wrap" style={{ textDecoration: 'none' }}>
            <div className="logo-mark">C</div>
            <div className="logo-text-block">
              <div className="logo-text-main">Castket</div>
              <div className="logo-text-sub">Event List</div>
            </div>
          </Link>
          <div className="header-actions">
            <Link href="/dashboard" className="btn btn-ghost">マイページへ</Link>
          </div>
        </div>
      </header>

      <main className="section section-soft" style={{ minHeight: "100vh" }}>
        <div className="container">
          
          <div style={{ marginBottom: "24px" }}>
            <h1 className="section-title" style={{ margin: "0 0 16px 0", textAlign: "left" }}>キャスト募集中のイベント</h1>
            
            <div className="filter-box" style={{ background: "#fff", padding: "20px", borderRadius: "12px", border: "1px solid #eee", marginBottom: "24px" }}>
              <div style={{ fontSize: "0.9rem", fontWeight: "bold", marginBottom: "12px", color: "#333", display: "flex", justifyContent: "space-between" }}>
                <span>🔍 条件で絞り込む</span>
                {(filterFreq || filterTime || filterGenre) && (
                  <button onClick={clearFilters} style={{ background: "none", border: "none", color: "#ff4757", cursor: "pointer", fontSize: "0.85rem", textDecoration: "underline" }}>
                    × 条件をクリア
                  </button>
                )}
              </div>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div className="filter-row">
                  <span className="filter-label">頻度:</span>
                  <div className="filter-options">
                    <button className={`filter-chip ${filterFreq === "weekly" ? "active" : ""}`} onClick={() => setFilterFreq(filterFreq === "weekly" ? null : "weekly")}>毎週</button>
                    <button className={`filter-chip ${filterFreq === "one_time" ? "active" : ""}`} onClick={() => setFilterFreq(filterFreq === "one_time" ? null : "one_time")}>単発</button>
                    <button className={`filter-chip ${filterFreq === "irregular" ? "active" : ""}`} onClick={() => setFilterFreq(filterFreq === "irregular" ? null : "irregular")}>不定期</button>
                  </div>
                </div>

                <div className="filter-row">
                  <span className="filter-label">時期:</span>
                  <div className="filter-options">
                    <button className={`filter-chip ${filterTime === "this_month" ? "active" : ""}`} onClick={() => setFilterTime(filterTime === "this_month" ? null : "this_month")}>今月</button>
                    <button className={`filter-chip ${filterTime === "next_month" ? "active" : ""}`} onClick={() => setFilterTime(filterTime === "next_month" ? null : "next_month")}>来月</button>
                    <button className={`filter-chip ${filterTime === "future" ? "active" : ""}`} onClick={() => setFilterTime(filterTime === "future" ? null : "future")}>再来月以降</button>
                  </div>
                </div>

                {/* ▼ constants の EVENT_TAGS を使用 */}
                <div className="filter-row">
                  <span className="filter-label">タグ:</span>
                  <div className="filter-options">
                    {EVENT_TAGS.map((g) => (
                      <button 
                        key={g} 
                        className={`filter-chip ${filterGenre === g ? "active" : ""}`} 
                        onClick={() => setFilterGenre(filterGenre === g ? null : g)}
                      >
                        {g}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
              <p style={{ margin: 0, color: "#666", fontSize: "0.9rem" }}>
                <b>{sortedEvents.length}</b> 件ヒット
              </p>
              
              <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="sort-select">
                    <option value="date">📅 開催日が近い順</option>
                    <option value="likes">💖 人気順 (Like)</option>
                    <option value="capacity">👥 募集人数が少ない順</option>
                  </select>
                </div>
                <div className="view-toggle-area" style={{ margin: 0 }}>
                  <button className={`view-btn ${viewMode === "grid" ? "active" : ""}`} onClick={() => setViewMode("grid")} title="グリッド">田</button>
                  <button className={`view-btn ${viewMode === "list" ? "active" : ""}`} onClick={() => setViewMode("list")} title="リスト">☰</button>
                  <button className={`view-btn ${viewMode === "compact" ? "active" : ""}`} onClick={() => setViewMode("compact")} title="テキスト">≣</button>
                </div>
              </div>
            </div>
          </div>
          
          {/* イベントリスト描画 */}
          {sortedEvents.length === 0 ? (
            <div className="card" style={{ textAlign: "center", padding: "60px" }}>
              <p>条件に一致するイベントはありませんでした。</p>
              <button onClick={clearFilters} className="btn btn-ghost" style={{ marginTop: "16px" }}>条件をリセットする</button>
            </div>
          ) : (
            <div className={`event-grid event-container ${viewMode === "list" ? "list-view" : ""} ${viewMode === "compact" ? "compact-view" : ""}`} style={{ display: "grid", gap: "24px", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}>
              {sortedEvents.map((event) => (
                <div key={event.id} className={`card hover-up event-card ${viewMode === "list" ? "list-view" : ""} ${viewMode === "compact" ? "compact-view" : ""}`} style={{ padding: "0", overflow: "hidden", display: "flex", flexDirection: "column" }}>
                  <div className="card-image" style={{ width: "100%", aspectRatio: "16/9", background: "#f0f0f0", position: "relative" }}>
                    <div style={{ position: "absolute", top: "8px", left: "8px", display: "flex", gap: "4px", flexWrap: "wrap" }}>
                      <span style={{ background: "rgba(0,0,0,0.6)", color: "#fff", padding: "4px 8px", borderRadius: "4px", fontSize: "0.75rem", fontWeight: "bold" }}>
                        {event.schedule_type === "one_time" ? "単発" : event.schedule_type === "weekly" ? "毎週" : "不定期"}
                      </span>
                      {/* タグ表示 */}
                      {event.tags && event.tags.map((tag: string) => (
                         <span key={tag} style={{ background: "rgba(124, 58, 237, 0.9)", color: "#fff", padding: "4px 8px", borderRadius: "4px", fontSize: "0.75rem", fontWeight: "bold" }}>
                           {tag}
                         </span>
                      ))}
                    </div>
                    {event.capacity && (
                      <div style={{ position: "absolute", bottom: "8px", right: "8px" }}>
                        <span style={{ background: "rgba(255,255,255,0.9)", color: "#333", padding: "4px 8px", borderRadius: "4px", fontSize: "0.75rem", fontWeight: "bold", boxShadow: "0 2px 4px rgba(0,0,0,0.1)" }}>
                          残り {event.capacity}枠
                        </span>
                      </div>
                    )}
                    {event.banner_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={event.banner_url} alt={event.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    ) : (
                      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#ccc", fontSize: "0.9rem" }}>NO IMAGE</div>
                    )}
                  </div>
                  <div style={{ padding: "16px", flex: 1, display: "flex", flexDirection: "column", width: "100%" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                      <div style={{ fontSize: "0.85rem", color: "var(--accent)", fontWeight: "bold" }}>
                        {event.schedule_type === "one_time" 
                          ? `${event.event_date}　${event.start_time} ~ ${event.end_time}`
                          : `${event.weekly_day}　${event.start_time} ~ ${event.end_time}`
                        }
                      </div>
                      <div style={{ fontSize: "0.8rem", color: "#ff4757", fontWeight: "bold", display: "flex", alignItems: "center", gap: "4px" }}>
                        <span>♥</span> {event.likesCount}
                      </div>
                    </div>
                    <h3 style={{ fontSize: "1.1rem", fontWeight: "bold", marginBottom: "8px", lineHeight: 1.4 }}>
                      {event.title}
                    </h3>
                    <div className="card-desc" style={{ fontSize: "0.9rem", color: "#666", marginBottom: "16px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", flex: 1 }}>
                      {event.description}
                    </div>
                    {viewMode !== "compact" && (
                       <Link href={`/events/${event.id}`} className="btn btn-ghost" style={{ width: "100%", textAlign: "center", marginTop: "auto" }}>詳細を見る</Link>
                    )}
                    {viewMode === "compact" && (
                       <Link href={`/events/${event.id}`} style={{ marginLeft: "auto", color: "var(--accent)", textDecoration: "none", fontWeight: "bold" }}>詳細 &rarr;</Link>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <style jsx>{`
        .filter-row { display: flex; align-items: flex-start; gap: 16px; }
        .filter-label { font-weight: bold; font-size: 0.9rem; color: #666; width: 60px; padding-top: 6px; flex-shrink: 0; }
        .filter-options { display: flex; flex-wrap: wrap; gap: 8px; flex: 1; }
        .filter-chip { background: #f5f5f5; border: 1px solid #ddd; padding: 6px 12px; border-radius: 99px; cursor: pointer; font-size: 0.85rem; color: #555; transition: all 0.2s; }
        .filter-chip:hover { background: #eaeaea; }
        .filter-chip.active { background: var(--accent); color: #fff; border-color: var(--accent); }
        .sort-select { padding: 8px 12px; border-radius: 8px; border: 1px solid #ddd; background: #fff; font-size: 0.9rem; cursor: pointer; outline: none; }
        .hover-up { transition: transform 0.2s, box-shadow 0.2s; }
        .hover-up:hover { transform: translateY(-4px); box-shadow: 0 10px 20px rgba(0,0,0,0.1); }
        @media (max-width: 600px) { .filter-row { flex-direction: column; gap: 8px; } .filter-label { width: auto; padding-top: 0; } }
      `}</style>
    </>
  );
}