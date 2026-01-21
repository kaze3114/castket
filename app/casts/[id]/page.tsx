"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useParams } from "next/navigation";
import Link from "next/link";
// ▼ 2つのボタンをインポート
import CastLikeButton from "@/components/CastLikeButton";
import BookmarkButton from "@/components/BookmarkButton";

export default function CastDetailPage() {
  const params = useParams();
  const [profile, setProfile] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // いいね機能用ステート
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [likeCount, setLikeCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!params?.id) return;

      const { data: { user } } = await supabase.auth.getUser();
      setCurrentUser(user);

      // 1. プロフィール取得
      const { data: profileData, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", params.id)
        .single();

      if (error || !profileData) {
        setLoading(false);
        return;
      }
      setProfile(profileData);

      // 2. このキャストが主催したイベントを取得
      const { data: eventsData } = await supabase
        .from("events")
        .select("*")
        .eq("organizer_id", params.id)
        .order("created_at", { ascending: false });
      
      if (eventsData) setEvents(eventsData);

      // 3. いいね情報の取得
      // (A) 全体のいいね数
      const { count: totalLikes } = await supabase
        .from("profile_likes")
        .select("id", { count: "exact", head: true })
        .eq("target_cast_id", params.id);
      setLikeCount(totalLikes || 0);

      // (B) 自分がいいねしているか
      if (user) {
        const { data: myLike } = await supabase
          .from("profile_likes")
          .select("id")
          .eq("target_cast_id", params.id)
          .eq("user_id", user.id)
          .single();
        if (myLike) setIsLiked(true);
      }

      setLoading(false);
    };

    fetchData();
  }, [params]);

  if (loading) return <div style={{ padding: "40px", textAlign: "center" }}>読み込み中...</div>;

  if (!profile) {
    return (
      <div style={{ padding: "40px", textAlign: "center" }}>
        <h2>ユーザーが見つかりません</h2>
      </div>
    );
  }

  return (
    <>
      <header className="site-header">
        <div className="container header-inner">
          <Link href="/casts" className="logo-wrap" style={{ textDecoration: 'none' }}>
            <div className="logo-mark">C</div>
            <div className="logo-text-block">
              <div className="logo-text-main">Castket</div>
              <div className="logo-text-sub">Cast Profile</div>
            </div>
          </Link>
          <div className="header-actions">
            <Link href="/casts" className="btn btn-ghost">一覧に戻る</Link>
          </div>
        </div>
      </header>

      <main className="section section-soft" style={{ minHeight: "100vh" }}>
        <div className="container" style={{ maxWidth: "800px" }}>
          
          <div className="card" style={{ textAlign: "center", padding: "40px 20px" }}>
            {/* アイコン */}
            <div style={{ width: "120px", height: "120px", borderRadius: "50%", overflow: "hidden", margin: "0 auto 24px auto", background: "#eee", border: "4px solid #fff", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}>
              {profile.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.avatar_url} alt={profile.display_name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem", color: "#ccc" }}>?</div>
              )}
            </div>
            
            <h1 style={{ fontSize: "2rem", fontWeight: "bold", marginBottom: "8px" }}>
              {profile.display_name}
            </h1>
            <p style={{ color: "var(--accent)", fontWeight: "bold", marginBottom: "24px" }}>
              {profile.role}
            </p>

            {/* ▼▼▼ アクションボタンエリア（いいね ＆ 保存） ▼▼▼ */}
            <div style={{ display: "flex", justifyContent: "center", gap: "16px", marginBottom: "32px", flexWrap: "wrap" }}>
              <CastLikeButton 
                castId={profile.user_id}
                userId={currentUser?.id}
                initialIsLiked={isLiked}
                initialCount={likeCount}
              />
              <BookmarkButton 
                targetId={profile.user_id}
                targetType="cast"
                userId={currentUser?.id}
              />
            </div>
            {/* ▲▲▲ エリア終了 ▲▲▲ */}

            <div style={{ maxWidth: "600px", margin: "0 auto", textAlign: "left", whiteSpace: "pre-wrap", lineHeight: 1.8, background: "var(--bg)", padding: "24px", borderRadius: "12px" }}>
              {profile.bio || "自己紹介文はまだありません。"}
            </div>
          </div>

          {/* 主催イベント一覧 */}
          {events.length > 0 && (
            <div style={{ marginTop: "40px" }}>
              <h2 className="section-title" style={{ textAlign: "left", fontSize: "1.5rem" }}>主催イベント</h2>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px" }}>
                {events.map((event) => (
                  <Link href={`/events/${event.id}`} key={event.id} style={{ textDecoration: "none", color: "inherit" }}>
                    <div className="card hover-up" style={{ padding: "16px" }}>
                       <div style={{ fontWeight: "bold", marginBottom: "8px" }}>{event.title}</div>
                       <div style={{ fontSize: "0.85rem", color: "var(--muted)" }}>
                         {event.schedule_type === "one_time" ? event.event_date : "定期/不定期"}
                       </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          )}

        </div>
      </main>
      <style jsx>{`
        .hover-up { transition: transform 0.2s; }
        .hover-up:hover { transform: translateY(-4px); }
      `}</style>
    </>
  );
}