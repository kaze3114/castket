"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { WEEKDAY_MAP } from "@/lib/constants";

export default function PastEventsPage() {
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchEvents = async () => {
      const { data, error } = await supabase
        .from("events")
        .select("*");

      if (error) {
        console.error(error);
        setLoading(false);
        return;
      }

      if (data) {
        const todayStr = new Date().toISOString().split("T")[0];

        // ▼▼▼ 判定ロジック：終わったイベントだけを残す ▼▼▼
        const pastEvents = data.filter((event) => {
          // 単発: 開催日が「昨日以前」ならOK
          if (event.schedule_type === "one_time") {
            return event.event_date < todayStr;
          }
          // 不定期: 全ての日付が「昨日以前」ならOK
          // (未来の日付が1つでも残っていれば、それはまだ現役イベント)
          if (event.schedule_type === "irregular" && event.irregular_dates) {
            return event.irregular_dates.every((d: string) => d < todayStr);
          }
          // 定期(毎週): 基本的に終わらないので、過去ログには出さない（ずっと現役）
          if (event.schedule_type === "weekly") {
            return false;
          }
          return false;
        });

        // ▼▼▼ 並び替え：最近終わったもの順（降順） ▼▼▼
        const sortedEvents = pastEvents.sort((a, b) => {
          const dateA = getLastEventDate(a);
          const dateB = getLastEventDate(b);
          // 新しい日付が大きいので、b - a で降順にする
          if (dateA < dateB) return 1;
          if (dateA > dateB) return -1;
          return 0;
        });

        setEvents(sortedEvents);
      }
      setLoading(false);
    };

    fetchEvents();
  }, []);

  // 最後に開催した日を取得するヘルパー
  const getLastEventDate = (event: any) => {
    if (event.schedule_type === "one_time") {
      return event.event_date || "0000-00-00";
    }
    if (event.schedule_type === "irregular" && event.irregular_dates) {
      // 日付をソートして一番最後のものを取る
      const sortedDates = event.irregular_dates.sort();
      return sortedDates[sortedDates.length - 1] || "0000-00-00";
    }
    return "0000-00-00";
  };

  const formatTime = (time: string) => (time ? time.slice(0, 5) : "");

  if (loading) return <div style={{ padding: "40px", textAlign: "center" }}>読み込み中...</div>;

  return (
    <>
      <header className="site-header">
        <div className="container header-inner">
          <Link href="/events" className="logo-wrap" style={{ textDecoration: 'none' }}>
            <div className="logo-mark">C</div>
            <div className="logo-text-block">
              <div className="logo-text-main">Castket</div>
              <div className="logo-text-sub">Archive</div>
            </div>
          </Link>
          <div className="header-actions">
            <Link href="/events" className="btn btn-ghost">一覧に戻る</Link>
          </div>
        </div>
      </header>

      <main className="section section-soft" style={{ minHeight: "100vh" }}>
        <div className="container">
          <h1 className="section-title" style={{ textAlign: "left", marginBottom: "32px", color: "var(--muted)" }}>
            📜 過去のイベントログ
          </h1>

          {events.length === 0 ? (
            <div style={{ textAlign: "center", padding: "60px", color: "var(--muted)" }}>
              <p>過去のイベント履歴はありません。</p>
            </div>
          ) : (
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "24px" }}>
              {events.map((event) => (
                <Link href={`/events/${event.id}`} key={event.id} style={{ textDecoration: "none", color: "inherit" }}>
                  <article className="card" style={{ padding: "0", overflow: "hidden", height: "100%", display: "flex", flexDirection: "column", opacity: 0.8, filter: "grayscale(30%)" }}>
                    
                    {/* 画像エリア */}
                    <div style={{ width: "100%", aspectRatio: "16/9", background: "#eee", position: "relative" }}>
                      {event.banner_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={event.banner_url} alt={event.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      ) : (
                        <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#aaa", fontWeight: "bold" }}>NO IMAGE</div>
                      )}
                      <div style={{ position: "absolute", top: "12px", left: "12px", background: "#666", color: "#fff", padding: "4px 12px", borderRadius: "99px", fontSize: "0.75rem", fontWeight: "bold" }}>
                        終了
                      </div>
                    </div>

                    <div style={{ padding: "20px", flex: 1, display: "flex", flexDirection: "column" }}>
                      <h2 style={{ fontSize: "1.1rem", fontWeight: "bold", marginBottom: "8px", color: "var(--text)" }}>
                        {event.title}
                      </h2>
                      <div style={{ marginTop: "auto", fontSize: "0.9rem", color: "var(--muted)" }}>
                        開催日: {event.schedule_type === "one_time" ? event.event_date : "全日程終了"}
                      </div>
                    </div>
                  </article>
                </Link>
              ))}
            </div>
          )}
        </div>
      </main>
    </>
  );
}