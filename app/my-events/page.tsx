"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function MyEventsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [organizedEvents, setOrganizedEvents] = useState<any[]>([]);
  const [participatingEvents, setParticipatingEvents] = useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

      const [
        { data: organized },
        { data: entries },
        { data: offers },
      ] = await Promise.all([
        supabase.from("events").select("*").eq("organizer_id", user.id).order("created_at", { ascending: false }),
        supabase.from("entries").select("event_id, events(*)").eq("cast_id", user.id).eq("status", "Accepted"),
        supabase.from("offers").select("event_id, events(*)").eq("receiver_id", user.id).eq("status", "accepted"),
      ]);

      if (organized) setOrganizedEvents(organized);

      const eventMap = new Map<number, any>();
      for (const e of (entries || [])) {
        if (e.events) eventMap.set(e.event_id, { ...(e.events as any), joinType: "entry" });
      }
      for (const o of (offers || [])) {
        if (o.events && !eventMap.has(o.event_id)) eventMap.set(o.event_id, { ...(o.events as any), joinType: "offer" });
      }
      setParticipatingEvents([...eventMap.values()].sort((a, b) =>
        new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
      ));

      setLoading(false);
    };
    fetchData();
  }, [router]);

  const isEnded = (event: any) => {
    const today = new Date().toISOString().split("T")[0];
    if (event.end_date) return event.end_date < today;
    if (event.schedule_type === "one_time") return (event.event_date ?? "") < today;
    if (event.schedule_type === "irregular") return event.irregular_dates?.every((d: string) => d < today) ?? false;
    return false;
  };

  const scheduleLabel = (event: any) => {
    if (event.schedule_type === "one_time") return event.event_date ?? "";
    if (event.schedule_type === "weekly") return "毎週開催";
    if (event.schedule_type === "irregular") return "不定期開催";
    return "";
  };

  const EventCard = ({ event, actions }: { event: any; actions: React.ReactNode }) => {
    const ended = isEnded(event);
    return (
      <div className="card" style={{ padding: 0, overflow: "hidden", opacity: ended ? 0.72 : 1 }}>
        <div style={{ display: "flex", alignItems: "stretch" }}>
          <div style={{ width: "110px", flexShrink: 0, background: "#eee" }}>
            {event.banner_url
              ? <img src={event.banner_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              : <div style={{ width: "100%", minHeight: "90px", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#ccc", fontSize: "0.75rem" }}>NO IMG</div>
            }
          </div>
          <div style={{ flex: 1, padding: "14px 16px", display: "flex", flexDirection: "column", gap: "6px", minWidth: 0 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: "8px" }}>
              <div style={{ fontWeight: "bold", fontSize: "1rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {event.title}
              </div>
              <span style={{
                fontSize: "0.72rem", padding: "2px 9px", borderRadius: "99px", fontWeight: "bold", flexShrink: 0,
                background: ended ? "#e5e7eb" : "#dcfce7",
                color: ended ? "#6b7280" : "#16a34a",
              }}>
                {ended ? "終了済み" : "開催中"}
              </span>
            </div>
            <div style={{ fontSize: "0.82rem", color: "var(--muted)" }}>
              {scheduleLabel(event)}{event.end_date && ` 〜 ${event.end_date}`}
            </div>
            <div style={{ display: "flex", gap: "8px", marginTop: "auto", flexWrap: "wrap" }}>
              {actions}
            </div>
          </div>
        </div>
      </div>
    );
  };

  if (loading) return <div style={{ padding: "40px", textAlign: "center" }}>読み込み中...</div>;

  return (
    <main className="section section-soft" style={{ minHeight: "100vh" }}>
      <div className="container" style={{ maxWidth: "860px" }}>

        {/* 主催イベント */}
        <section style={{ marginBottom: "48px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h2 className="section-title" style={{ textAlign: "left", margin: 0, fontSize: "1.4rem" }}>
              👑 主催イベント
              <span style={{ fontSize: "0.9rem", fontWeight: "normal", color: "var(--muted)", marginLeft: "8px" }}>
                {organizedEvents.length}件
              </span>
            </h2>
            <Link href="/dashboard/events">
              <button className="btn btn-primary" style={{ fontSize: "0.85rem", padding: "8px 16px" }}>+ 新規作成</button>
            </Link>
          </div>

          {organizedEvents.length === 0 ? (
            <div className="card" style={{ textAlign: "center", padding: "48px", color: "var(--muted)" }}>
              <p style={{ marginBottom: "16px" }}>まだイベントを作成していません</p>
              <Link href="/dashboard/events">
                <button className="btn btn-primary">最初のイベントを作成する</button>
              </Link>
            </div>
          ) : (
            <div style={{ display: "grid", gap: "12px" }}>
              {organizedEvents.map(event => (
                <EventCard
                  key={event.id}
                  event={event}
                  actions={
                    <>
                      <Link href={`/events/${event.id}`}>
                        <button className="btn btn-ghost" style={{ fontSize: "0.8rem", padding: "5px 12px" }}>詳細</button>
                      </Link>
                      <Link href={`/dashboard/events/${event.id}`}>
                        <button className="btn btn-ghost" style={{ fontSize: "0.8rem", padding: "5px 12px" }}>👥 応募管理</button>
                      </Link>
                      <Link href="/dashboard/events">
                        <button className="btn btn-ghost" style={{ fontSize: "0.8rem", padding: "5px 12px" }}>✎ 編集</button>
                      </Link>
                    </>
                  }
                />
              ))}
            </div>
          )}
        </section>

        {/* 参加イベント */}
        <section>
          <h2 className="section-title" style={{ textAlign: "left", marginBottom: "20px", fontSize: "1.4rem" }}>
            🎭 参加イベント
            <span style={{ fontSize: "0.9rem", fontWeight: "normal", color: "var(--muted)", marginLeft: "8px" }}>
              {participatingEvents.length}件
            </span>
          </h2>

          {participatingEvents.length === 0 ? (
            <div className="card" style={{ textAlign: "center", padding: "48px", color: "var(--muted)" }}>
              <p style={{ marginBottom: "16px" }}>採用・マッチング済みのイベントはありません</p>
              <Link href="/events">
                <button className="btn btn-ghost">イベントを探す</button>
              </Link>
            </div>
          ) : (
            <div style={{ display: "grid", gap: "12px" }}>
              {participatingEvents.map(event => (
                <EventCard
                  key={event.id}
                  event={event}
                  actions={
                    <>
                      <span style={{
                        fontSize: "0.72rem", padding: "2px 9px", borderRadius: "99px", alignSelf: "center",
                        background: event.joinType === "entry" ? "#ede9fe" : "#e0f2fe",
                        color: event.joinType === "entry" ? "#7c3aed" : "#0284c7",
                      }}>
                        {event.joinType === "entry" ? "応募採用" : "オファー"}
                      </span>
                      <Link href={`/events/${event.id}`}>
                        <button className="btn btn-ghost" style={{ fontSize: "0.8rem", padding: "5px 12px" }}>詳細・チャット</button>
                      </Link>
                    </>
                  }
                />
              ))}
            </div>
          )}
        </section>

      </div>
    </main>
  );
}
