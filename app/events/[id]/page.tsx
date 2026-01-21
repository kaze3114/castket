"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { WEEKDAY_MAP } from "@/lib/constants";
import { checkUserRestriction } from "@/app/actions/moderate";
import LikeButton from "@/components/LikeButton";
import BookmarkButton from "@/components/BookmarkButton";

export default function EventDetailPage() {
  const params = useParams();
  const router = useRouter();
  
  const [event, setEvent] = useState<any>(null);
  const [organizer, setOrganizer] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // 応募機能
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [hasApplied, setHasApplied] = useState(false);
  const [entryStatus, setEntryStatus] = useState("");
  const [applying, setApplying] = useState(false);

  // 満員判定
  const [acceptedCount, setAcceptedCount] = useState(0);
  const [isFull, setIsFull] = useState(false);

  // ★追加：いいね機能用
  const [likeCount, setLikeCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    const fetchAllData = async () => {
      if (!params?.id) return;

      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      // 1. イベント取得
      const { data: eventData, error } = await supabase
        .from("events")
        .select("*")
        .eq("id", params.id)
        .single();

      if (error || !eventData) {
        setLoading(false);
        return;
      }
      setEvent(eventData);

      // 2. 主催者取得
      const { data: profileData } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", eventData.organizer_id)
        .single();
      if (profileData) setOrganizer(profileData);

      // 3. 採用人数カウント
      const { count: currentAccepted } = await supabase
        .from("entries")
        .select("id", { count: "exact", head: true })
        .eq("event_id", params.id)
        .eq("status", "Accepted");
      
      const accCount = currentAccepted || 0;
      setAcceptedCount(accCount);
      if (eventData.capacity && accCount >= eventData.capacity) setIsFull(true);

      // 4. 応募状況確認
      if (user) {
        const { data: entryData } = await supabase
          .from("entries")
          .select("*")
          .eq("event_id", params.id)
          .eq("cast_id", user.id)
          .single();
        if (entryData) {
          setHasApplied(true);
          setEntryStatus(entryData.status);
        }
      }

      // ★追加 5. いいね情報の取得
      // (A) 全体のいいね数を数える
      const { count: totalLikes } = await supabase
        .from("likes")
        .select("id", { count: "exact", head: true })
        .eq("event_id", params.id);
      setLikeCount(totalLikes || 0);

      // (B) 自分がいいねしているか確認
      if (user) {
        const { data: myLike } = await supabase
          .from("likes")
          .select("id")
          .eq("event_id", params.id)
          .eq("user_id", user.id)
          .single(); // あればデータが返る、なければnull
        if (myLike) setIsLiked(true);
      }

      setLoading(false);
    };

    fetchAllData();
  }, [params]);

  const handleApply = async () => {
    if (!currentUser) {
      router.push("/login");
      return;
    }

    const restriction = await checkUserRestriction(currentUser.id);
    if (!restriction.allowed) {
      alert(`【操作制限】\n${restriction.reason}`);
      return;
    }

    const message = window.prompt("主催者へのメッセージを入力してください（任意）", "ぜひ参加させてください！");
    if (message === null) return; 

    setApplying(true);

    try {
      const { error } = await supabase
        .from("entries")
        .insert({
          event_id: event.id,
          cast_id: currentUser.id,
          type: "Apply",
          status: "Pending",
          message: message,
        });

      if (error) throw error;
      alert("応募しました！");
      setHasApplied(true);
      setEntryStatus("Pending");
    } catch (error: any) {
      alert("エラー: " + error.message);
    } finally {
      setApplying(false);
    }
  };

  const formatTime = (time: string) => (time ? time.slice(0, 5) : "");

  if (loading) return <div style={{ padding: "40px", textAlign: "center" }}>読み込み中...</div>;

  if (!event) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <h2>イベントが見つかりません</h2>
        <Link href="/events" className="btn btn-primary" style={{ marginTop: "20px", display: "inline-block" }}>
          一覧に戻る
        </Link>
      </div>
    );
  }

  const isMyEvent = currentUser && currentUser.id === event.organizer_id;

  return (
    <>
      <header className="site-header">
        <div className="container header-inner">
          <Link href="/events" className="logo-wrap" style={{ textDecoration: 'none' }}>
            <div className="logo-mark">C</div>
            <div className="logo-text-block">
              <div className="logo-text-main">Castket</div>
              <div className="logo-text-sub">Event Detail</div>
            </div>
          </Link>
          <div className="header-actions">
            <Link href="/events" className="btn btn-ghost">一覧に戻る</Link>
          </div>
        </div>
      </header>

      <main className="section section-soft" style={{ minHeight: "100vh" }}>
        <div className="container" style={{ maxWidth: "800px" }}>
          
          <article className="card" style={{ padding: 0, overflow: "hidden" }}>
            
            <div style={{ width: "100%", background: "var(--bg)", borderBottom: "1px solid var(--border)" }}>
              {event.banner_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={event.banner_url} alt={event.title} style={{ width: "100%", height: "auto", maxHeight: "500px", objectFit: "contain", display: "block", margin: "0 auto" }} />
              ) : (
                <div style={{ padding: "60px", textAlign: "center", color: "var(--muted)", fontWeight: "bold" }}>NO IMAGE</div>
              )}
            </div>

            <div style={{ padding: "32px" }}>
              
              <div style={{ marginBottom: "16px" }}>
                 <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", alignItems: "center", marginBottom: "8px" }}>
                    <span style={{ padding: "4px 12px", background: "var(--accent)", color: "#fff", borderRadius: "99px", fontSize: "0.85rem", fontWeight: "bold" }}>
                      {event.schedule_type === "one_time" && "📅 単発イベント"}
                      {event.schedule_type === "weekly" && "🔄 毎週開催"}
                      {event.schedule_type === "irregular" && "🗒 不定期開催"}
                    </span>
                    {event.tags && event.tags.map((tag: string) => (
                      <span key={tag} style={{ fontSize: "0.75rem", padding: "4px 12px", background: "#f0f0f0", borderRadius: "99px", color: "var(--text)" }}>#{tag}</span>
                    ))}
                 </div>
                 
                 <div style={{ display: "flex", justifyContent: "space-between", alignItems: "end", flexWrap: "wrap" }}>
                   <div style={{ fontSize: "1.1rem", fontWeight: "bold" }}>
                      {event.schedule_type === "one_time" && event.event_date}
                      {event.schedule_type === "weekly" && `毎週 ${event.weekdays?.map((d:string) => WEEKDAY_MAP[d]).join("・")}曜日`}
                      {event.schedule_type === "irregular" && "開催日をチェック"}
                      <span style={{ marginLeft: "12px", color: "var(--muted)", fontSize: "1rem", fontWeight: "normal" }}>
                         {formatTime(event.start_time)} 〜 {formatTime(event.end_time)}
                      </span>
                   </div>

                   {event.capacity && (
                      <div style={{ fontWeight: "bold", color: isFull ? "#ef4444" : "var(--accent)" }}>
                        採用状況: {acceptedCount} / {event.capacity}名
                        {isFull && <span style={{ marginLeft: "8px", fontSize: "0.9rem", background: "#ef4444", color: "#fff", padding: "2px 8px", borderRadius: "4px" }}>満員</span>}
                      </div>
                   )}
                 </div>
              </div>

              {/* タイトルといいねボタンを横並びにする */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", gap: "16px", marginBottom: "24px" }}>
                <h1 style={{ fontSize: "2rem", fontWeight: "bold", lineHeight: 1.4, margin: 0, flex: 1 }}>
                  {event.title}
                </h1>
                
                {/* ▼▼▼ 追加：いいねボタン ▼▼▼ */}
<div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
  <LikeButton 
     eventId={event.id} 
     userId={currentUser?.id} 
     initialIsLiked={isLiked} 
     initialCount={likeCount} 
  />
  {/* ▼ 追加 */}
  <BookmarkButton 
     targetId={event.id} 
     targetType="event" 
     userId={currentUser?.id} 
  />
</div>
                {/* ▲▲▲ 追加ここまで ▲▲▲ */}
              </div>

              {/* 以下、イベント詳細・募集要項など（変更なし） */}
              <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.8, fontSize: "1rem", color: "var(--text)", marginBottom: "40px" }}>
                {event.description}
              </div>

              {( (entryStatus === "Accepted") || isMyEvent ) && event.private_info && (
                <div style={{ background: "#fdfaff", border: "2px dashed var(--accent)", borderRadius: "12px", padding: "20px", marginBottom: "32px", textAlign: "left" }}>
                  <h3 style={{ color: "var(--accent)", fontSize: "1.1rem", marginBottom: "12px", display: "flex", alignItems: "center", gap: "8px" }}>🔒 参加者限定情報</h3>
                  <div style={{ whiteSpace: "pre-wrap", color: "var(--text)", fontSize: "0.95rem" }}>{event.private_info}</div>
                  <p style={{ fontSize: "0.8rem", color: "var(--muted)", marginTop: "12px" }}>※この情報は「出演決定」したメンバーと主催者にのみ表示されています。</p>
                </div>
              )}

              {event.requirements ? (
                <div style={{ background: "var(--bg)", padding: "24px", borderRadius: "12px", marginBottom: "32px", border: "1px solid var(--border)" }}>
                  <h3 style={{ textAlign: "center", fontSize: "1.2rem", fontWeight: "bold", marginBottom: "16px", color: "var(--accent)" }}>📢 キャスト募集要項</h3>
                  <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.6, fontSize: "0.95rem", color: "var(--text)", marginBottom: "24px", background: "#fff", padding: "16px", borderRadius: "8px" }}>
                    {event.requirements}
                  </div>
                  <div style={{ textAlign: "center" }}>
                    {!currentUser ? (
                      <div><p style={{ marginBottom: "12px" }}>応募するにはログインが必要です</p><Link href="/login"><button className="btn btn-primary">ログインして応募する</button></Link></div>
                    ) : isMyEvent ? (
                      <div style={{ color: "var(--muted)", fontWeight: "bold" }}>これはあなたが主催するイベントです（応募不可）</div>
                    ) : hasApplied ? (
                      <div><button className="btn btn-secondary" disabled style={{ cursor: "not-allowed", opacity: 0.7 }}>{entryStatus === "Pending" ? "📨 応募済み（返信待ち）" : entryStatus === "Accepted" ? "🎉 出演決定！" : "見送りとなりました"}</button><p style={{ fontSize: "0.8rem", color: "var(--muted)", marginTop: "8px" }}>ダッシュボードで状況を確認できます</p></div>
                    ) : isFull ? (
                      <div><button className="btn btn-secondary" disabled style={{ cursor: "not-allowed", opacity: 0.8, background: "#888", border: "1px solid #888", color: "#fff" }}>🈵 満員御礼（募集終了）</button><p style={{ fontSize: "0.8rem", color: "var(--muted)", marginTop: "8px" }}>定員に達したため、応募を締め切りました</p></div>
                    ) : (
                      <div><button onClick={handleApply} disabled={applying} className="btn btn-primary" style={{ padding: "12px 32px", fontSize: "1.1rem" }}>{applying ? "送信中..." : "🙋 このイベントに応募する"}</button><p style={{ fontSize: "0.8rem", color: "var(--muted)", marginTop: "8px" }}>ボタンを押すと主催者へのメッセージを入力できます</p></div>
                    )}
                  </div>
                </div>
              ) : (
                <div style={{ textAlign: "center", padding: "20px", color: "var(--muted)", background: "var(--bg)", borderRadius: "8px" }}><p>※現在、このイベントはキャスト募集を行っていません。</p></div>
              )}

              {event.schedule_type === "irregular" && event.irregular_dates && (
                <div style={{ background: "var(--bg)", padding: "20px", borderRadius: "8px", marginBottom: "40px" }}><h3 style={{ fontSize: "1rem", fontWeight: "bold", marginBottom: "10px" }}>📅 開催予定日リスト</h3><div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>{event.irregular_dates.map((date: string) => (<span key={date} style={{ background: "#fff", padding: "6px 12px", borderRadius: "4px", border: "1px solid var(--border)" }}>{date}</span>))}</div></div>
              )}

              <hr style={{ border: "none", borderTop: "1px solid var(--border)", margin: "40px 0" }} />

              <div style={{ marginBottom: "20px" }}>
                <p style={{ fontSize: "0.9rem", color: "var(--muted)", marginBottom: "12px", fontWeight: "bold" }}>主催者</p>
                {organizer ? (
                  <Link href={`/casts/${organizer.user_id}`} style={{ textDecoration: "none", color: "inherit" }}>
                    <div className="hover-card" style={{ display: "flex", alignItems: "center", gap: "16px", padding: "16px", border: "1px solid var(--border)", borderRadius: "12px", transition: "all 0.2s" }}>
                      <div style={{ width: "60px", height: "60px", borderRadius: "50%", overflow: "hidden", background: "#eee", flexShrink: 0 }}>
                        {organizer.avatar_url ? (<img src={organizer.avatar_url} alt={organizer.display_name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />) : (<div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: "1.5rem", color: "#ccc" }}>?</div>)}
                      </div>
                      <div>
                        <div style={{ fontWeight: "bold", fontSize: "1.1rem" }}>{organizer.display_name}</div>
                        <div style={{ fontSize: "0.85rem", color: "var(--muted)", marginTop: "4px" }}>{organizer.role}</div>
                      </div>
                      <div style={{ marginLeft: "auto", color: "var(--accent)", fontSize: "0.9rem", fontWeight: "bold" }}>プロフィールを見る &rarr;</div>
                    </div>
                  </Link>
                ) : (
                  <div style={{ padding: "16px", background: "var(--bg)", borderRadius: "8px", color: "var(--muted)" }}>主催者情報なし</div>
                )}
              </div>
            </div>
          </article>
        </div>
      </main>
      <style jsx>{`
        .hover-card:hover { background-color: var(--bg); border-color: var(--accent) !important; }
      `}</style>
    </>
  );
}