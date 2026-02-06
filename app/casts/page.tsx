"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { ROLE_OPTIONS } from "@/lib/constants";

const PLAY_STYLE_OPTIONS = [
  "デスクトップモード",
  "VR (3点トラッキング)",
  "VR (フルトラッキング)",
  "スタンドアロン (Quest/Pico単体)",
  "その他 / 移行中",
];

const ITEMS_PER_PAGE = 24;

export default function CastListPage() {
  const [casts, setCasts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [viewMode, setViewMode] = useState<"grid" | "list" | "compact">("grid");
  const [sortBy, setSortBy] = useState<"newest" | "likes">("newest");

  const [filterRole, setFilterRole] = useState<string | null>(null);
  const [filterPlayStyle, setFilterPlayStyle] = useState<string | null>(null);
  const [searchName, setSearchName] = useState<string>("");

  const [currentPage, setCurrentPage] = useState(1);

  const getRoleLabel = (value: string | null) => {
    if (!value) return null;
    const found = ROLE_OPTIONS.find((opt) => opt.value === value);
    return found ? found.label : value;
  };

  // ★追加: 新着ユーザーかどうか判定する関数 (7日以内)
  const isNewMember = (createdAt: string) => {
    const diff = new Date().getTime() - new Date(createdAt).getTime();
    const days = diff / (1000 * 60 * 60 * 24);
    return days < 7;
  };

  useEffect(() => {
    const fetchCasts = async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*, profile_likes!target_cast_id(count)")
        .order("created_at", { ascending: false });

      if (error) {
        console.error(error);
      } else {
        const formattedCasts = (data || []).map((cast: any) => ({
          ...cast,
          likesCount: cast.profile_likes ? cast.profile_likes[0]?.count || 0 : 0
        }));
        setCasts(formattedCasts);
      }
      setLoading(false);
    };

    fetchCasts();
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [filterRole, filterPlayStyle, searchName, sortBy]);

  const filteredCasts = casts.filter((cast) => {
    if (filterRole) {
      const hitMain = cast.role === filterRole;
      const hitSub1 = cast.sub_role_1 === filterRole;
      const hitSub2 = cast.sub_role_2 === filterRole;
      if (!hitMain && !hitSub1 && !hitSub2) return false;
    }
    if (filterPlayStyle && cast.play_style !== filterPlayStyle) return false;
    if (searchName && (!cast.display_name || !cast.display_name.toLowerCase().includes(searchName.toLowerCase()))) return false;
    return true;
  });

  const sortedCasts = [...filteredCasts].sort((a, b) => {
    if (filterRole) {
      const getPriority = (cast: any) => {
        if (cast.role === filterRole) return 2;
        return 1;
      };
      const priorityA = getPriority(a);
      const priorityB = getPriority(b);
      if (priorityA !== priorityB) {
        return priorityB - priorityA;
      }
    }
    if (sortBy === "newest") return b.created_at.localeCompare(a.created_at);
    if (sortBy === "likes") return b.likesCount - a.likesCount;
    return 0;
  });

  const totalItems = sortedCasts.length;
  const totalPages = Math.ceil(totalItems / ITEMS_PER_PAGE);
  
  const currentCasts = sortedCasts.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const clearFilters = () => {
    setFilterRole(null);
    setFilterPlayStyle(null);
    setSearchName("");
  };

  const goToPage = (page: number) => {
    setCurrentPage(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <main className="section section-soft" style={{ minHeight: "100vh" }}>
        <div className="container">
          
          <div style={{ marginBottom: "24px" }}>
            <h1 className="section-title" style={{ margin: "0 0 16px 0", textAlign: "left" }}>キャストを探す</h1>

            {/* 絞り込みエリア */}
            <div className="filter-box" style={{ background: "#fff", padding: "16px", borderRadius: "12px", border: "1px solid #eee", marginBottom: "24px" }}>
              <div style={{ fontSize: "0.9rem", fontWeight: "bold", marginBottom: "12px", color: "#333", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>🔍 条件で絞り込む</span>
                {(filterRole || filterPlayStyle || searchName) && (
                  <button onClick={clearFilters} style={{ background: "none", border: "none", color: "#ff4757", cursor: "pointer", fontSize: "0.85rem", textDecoration: "underline" }}>
                    × 条件をクリア
                  </button>
                )}
              </div>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div className="filter-row">
                  <span className="filter-label" style={{ alignSelf: "center" }}>検索:</span>
                  <input type="text" placeholder="名前で検索..." value={searchName} onChange={(e) => setSearchName(e.target.value)} className="input-search"/>
                </div>
                <div className="filter-row">
                  <span className="filter-label">ロール:</span>
                  <div className="filter-options">
                    {ROLE_OPTIONS.map((option) => (
                      <button key={option.value} className={`filter-chip ${filterRole === option.value ? "active" : ""}`} onClick={() => setFilterRole(filterRole === option.value ? null : option.value)}>
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="filter-row">
                  <span className="filter-label">環境:</span>
                  <div className="filter-options">
                    {PLAY_STYLE_OPTIONS.map((style) => (
                      <button key={style} className={`filter-chip ${filterPlayStyle === style ? "active" : ""}`} onClick={() => setFilterPlayStyle(filterPlayStyle === style ? null : style)}>
                        {style}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
              <p style={{ margin: 0, color: "#666", fontSize: "0.9rem" }}>
                <b>{totalItems}</b> 名ヒット 
                {totalPages > 1 && ` (ページ ${currentPage} / ${totalPages})`}
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: "16px", flexWrap: "wrap" }}>
                <select value={sortBy} onChange={(e) => setSortBy(e.target.value as any)} className="sort-select">
                  <option value="newest">🆕 新着順</option>
                  <option value="likes">💖 人気順</option>
                </select>
                <div className="view-toggle-area" style={{ margin: 0 }}>
                  <button className={`view-btn ${viewMode === "grid" ? "active" : ""}`} onClick={() => setViewMode("grid")} title="グリッド">田</button>
                  <button className={`view-btn ${viewMode === "list" ? "active" : ""}`} onClick={() => setViewMode("list")} title="リスト">☰</button>
                  <button className={`view-btn ${viewMode === "compact" ? "active" : ""}`} onClick={() => setViewMode("compact")} title="テキスト">≣</button>
                </div>
              </div>
            </div>
          </div>
          
          {/* ▼▼▼ ローディング中は「スケルトン」を表示する処理に変更 ▼▼▼ */}
          {loading ? (
             <div style={{ display: "grid", gap: "16px", gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))" }}>
                {/* 12個くらいダミーの箱を表示しておく */}
                {[...Array(12)].map((_, i) => (
                  <div key={i} className="card skeleton-card" style={{ height: "280px", padding: 0 }}>
                    <div className="skeleton-image"></div>
                    <div style={{ padding: "12px" }}>
                      <div className="skeleton-text" style={{ width: "60%" }}></div>
                      <div className="skeleton-text" style={{ width: "40%", marginTop: "8px" }}></div>
                    </div>
                  </div>
                ))}
             </div>
          ) : currentCasts.length === 0 ? (
            <div className="card" style={{ textAlign: "center", padding: "60px" }}>
              <p>条件に一致するキャストは見つかりませんでした。</p>
              <button onClick={clearFilters} className="btn btn-ghost" style={{ marginTop: "16px" }}>条件をリセットする</button>
            </div>
          ) : (
            <>
              <div 
                className={`event-grid event-container ${viewMode === "list" ? "list-view" : ""} ${viewMode === "compact" ? "compact-view" : ""}`} 
                style={{ 
                  display: "grid", 
                  gap: "16px",
                  gridTemplateColumns: viewMode === "grid" ? "repeat(auto-fill, minmax(180px, 1fr))" : undefined,
                  marginBottom: "40px"
                }}
              >
                {currentCasts.map((cast) => {
                  const isMainHit = filterRole && cast.role === filterRole;
                  const isSubHit1 = filterRole && cast.sub_role_1 === filterRole;
                  const isSubHit2 = filterRole && cast.sub_role_2 === filterRole;
                  // ★追加: 新着判定
                  const isNew = isNewMember(cast.created_at);

                  return (
                    <Link href={`/casts/${cast.user_id}`} key={cast.id} style={{ textDecoration: "none", color: "inherit" }}>
                      <div 
                        className={`card hover-up event-card ${viewMode === "list" ? "list-view" : ""} ${viewMode === "compact" ? "compact-view" : ""}`} 
                        style={{ 
                          padding: "0", 
                          overflow: "hidden", 
                          display: "flex", 
                          flexDirection: "column", 
                          height: "100%",
                          borderRadius: "8px",
                          border: "1px solid #eaeaea",
                        }}
                      >
                        {viewMode !== "compact" && (
                          <div className="card-image" style={{ width: "100%", aspectRatio: "1/1", background: "#f9f9f9", position: "relative", borderBottom: "1px solid #f0f0f0" }}>
                            
                            {/* ロールバッジ */}
                            {cast.role && (
                               <div style={{ position: "absolute", top: "4px", left: "4px", zIndex: 2 }}>
                                 <span style={{ 
                                   background: isMainHit ? "#ff4757" : "rgba(124, 58, 237, 0.9)",
                                   color: "#fff", padding: "2px 6px", borderRadius: "4px", fontSize: "0.65rem", fontWeight: "bold" 
                                 }}>
                                   {getRoleLabel(cast.role)}
                                 </span>
                               </div>
                            )}

                            {/* ★追加: NEWバッジ (右上に表示) */}
                            {isNew && (
                               <div style={{ position: "absolute", top: "4px", right: "4px", zIndex: 2 }}>
                                 <span className="new-badge">🔰 NEW</span>
                               </div>
                            )}

                            {cast.avatar_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={cast.avatar_url} alt={cast.display_name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            ) : (
                              <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#ccc", fontSize: "2rem" }}>👤</div>
                            )}
                          </div>
                        )}

                        <div style={{ padding: "12px", flex: 1, display: "flex", flexDirection: "column", width: "100%" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                            <h3 style={{ fontSize: "1rem", fontWeight: "bold", margin: 0, lineHeight: 1.3, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1 }}>
                              {cast.display_name || "ゲスト"}
                            </h3>
                            {cast.likesCount > 0 && (
                              <div style={{ fontSize: "0.75rem", color: "#ff4757", fontWeight: "bold", display: "flex", alignItems: "center", gap: "2px", marginLeft: "4px" }}>
                                <span>♥</span>{cast.likesCount}
                              </div>
                            )}
                          </div>

                          {(cast.sub_role_1 || cast.sub_role_2) && (
                            <div style={{ display: "flex", gap: "4px", flexWrap: "wrap", marginBottom: "8px" }}>
                              {cast.sub_role_1 && (
                                <span className="sub-role-badge" style={isSubHit1 ? { background: "#ffe4e6", color: "#be123c", borderColor: "#fda4af" } : {}}>{getRoleLabel(cast.sub_role_1)}</span>
                              )}
                              {cast.sub_role_2 && (
                                <span className="sub-role-badge" style={isSubHit2 ? { background: "#ffe4e6", color: "#be123c", borderColor: "#fda4af" } : {}}>{getRoleLabel(cast.sub_role_2)}</span>
                              )}
                            </div>
                          )}
                          
                          {viewMode !== "compact" && (
                            <div className="card-desc" style={{ 
                              fontSize: "0.8rem", 
                              color: "#666", 
                              marginTop: "auto", 
                              display: "-webkit-box", 
                              WebkitLineClamp: 5, 
                              WebkitBoxOrient: "vertical", 
                              overflow: "hidden",
                              lineHeight: "1.5"
                            }}>
                              {cast.bio || "自己紹介文はまだありません。"}
                            </div>
                          )}
                          {viewMode === "compact" && (
                            <div style={{ fontSize: "0.8rem", color: "var(--accent)" }}>{getRoleLabel(cast.role)}</div>
                          )}
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>

              {totalPages > 1 && (
                <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "16px", marginTop: "24px" }}>
                  <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1} className="pagination-btn">
                    &lt; 前へ
                  </button>
                  <span style={{ fontWeight: "bold", color: "#555" }}>
                    {currentPage} / {totalPages}
                  </span>
                  <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages} className="pagination-btn">
                    次へ &gt;
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </main>

      <style jsx>{`
        /* スケルトンローディングのアニメーション */
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .skeleton-card {
          border: 1px solid #eee;
          background: #fff;
          overflow: hidden;
        }
        .skeleton-image {
          width: 100%;
          aspect-ratio: 1/1;
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: shimmer 1.5s infinite;
        }
        .skeleton-text {
          height: 12px;
          background: #eee;
          border-radius: 4px;
        }

        /* NEWバッジ */
        .new-badge {
            background: #22c55e;
            color: white;
            padding: 2px 6px;
            border-radius: 4px;
            font-size: 0.65rem;
            font-weight: bold;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
        }

        .pagination-btn {
          padding: 8px 16px;
          border: 1px solid #ddd;
          background: #fff;
          border-radius: 8px;
          cursor: pointer;
          font-weight: bold;
          color: #555;
          transition: all 0.2s;
        }
        .pagination-btn:hover:not(:disabled) {
          background: var(--accent);
          color: #fff;
          border-color: var(--accent);
        }
        .pagination-btn:disabled {
          opacity: 0.5;
          cursor: not-allowed;
          background: #f5f5f5;
        }

        .input-search { padding: 8px 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 0.95rem; width: 100%; max-width: 300px; }
        .input-search:focus { outline: none; border-color: var(--accent); box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1); }
        .sub-role-badge { background: #f0f0f0; color: #666; font-size: 0.65rem; padding: 2px 6px; borderRadius: 3px; border: 1px solid #eee; white-space: nowrap; }
        .filter-row { display: flex; align-items: flex-start; gap: 16px; }
        .filter-label { font-weight: bold; font-size: 0.85rem; color: #666; width: 50px; padding-top: 6px; flex-shrink: 0; }
        .filter-options { display: flex; flex-wrap: wrap; gap: 6px; flex: 1; }
        .filter-chip { background: #f5f5f5; border: 1px solid #ddd; padding: 4px 10px; border-radius: 99px; cursor: pointer; font-size: 0.8rem; color: #555; transition: all 0.2s; }
        .filter-chip:hover { background: #eaeaea; }
        .filter-chip.active { background: var(--accent); color: #fff; border-color: var(--accent); }
        .sort-select { padding: 6px 10px; border-radius: 6px; border: 1px solid #ddd; background: #fff; font-size: 0.85rem; cursor: pointer; outline: none; }
        .hover-up { transition: transform 0.2s, box-shadow 0.2s; }
        .hover-up:hover { transform: translateY(-3px); box-shadow: 0 6px 12px rgba(0,0,0,0.08); }
        @media (max-width: 600px) { .filter-row { flex-direction: column; gap: 8px; } .filter-label { width: auto; padding-top: 0; } }
      `}</style>
    </>
  );
}