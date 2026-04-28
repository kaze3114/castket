"use client";

import { useEffect, useState, useCallback } from "react"; // useCallbackを追加
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ROLE_OPTIONS } from "@/lib/constants"; 
import OfferReplyModal from "@/components/OfferReplyModal";
import BookmarkModal from "@/components/BookmarkModal";

export default function Dashboard() {
  const [editBookmarkTarget, setEditBookmarkTarget] = useState<any>(null); // 編集用
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);

  const [myEvents, setMyEvents] = useState<any[]>([]);
  const [myEntries, setMyEntries] = useState<any[]>([]);
  const [bookmarkedEvents, setBookmarkedEvents] = useState<any[]>([]);
  const [bookmarkedCasts, setBookmarkedCasts] = useState<any[]>([]);
  const [receivedCastLikes, setReceivedCastLikes] = useState(0);
  const [receivedEventLikes, setReceivedEventLikes] = useState(0);

  const [receivedOffers, setReceivedOffers] = useState<any[]>([]);
  const [organizerProfiles, setOrganizerProfiles] = useState<any[]>([]);
  const [sentOffers, setSentOffers] = useState<any[]>([]);

  // ▼▼▼ モーダル制御用のステートを追加 ▼▼▼
  const [selectedOffer, setSelectedOffer] = useState<any>(null);
  const [isReplyModalOpen, setIsReplyModalOpen] = useState(false);

  const [activeTab, setActiveTab] = useState<"manage" | "bookmarks">("manage");

  const pendingOffers = receivedOffers.filter(o => o.status === 'pending');
  const historyOffers = receivedOffers.filter(o => o.status !== 'pending');
  const getRoleLabel = (value: string | null) => {
    if (!value) return "未設定";
    const found = ROLE_OPTIONS.find((opt) => opt.value === value);
    return found ? found.label : value;
  };

  const StatusBadge = ({ status }: { status: string }) => {
    switch (status) {
      case "pending": case "Pending":
        return <span style={{ background: "#fbbf24", color: "#fff", padding: "4px 12px", borderRadius: "99px", fontSize: "0.8rem", fontWeight: "bold" }}>返信待ち</span>;
      case "accepted": case "Accepted":
        return <span style={{ background: "#34d399", color: "#fff", padding: "4px 12px", borderRadius: "99px", fontSize: "0.8rem", fontWeight: "bold" }}>承諾済み</span>;
      case "rejected": case "Rejected":
        return <span style={{ background: "#9ca3af", color: "#fff", padding: "4px 12px", borderRadius: "99px", fontSize: "0.8rem", fontWeight: "bold" }}>見送り</span>;
      default:
        return <span style={{ background: "#eee", color: "#666", padding: "4px 12px", borderRadius: "99px", fontSize: "0.8rem" }}>{status}</span>;
    }
  };

  // ▼▼▼ データ取得処理を関数化して、更新時に再利用できるようにする ▼▼▼
  const fetchData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }
    setUser(user);

    const { data: profileData } = await supabase.from("profiles").select("*").eq("user_id", user.id).single();
    setProfile(profileData);

    const { data: eventsData } = await supabase.from("events").select("*").eq("organizer_id", user.id).order("created_at", { ascending: false });
    if (eventsData) setMyEvents(eventsData);

    const { data: entriesData } = await supabase.from("entries").select("*, event:events(title, id, organizer_id)").eq("cast_id", user.id).order("created_at", { ascending: false });
    if (entriesData) {
      setMyEntries(entriesData);
      const organizerIds = [...new Set(
        entriesData
          .filter((e: any) => e.status === "Accepted" && e.event?.organizer_id)
          .map((e: any) => e.event.organizer_id)
      )];
      if (organizerIds.length > 0) {
        const { data: orgProfiles } = await supabase
          .from("profiles")
          .select("user_id, twitter_id, vrchat_id")
          .in("user_id", organizerIds);
        if (orgProfiles) setOrganizerProfiles(orgProfiles);
      }
    }

    const { data: bmEvents } = await supabase.from("event_bookmarks").select("created_at, event:events(*)").eq("user_id", user.id).order("created_at", { ascending: false });
    if (bmEvents) setBookmarkedEvents(bmEvents.map((item: any) => item.event).filter((e: any) => e !== null));

