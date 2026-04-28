"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useParams } from "next/navigation";
import Link from "next/link";
import CastLikeButton from "@/components/CastLikeButton";
import BookmarkButton from "@/components/BookmarkButton";
import OfferModal from "@/components/OfferModal";
import { ROLE_OPTIONS } from "@/lib/constants";
import toast from "react-hot-toast";

export default function CastDetailPage() {
  const params = useParams();
  const [profile, setProfile] = useState<any>(null);
  
  const [portfolioImages, setPortfolioImages] = useState<any[]>([]);
  // ★追加: プレビュー表示中の画像URLを入れる箱 (nullなら非表示)
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [likeCount, setLikeCount] = useState(0);
  const [isLiked, setIsLiked] = useState(false);

  const [myHostedEvents, setMyHostedEvents] = useState<any[]>([]);
  const [isOfferModalOpen, setIsOfferModalOpen] = useState(false);

  const [reviews, setReviews] = useState<any[]>([]);
  const [reviewerProfiles, setReviewerProfiles] = useState<Record<string, any>>({});

  const [shareUrl, setShareUrl] = useState("");

  const getRoleLabel = (value: string | null) => {
    if (!value) return null;
    const found = ROLE_OPTIONS.find((opt) => opt.value === value);
    return found ? found.label : value;
  };

  useEffect(() => {
    setShareUrl(window.location.href);

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

      // ポートフォリオ画像取得
      const { data: imagesData } = await supabase
        .from("portfolio_images")
        .select("*")
        .eq("user_id", params.id)
        .order("created_at", { ascending: true });

      if (imagesData) {
        setPortfolioImages(imagesData);
      }

      // 2. 主催イベント取得
      const { data: eventsData } = await supabase
        .from("events")
        .select("*")
        .eq("organizer_id", params.id)
        .order("created_at", { ascending: false });
      
      if (eventsData) setEvents(eventsData);

      // 3. レビュー取得
      const { data: reviewsData } = await supabase
        .from("reviews")
        .select("*")
        .eq("reviewee_id", params.id);
      if (reviewsData && reviewsData.length > 0) {
        setReviews(reviewsData);
        const reviewerIds = [...new Set(reviewsData.map((r: any) => r.reviewer_id))] as string[];
        const { data: rProfiles } = await supabase
          .from("profiles")
          .select("user_id, display_name, avatar_url")
          .in("user_id", reviewerIds);
        if (rProfiles) {
          const map: Record<string, any> = {};
          rProfiles.forEach((p: any) => { map[p.user_id] = p; });
          setReviewerProfiles(map);
        }
      }

      // 4. いいね情報
      const { count: totalLikes } = await supabase
        .from("profile_likes")
        .select("id", { count: "exact", head: true })
        .eq("target_cast_id", params.id);
      setLikeCount(totalLikes || 0);

      if (user) {
        const { data: myLike } = await supabase
          .from("profile_likes")
          .select("id")
          .eq("target_cast_id", params.id)
          .eq("user_id", user.id)
          .single();
        if (myLike) setIsLiked(true);

        const { data: myEventsData } = await supabase
          .from("events")
          .select("id, title")
          .eq("organizer_id", user.id);
          
        if (myEventsData) setMyHostedEvents(myEventsData);
      }

      setLoading(false);
    };

    fetchData();
  }, [params]);

  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareUrl);
    toast.success("プロフィールのURLをコピーしました！");
  };

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
            
            {/* 名前とシェアボタン */}
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
              <h1 style={{ fontSize: "2rem", fontWeight: "bold", margin: 0 }}>
                {profile.display_name}
              </h1>
              <button onClick={handleCopyLink} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "1.2rem", opacity: 0.6 }} title="URLをコピー">
                🔗
              </button>
            </div>

            {/* プレイスタイル表示 */}
            {profile.play_style && (
              <div style={{ marginBottom: "16px", color: "var(--muted)", fontSize: "0.9rem" }}>
                🎮 {profile.play_style}
              </div>
            )}

            {/* ロール表示エリア */}
            <div style={{ display: "flex", justifyContent: "center", gap: "8px", flexWrap: "wrap", marginBottom: "24px" }}>
              <span className="role-badge main">
                {getRoleLabel(profile.role)}
              </span>
              {profile.sub_role_1 && (
                <span className="role-badge sub">
                  {getRoleLabel(profile.sub_role_1)}
                </span>
              )}
              {profile.sub_role_2 && (
                <span className="role-badge sub">
                  {getRoleLabel(profile.sub_role_2)}
                </span>
              )}
            </div>

