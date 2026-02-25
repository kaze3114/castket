"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import dayjs from "dayjs";
import "dayjs/locale/ja";

// ※ WEEKDAY_MAP が必要なら定義します
const WEEKDAY_MAP: Record<string, string> = {
  Mon: "月", Tue: "火", Wed: "水", Thu: "木", Fri: "金", Sat: "土", Sun: "日",
};

dayjs.locale("ja");

export default function PastEventsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // 時間表示用のヘルパー関数
  const renderEventSchedule = (event: any) => {
    const start = event.start_time ? event.start_time.slice(0, 5) : "";
    const end = event.end_time ? event.end_time.slice(0, 5) : "";
    const timeStr = start || end ? `${start} ~ ${end}` : "";

    let dateContent;

    if (event.schedule_type === "one_time") {
      dateContent = (
        <>
          <span style={{ marginRight: "4px" }}>📅</span>
          {event.event_date}
        </>
      );
    } else if (event.schedule_type === "weekly") {
      const days = event.weekdays && Array.isArray(event.weekdays)
        ? event.weekdays.map((d: string) => WEEKDAY_MAP[d] || d).join("・")
        : "曜日未定";
      dateContent = (
        <>
          <span style={{ marginRight: "4px" }}>🔄</span>
          毎週 <span>{days}曜</span>
        </>
      );
    } else {
      dateContent = <span>❓ 不定期</span>;
    }

    return (
      <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "8px" }}>
        <div style={{ 
          color: "#888", // 過去イベントなので色を落ち着かせる
          fontWeight: "bold", 
          fontSize: "0.9rem",
          display: "flex", 
          alignItems: "center"
        }}>
          {dateContent}
        </div>
        
        {timeStr && (
          <div style={{ 
            display: "flex", 
            alignItems: "center", 
            gap: "4px", 
            fontSize: "0.8rem", 
            color: "#888", 
            background: "#f3f4f6", 
            padding: "2px 8px", 
            borderRadius: "4px",
            border: "1px solid #eee"
          }}>
            <span>⏰</span>
            <span style={{ fontFamily: "monospace", fontWeight: "bold" }}>{timeStr}</span>
          </div>
        )}
      </div>
    );
  };

  useEffect(() => {
    const fetchPastEvents = async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*, likes(count)") 
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error);
      } else {
        const todayStr = new Date().toISOString().split("T")[0];

        const formattedEvents = (data || []).map((event: any) => ({
          ...event,
          likesCount: event.likes ? event.likes[0]?.count || 0 : 0,
          tags: event.tags || []
        }));

        // ▼▼▼ アーカイブ用の真逆のフィルターロジック ▼▼▼
        const pastEvents = formattedEvents.filter((event) => {
          if (event.schedule_type === "one_time") {
            // 単発イベント：今日より前の日付ならアーカイブへ
            return event.event_date < todayStr;
          }
          if (event.schedule_type === "irregular" && event.irregular_dates) {
            // 不定期イベント：設定された「すべての日付」が今日より前ならアーカイブへ
            return event.irregular_dates.every((d: string) => d < todayStr);
          }
          // 毎週(weekly)は「終了」という概念がないため、アーカイブには入れない
          return false; 
        });

        // 開催日が新しい順（直近で終わった順）に並び替える
        pastEvents.sort((a, b) => dayjs(b.event_date).diff(dayjs(a.event_date)));

        setEvents(pastEvents);
      }
      setLoading(false);
    };

    fetchPastEvents();
  }, []);

  if (loading) return <div style={{ padding: "40px", textAlign: "center" }}>読み込み中...</div>;

  return (
    <main className="section section-soft" style={{ minHeight: "100vh" }}>
      <div className="container">
        
        <div style={{ marginBottom: "24px", display: "flex", justifyContent: "space-between", alignItems: "flex-end", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h1 className="section-title" style={{ margin: 0, textAlign: "left", color: "#666" }}>
              📜 過去のイベントログ
            </h1>
            <p style={{ margin: "8px 0 0 0", color: "#888", fontSize: "0.9rem" }}>
              これまでに開催されたイベントの記録です。
            </p>
          </div>
          <Link href="/events" className="btn btn-ghost" style={{ fontSize: "0.9rem" }}>
            ← 募集中のイベントに戻る
          </Link>
        </div>

        <div style={{ marginBottom: "16px" }}>
          <p style={{ margin: 0, color: "#666", fontSize: "0.9rem" }}>
            全 <b>{events.length}</b> 件のアーカイブ
          </p>
        </div>
        
        {events.length === 0 ? (
          <div className="card" style={{ textAlign: "center", padding: "60px" }}>
            <p style={{ color: "#888" }}>過去のイベントはまだありません。</p>
          </div>
        ) : (
          <div className="event-grid event-container" style={{ display: "grid", gap: "24px", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))" }}>
            {events.map((event) => (
              <div key={event.id} className="card event-card" style={{ padding: "0", overflow: "hidden", display: "flex", flexDirection: "column", opacity: 0.85 }}>
                {/* 終了タグを画像の上に表示 */}
                <div className="card-image" style={{ width: "100%", aspectRatio: "16/9", background: "#f0f0f0", position: "relative", filter: "grayscale(30%)" }}>
                  <div style={{ position: "absolute", top: "8px", left: "8px", display: "flex", gap: "4px", flexWrap: "wrap" }}>
                    <span style={{ background: "#333", color: "#fff", padding: "4px 8px", borderRadius: "4px", fontSize: "0.75rem", fontWeight: "bold" }}>
                      終了済
                    </span>
                  </div>
                  {event.banner_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={event.banner_url} alt={event.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  ) : (
                    <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#ccc", fontSize: "0.9rem" }}>NO IMAGE</div>
                  )}
                </div>
                <div style={{ padding: "16px", flex: 1, display: "flex", flexDirection: "column", width: "100%" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                    <div style={{ marginBottom: "8px" }}>
                      {renderEventSchedule(event)}
                    </div>
                    <div style={{ fontSize: "0.8rem", color: "#ff4757", fontWeight: "bold", display: "flex", alignItems: "center", gap: "4px" }}>
                      <span>♥</span> {event.likesCount}
                    </div>
                  </div>
                  <h3 style={{ fontSize: "1.1rem", fontWeight: "bold", marginBottom: "8px", lineHeight: 1.4, color: "#444" }}>
                    {event.title}
                  </h3>
                  <div className="card-desc" style={{ fontSize: "0.9rem", color: "#888", marginBottom: "16px", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", overflow: "hidden", flex: 1 }}>
                    {event.description}
                  </div>
                  <Link href={`/events/${event.id}`} className="btn btn-ghost" style={{ width: "100%", textAlign: "center", marginTop: "auto" }}>
                    当時の詳細を見る
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}