const { data: bmCasts } = await supabase
      .from("cast_bookmarks")
      .select("id, memo, created_at, cast:profiles!target_cast_id(*)") // memoを追加
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    
    if (bmCasts) setBookmarkedCasts(bmCasts); // mapせずそのままセット
    const { count: castLikeCount } = await supabase.from("profile_likes").select("id", { count: 'exact', head: true }).eq("target_cast_id", user.id);
    setReceivedCastLikes(castLikeCount || 0);

    const myEventIds = eventsData?.map(e => e.id) || [];
    if (myEventIds.length > 0) {
      const { count: eventLikeCount } = await supabase.from("likes").select("id", { count: 'exact', head: true }).in("event_id", myEventIds);
      setReceivedEventLikes(eventLikeCount || 0);
    }

    // オファー情報の取得
    const { data: rOffers } = await supabase
      .from("offers")
      .select("*, event:events(title, id), sender:profiles!sender_id(display_name, avatar_url)")
      .eq("receiver_id", user.id)
      .order("created_at", { ascending: false });
    if (rOffers) setReceivedOffers(rOffers);

    const { data: sOffers } = await supabase
      .from("offers")
      .select("*, event:events(title, id), receiver:profiles!receiver_id(display_name, avatar_url, twitter_id, vrchat_id)")
      .eq("sender_id", user.id)
      .order("created_at", { ascending: false });
    if (sOffers) setSentOffers(sOffers);

    setLoading(false);
  }, [router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleLogout = async () => {
    if(!confirm("ログアウトしますか？")) return;
    await supabase.auth.signOut();
    router.push("/login");
  };

  // ▼▼▼ オファーをクリックした時の処理 ▼▼▼
  const handleOfferClick = (offer: any) => {
    setSelectedOffer(offer);
    setIsReplyModalOpen(true);
  };

  if (loading) return <div style={{ padding: "40px", textAlign: "center" }}>読み込み中...</div>;

  return (
    <>
      <main className="section section-soft" style={{ minHeight: "100vh" }}>
        <div className="container">
          
          {/* プロフィールカード */}
          <div className="card" style={{ display: "flex", alignItems: "center", gap: "24px", marginBottom: "32px", padding: "32px" }}>
            <div style={{ width: "80px", height: "80px", borderRadius: "50%", border: "4px solid #f0f0f0", overflow: "hidden", background: "#eee", flexShrink: 0 }}>
              {profile?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={profile.avatar_url} alt="My Icon" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "2rem", color: "#ccc" }}>👤</div>
              )}
            </div>
            
            <div style={{ flex: 1 }}>
              <h1 style={{ margin: "0 0 8px 0", fontSize: "1.8rem" }}>{profile?.display_name || "ゲスト"}</h1>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <div style={{ display: "flex", gap: "12px", alignItems: "center", flexWrap: "wrap" }}>
                  <span className="badge main-badge">{getRoleLabel(profile?.role)}</span>
                  <Link href="/dashboard/profile" style={{ fontSize: "0.85rem", color: "var(--accent)", textDecoration: "none", fontWeight: "bold" }}>
                    ⚙️ プロフィール編集
                  </Link>
                </div>

                {(profile?.sub_role_1 || profile?.sub_role_2) && (
                  <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                    {profile.sub_role_1 && <span className="badge sub-badge">{getRoleLabel(profile.sub_role_1)}</span>}
                    {profile.sub_role_2 && <span className="badge sub-badge">{getRoleLabel(profile.sub_role_2)}</span>}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* スタッツ */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "40px" }}>
             <div className="stat-card">
               <div className="stat-icon">💎</div>
               <div>
                 <div style={{ fontSize: "0.8rem", opacity: 0.9 }}>Total Likes</div>
                 <div style={{ fontSize: "1.5rem", fontWeight: "bold", lineHeight: 1.2 }}>{receivedCastLikes + receivedEventLikes}</div>
               </div>
             </div>
             <div className="stat-card">
               <div className="stat-icon">❤️</div>
               <div>
                 <div style={{ fontSize: "0.8rem", color: "var(--muted)" }}>Cast Likes</div>
                 <div style={{ fontSize: "1.5rem", fontWeight: "bold", lineHeight: 1.2 }}>{receivedCastLikes}</div>
               </div>
             </div>
             <div className="stat-card">
               <div className="stat-icon">💛</div>
               <div>
                 <div style={{ fontSize: "0.8rem", color: "var(--muted)" }}>Event Likes</div>
                 <div style={{ fontSize: "1.5rem", fontWeight: "bold", lineHeight: 1.2 }}>{receivedEventLikes}</div>
               </div>
             </div>
          </div>

          {/* クイックアクション */}
          <div style={{ marginBottom: "40px" }}>
              <h2 className="section-title" style={{ margin: "0 0 16px 0", textAlign: "left", fontSize: "1.2rem" }}>🚀 クイックアクション</h2>
              <div className="menu-grid">
                <Link href="/dashboard/events" className="menu-card primary">
                  <div className="menu-icon">📝</div>
                  <div>
                    <div className="menu-title">イベントを管理・作成</div>
                    <div className="menu-desc">主催イベントの編集や確認</div>
                  </div>
                </Link>
                <Link href="/events" className="menu-card">
                  <div className="menu-icon">📅</div>
                  <div>
                    <div className="menu-title">イベントを探す</div>
                    <div className="menu-desc">参加したいイベントを見つける</div>
                  </div>
                </Link>
                <Link href="/casts" className="menu-card">
                  <div className="menu-icon">🎤</div>
                  <div>
                    <div className="menu-title">キャストを探す</div>
                    <div className="menu-desc">出演者やスタッフを探す</div>
                  </div>
                </Link>
                <Link href="/" className="menu-card">
                  <div className="menu-icon">🏠</div>
                  <div>
                    <div className="menu-title">トップページへ</div>
                    <div className="menu-desc">Castketのホームに戻る</div>
                  </div>
                </Link>
              </div>
          </div>

          <div style={{ display: "flex", gap: "0", borderBottom: "2px solid #ddd", marginBottom: "32px" }}>
            <button onClick={() => setActiveTab("manage")} style={{ padding: "12px 24px", background: "none", border: "none", borderBottom: activeTab === "manage" ? "3px solid var(--accent)" : "3px solid transparent", color: activeTab === "manage" ? "var(--accent)" : "var(--muted)", fontWeight: "bold", cursor: "pointer", fontSize: "1rem" }}>📝 自分の活動</button>
            <button onClick={() => setActiveTab("bookmarks")} style={{ padding: "12px 24px", background: "none", border: "none", borderBottom: activeTab === "bookmarks" ? "3px solid #333" : "3px solid transparent", color: activeTab === "bookmarks" ? "#333" : "var(--muted)", fontWeight: "bold", cursor: "pointer", fontSize: "1rem" }}>🔖 ブックマーク</button>
          </div>

          {activeTab === "manage" && (
            <div style={{ display: "grid", gap: "40px" }}>


              {/* 送ったオファー */}
              {sentOffers.length > 0 && (
                <section>
                  <h3 className="section-lead" style={{ textAlign: "left", marginBottom: "16px" }}>📤 送ったオファー</h3>
                  <div style={{ display: "grid", gap: "16px" }}>
                    {sentOffers.map((offer) => (
                      <div key={offer.id} className="card" style={{ opacity: offer.status === 'rejected' ? 0.7 : 1 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                            <div style={{width: "40px", height: "40px", borderRadius: "50%", background: "#eee", overflow: "hidden"}}>
                              {offer.receiver?.avatar_url && <img src={offer.receiver.avatar_url} style={{width:"100%", height:"100%", objectFit:"cover"}} />}
                            </div>
                            <div>
                              <div style={{ fontWeight: "bold" }}>To: {offer.receiver?.display_name} さん</div>
                              <div style={{ fontSize: "0.85rem", color: "var(--muted)" }}>イベント: {offer.event?.title}</div>
                            </div>
                          </div>
                          <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "4px" }}>
                            <StatusBadge status={offer.status} />
                            <span style={{ fontSize: "0.75rem", color: "var(--muted)" }}>{new Date(offer.created_at).toLocaleDateString()}</span>
                          </div>
                        </div>
                        {offer.status === "accepted" && (offer.cast_shared_contacts?.length > 0) && (
                          <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid #eee", display: "flex", gap: "8px", flexWrap: "wrap" }}>
                            <span style={{ fontSize: "0.8rem", color: "var(--muted)", marginRight: "4px" }}>📬 共有された連絡先:</span>
                            {offer.cast_shared_contacts.includes("twitter") && offer.receiver?.twitter_id && (
                              <a href={`https://x.com/${offer.receiver.twitter_id}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.85rem", fontWeight: "bold", color: "#000", background: "#f0f0f0", padding: "4px 10px", borderRadius: "99px", textDecoration: "none" }}>
                                𝕏 @{offer.receiver.twitter_id}
                              </a>
                            )}
                            {offer.cast_shared_contacts.includes("vrchat") && offer.receiver?.vrchat_id && (
                              <a href={`https://vrchat.com/home/user/${offer.receiver.vrchat_id}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.85rem", fontWeight: "bold", color: "var(--accent)", background: "rgba(124,58,237,0.08)", padding: "4px 10px", borderRadius: "99px", textDecoration: "none" }}>
                                VRChat プロフィール
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </section>
              )}

              <section>
                <h3 className="section-lead" style={{ textAlign: "left", marginBottom: "16px" }}>🙋‍♂️ 応募したイベント</h3>
                {myEntries.length === 0 ? <div className="card" style={{ color: "var(--muted)" }}>まだ応募履歴はありません。</div> : (
                  <div style={{ display: "grid", gap: "16px" }}>
                    {myEntries.map((entry) => (
                      entry.event?.id ? (
                        <div key={entry.id} className="card">
                          <Link href={`/events/${entry.event.id}`} style={{ textDecoration: "none", color: "inherit" }}>
                            <div className="hover-card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "4px 0" }}>
                              <div>
                                <div style={{ fontWeight: "bold", fontSize: "1.1rem" }}>{entry.event.title}</div>
                                <div style={{ fontSize: "0.85rem", color: "var(--muted)" }}>応募日: {new Date(entry.created_at).toLocaleDateString()}</div>
                              </div>
                              <div><StatusBadge status={entry.status} /></div>
                            </div>
                          </Link>
                          {entry.status === "Accepted" && (entry.organizer_shared_contacts?.length > 0) && (() => {
                            const org = organizerProfiles.find((p: any) => p.user_id === entry.event?.organizer_id);
                            if (!org) return null;
                            return (
                              <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid #eee", display: "flex", gap: "8px", flexWrap: "wrap" }}>
                                <span style={{ fontSize: "0.8rem", color: "var(--muted)", marginRight: "4px" }}>📬 主催者の連絡先:</span>
                                {entry.organizer_shared_contacts.includes("twitter") && org.twitter_id && (
                                  <a href={`https://x.com/${org.twitter_id}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.85rem", fontWeight: "bold", color: "#000", background: "#f0f0f0", padding: "4px 10px", borderRadius: "99px", textDecoration: "none" }}>
                                    𝕏 @{org.twitter_id}
                                  </a>
                                )}
                                {entry.organizer_shared_contacts.includes("vrchat") && org.vrchat_id && (
                                  <a href={`https://vrchat.com/home/user/${org.vrchat_id}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.85rem", fontWeight: "bold", color: "var(--accent)", background: "rgba(124,58,237,0.08)", padding: "4px 10px", borderRadius: "99px", textDecoration: "none" }}>
                                    VRChat プロフィール
                                  </a>
                                )}
                              </div>
                            );
                          })()}
                        </div>
                      ) : (
                         <div key={entry.id} className="card" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", opacity: 0.6 }}>
                           {/* ... */}
                         </div>
                      )
                    ))}
                  </div>
                )}
              </section>

              {/* ... (主催イベント部分はそのまま) ... */}
              <section>
                <h3 className="section-lead" style={{ textAlign: "left", marginBottom: "16px" }}>🚩 主催したイベント</h3>
                {myEvents.length === 0 ? <div className="card" style={{ color: "var(--muted)" }}>まだイベントを作成していません。</div> : (
                  <div style={{ display: "grid", gap: "16px" }}>
                    {myEvents.map((event) => (
                      <Link href={`/dashboard/events/${event.id}`} key={event.id} style={{ textDecoration: "none", color: "inherit" }}>
                        <div className="card hover-card" style={{ padding: "16px", display: "flex", alignItems: "center", gap: "16px" }}>
                          {event.banner_url && <img src={event.banner_url} alt="" style={{ width: "60px", height: "60px", objectFit: "cover", borderRadius: "8px" }} />}
                          <div style={{ flex: 1 }}><div style={{ fontWeight: "bold" }}>{event.title}</div><div style={{ fontSize: "0.85rem", color: "var(--muted)" }}>{event.schedule_type === "one_time" ? event.event_date : "定期/不定期"}</div></div>
                          <div style={{ fontSize: "0.9rem", color: "var(--accent)", fontWeight: "bold" }}>応募管理へ &rarr;</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </section>
            </div>
          )}

{activeTab === "bookmarks" && (
            <div style={{ display: "grid", gap: "40px" }}>
               {/* 1. 保存したイベント */}
               <section>
                  <h3 className="section-lead" style={{ textAlign: "left", marginBottom: "16px" }}>🔖 保存したイベント</h3>
                  {bookmarkedEvents.length === 0 ? (
                     <div className="card" style={{ color: "var(--muted)" }}>まだブックマークしたイベントはありません。</div> 
                  ) : (
                     <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px" }}>
                        {bookmarkedEvents.map((event) => (
                        <Link href={`/events/${event.id}`} key={event.id} style={{ textDecoration: "none", color: "inherit" }}>
                           <article className="card hover-up" style={{ padding: "0", overflow: "hidden" }}>
                                 <div style={{ width: "100%", aspectRatio: "16/9", background: "#eee" }}>
                                   {event.banner_url ? <img src={event.banner_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : null}
                                 </div>
                                 <div style={{ padding: "12px" }}>
                                   <div style={{ fontWeight: "bold", marginBottom: "4px" }}>{event.title}</div>
                                 </div>
                           </article>
                        </Link>
                        ))}
                     </div>
                  )}
               </section>

               {/* 2. 保存したキャスト (メモ機能付き) */}
               <section>
                  <h3 className="section-lead" style={{ textAlign: "left", marginBottom: "16px" }}>🔖 保存したキャスト</h3>
                  {bookmarkedCasts.length === 0 ? (
                     <div className="card" style={{ color: "var(--muted)" }}>まだブックマークしたキャストはいません。</div> 
                  ) : (
                     <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))", gap: "16px" }}>
                        {bookmarkedCasts.map((item) => {
                          // item は cast_bookmarks テーブルの行データ
                          const cast = item.cast; 
                          if(!cast) return null;
                          
                          return (
                            <div key={item.id} className="card hover-up" style={{ padding: "16px", display: "flex", flexDirection: "column", gap: "12px" }}>
                               {/* キャスト情報部分 */}
                               <Link href={`/casts/${cast.user_id}`} style={{ textDecoration: "none", color: "inherit", display: "flex", alignItems: "center", gap: "12px" }}>
                                  <div style={{ width: "50px", height: "50px", borderRadius: "50%", background: "#eee", overflow: "hidden", flexShrink: 0 }}>
                                    {cast.avatar_url && <img src={cast.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                                  </div>
                                  <div>
                                     <div style={{ fontWeight: "bold", fontSize: "1rem" }}>{cast.display_name}</div>
                                     <div style={{ fontSize: "0.8rem", color: "var(--muted)" }}>{getRoleLabel(cast.role)}</div>
                                  </div>
                               </Link>

                               {/* メモ表示エリア */}
                               <div style={{ background: "#f9f9f9", padding: "10px", borderRadius: "8px", fontSize: "0.85rem", color: "#555", position: "relative" }}>
                                 {item.memo ? (
                                   <div style={{ whiteSpace: "pre-wrap" }}>📝 {item.memo}</div>
                                 ) : (
                                   <div style={{ color: "#aaa", fontStyle: "italic" }}>メモなし</div>
                                 )}
                                 
                                 {/* 編集ボタン */}
                                 <button 
                                   onClick={() => setEditBookmarkTarget({ id: cast.user_id, name: cast.display_name })}
                                   style={{ position: "absolute", top: "8px", right: "8px", background: "none", border: "none", cursor: "pointer", color: "var(--accent)", fontSize: "0.8rem", fontWeight: "bold" }}
                                 >
                                   編集
                                 </button>
                               </div>
                            </div>
                          );
                        })}
                     </div>
                  )}
               </section>
            </div>
          )}        </div>
      </main>
      
      {/* ▼▼▼ モーダルを表示 ▼▼▼ */}
      <OfferReplyModal
        isOpen={isReplyModalOpen}
        onClose={() => setIsReplyModalOpen(false)}
        offer={selectedOffer}
        onUpdate={fetchData}
        currentUserId={user?.id ?? ""}
      />

{/* ▼▼▼ ブックマーク編集モーダル ▼▼▼ */}
      {editBookmarkTarget && user && (
        <BookmarkModal
          isOpen={true}
          onClose={() => setEditBookmarkTarget(null)}
          targetId={editBookmarkTarget.id}
          targetName={editBookmarkTarget.name}
          userId={user.id}
          onUpdate={fetchData} // 編集・削除したらリストを更新
        />
      )}

      <style jsx>{`
        .main-badge { background: rgba(124, 58, 237, 0.1); color: var(--accent); padding: 6px 16px; borderRadius: 99px; font-size: 0.9rem; font-weight: bold; border: 1px solid rgba(124, 58, 237, 0.2); }
        .sub-badge { background: #f5f5f5; color: #666; padding: 4px 10px; borderRadius: 99px; font-size: 0.75rem; border: 1px solid #ddd; }
        .hover-card:hover { background-color: #fdfaff; border-color: var(--accent); }
        .hover-up { transition: transform 0.2s; }
        .hover-up:hover { transform: translateY(-4px); }
      `}</style>
    </>
  );
}