{/* ▼▼▼ 追加: SNSリンク表示エリア ▼▼▼ */}
              {(profile.twitter_id || profile.vrchat_id) && (
                <div style={{ display: "flex", gap: "24px", marginTop: "32px",marginBottom: "12px",justifyContent: "center",flexWrap: "wrap" }}>
                  
                  {/* X (Twitter) ボタン */}
                  {profile.twitter_id && (
                    <a 
                      href={`https://x.com/${profile.twitter_id}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="btn"
                      style={{ 
                        background: "#000", 
                        color: "#fff", 
                        padding: "8px 16px", 
                        fontSize: "0.9rem",
                        display: "flex", 
                        alignItems: "center", 
                        gap: "8px",
                        textDecoration: "none"
                      }}
                    >
                      {/* XのロゴSVG */}
                      <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                      </svg>
                      @{profile.twitter_id}
                    </a>
                  )}

                  {/* VRChat ボタン */}
                  {profile.vrchat_id && (
                    <a 
                      href={`https://vrchat.com/home/user/${profile.vrchat_id}`} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="btn"
                      style={{ 
                        background: "#06b6d4", // VRChatっぽい色
                        color: "#fff", 
                        padding: "8px 16px", 
                        fontSize: "0.9rem",
                        display: "flex", 
                        alignItems: "center", 
                        gap: "8px",
                        textDecoration: "none"
                      }}
                    >
                      {/* VRChatっぽいアイコン（Userアイコン） */}
                      <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                        <circle cx="12" cy="7" r="4"></circle>
                      </svg>
                      VRChat Profile
                    </a>
                  )}
                </div>
              )}

            {/* アクションボタン */}
            <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "16px", marginBottom: "32px", flexWrap: "wrap" }}>
              {currentUser && currentUser.id !== profile.user_id && (
                <button 
                  className="btn btn-primary" 
                  style={{ padding: "10px 24px", fontSize: "1rem" }}
                  onClick={() => setIsOfferModalOpen(true)}
                >
                  📩 オファーを送る
                </button>
              )}
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

            {/* 自己紹介文 */}
            <div style={{ maxWidth: "600px", margin: "0 auto", textAlign: "left", whiteSpace: "pre-wrap", lineHeight: 1.8, background: "var(--bg)", padding: "24px", borderRadius: "12px" }}>
              {profile.bio || "自己紹介文はまだありません。"}
            </div>

            {/* ▼▼▼ ポートフォリオ画像エリア（クリックで拡大） ▼▼▼ */}
            {portfolioImages && portfolioImages.length > 0 && (
              <div style={{ marginTop: "40px", maxWidth: "600px", margin: "40px auto 0" }}>
                <h3 style={{ textAlign: "left", fontSize: "1.2rem", marginBottom: "16px", borderBottom: "2px solid #f0f0f0", paddingBottom: "8px" }}>📸 ポートフォリオ</h3>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(150px, 1fr))", gap: "12px" }}>
                  {portfolioImages.map((img: any) => (
                    <div 
                      key={img.id} 
                      onClick={() => setPreviewImage(img.image_url)} // クリックでURLをセット
                      style={{ 
                        aspectRatio: "1/1", 
                        borderRadius: "8px", 
                        overflow: "hidden", 
                        border: "1px solid #eee", 
                        background: "#f9f9f9",
                        cursor: "zoom-in" // カーソルを虫眼鏡に
                      }}
                    >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img 
                          src={img.image_url} 
                          alt="Portfolio" 
                          style={{ width: "100%", height: "100%", objectFit: "cover", transition: "transform 0.2s" }} 
                          className="portfolio-img" 
                        />
                    </div>
                  ))}
                </div>
              </div>
            )}
            {/* ▲▲▲ ポートフォリオ追加ここまで ▲▲▲ */}

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

          {/* レビューセクション */}
          {reviews.length > 0 && (
            <div style={{ marginTop: "40px" }}>
              <h2 className="section-title" style={{ textAlign: "left", fontSize: "1.5rem" }}>⭐ 受け取ったレビュー</h2>

              <div style={{ marginBottom: "20px", padding: "16px 24px", background: "#fff", borderRadius: "12px", border: "1px solid var(--border)", display: "flex", alignItems: "center", gap: "16px" }}>
                <div style={{ fontSize: "3rem", fontWeight: "bold", color: "#f59e0b", lineHeight: 1 }}>
                  {(reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)}
                </div>
                <div>
                  <div style={{ display: "flex", gap: "2px", marginBottom: "4px" }}>
                    {[1, 2, 3, 4, 5].map(n => {
                      const avg = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;
                      return <span key={n} style={{ fontSize: "1.4rem", color: n <= Math.round(avg) ? "#f59e0b" : "#ddd" }}>★</span>;
                    })}
                  </div>
                  <div style={{ color: "var(--muted)", fontSize: "0.9rem" }}>{reviews.length}件のレビュー</div>
                </div>
              </div>

              {profile.show_review_comments && (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {reviews.filter(r => r.comment).map(review => {
                    const reviewer = reviewerProfiles[review.reviewer_id];
                    return (
                      <div key={review.id} style={{ background: "#fff", border: "1px solid var(--border)", borderRadius: "10px", padding: "16px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                          <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#eee", overflow: "hidden", flexShrink: 0 }}>
                            {reviewer?.avatar_url && (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={reviewer.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            )}
                          </div>
                          <div style={{ fontWeight: "bold", fontSize: "0.9rem" }}>{reviewer?.display_name ?? "..."}</div>
                          <div style={{ marginLeft: "auto", display: "flex", gap: "1px" }}>
                            {[1, 2, 3, 4, 5].map(n => (
                              <span key={n} style={{ fontSize: "1rem", color: n <= review.rating ? "#f59e0b" : "#ddd" }}>★</span>
                            ))}
                          </div>
                        </div>
                        <p style={{ fontSize: "0.9rem", color: "var(--text)", whiteSpace: "pre-wrap", margin: 0 }}>{review.comment}</p>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
      
      {/* ▼追加: 画像拡大表示用モーダル (previewImageがある時だけ表示) */}
      {previewImage && (
        <div 
          onClick={() => setPreviewImage(null)} // 背景クリックで閉じる
          style={{
            position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
            backgroundColor: "rgba(0, 0, 0, 0.9)", // 背景を黒く
            display: "flex", alignItems: "center", justifyContent: "center",
            zIndex: 9999, cursor: "zoom-out",
            padding: "20px"
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img 
            src={previewImage} 
            alt="Preview" 
            style={{ 
              maxWidth: "100%", 
              maxHeight: "90vh", 
              objectFit: "contain",
              borderRadius: "4px",
              boxShadow: "0 0 20px rgba(0,0,0,0.5)"
            }} 
          />
          {/* 閉じるボタン */}
          <button 
            style={{
              position: "absolute", top: "20px", right: "20px",
              background: "rgba(255,255,255,0.2)", border: "none", color: "#fff",
              fontSize: "2rem", cursor: "pointer", width: "50px", height: "50px",
              borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center"
            }}
          >
            ×
          </button>
        </div>
      )}

      {currentUser && (
        <OfferModal 
          isOpen={isOfferModalOpen}
          onClose={() => setIsOfferModalOpen(false)}
          castId={profile.user_id}
          castName={profile.display_name}
          myEvents={myHostedEvents}
          currentUserId={currentUser.id}
        />
      )}

      <style jsx>{`
        .hover-up { transition: transform 0.2s; }
        .hover-up:hover { transform: translateY(-4px); }
        
        .role-badge {
          display: inline-block;
          padding: 6px 16px;
          border-radius: 99px;
          font-weight: bold;
          font-size: 0.9rem;
        }
        .role-badge.main {
          background: rgba(124, 58, 237, 0.1);
          color: var(--accent);
          border: 1px solid rgba(124, 58, 237, 0.2);
          font-size: 1rem;
        }
        .role-badge.sub {
          background: #f5f5f5;
          color: #666;
          border: 1px solid #ddd;
        }
        .portfolio-img:hover {
            transform: scale(1.05);
            filter: brightness(0.9);
        }
      `}</style>
    </>
  );
}
