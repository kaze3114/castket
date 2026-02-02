"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import toast from "react-hot-toast";

export default function EventEntryManager() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [event, setEvent] = useState<any>(null);
  const [entries, setEntries] = useState<any[]>([]);

  // データ読み込み
  useEffect(() => {
    const fetchData = async () => {
      // 1. まずログイン確認
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      // 2. イベント情報を取得（自分が主催かチェック）
      const { data: eventData, error: eventError } = await supabase
        .from("events")
        .select("*")
        .eq("id", params.id)
        .single();

      if (eventError || !eventData) {
        toast.error("イベントが見つかりません");
        router.push("/dashboard/events");
        return;
      }

      if (eventData.organizer_id !== user.id) {
        toast.error("権限がありません");
        router.push("/dashboard");
        return;
      }

      setEvent(eventData);

      // 3. このイベントへの応募(entries)を取得
      const { data: entryData, error: entryError } = await supabase
        .from("entries")
        .select("*")
        .eq("event_id", params.id)
        .order("created_at", { ascending: false });

      if (entryData) {
        // 4. 応募者のプロフィール情報を取得して合体させる
        // (cast_id をリストにして一括取得)
        const castIds = entryData.map((e) => e.cast_id);
        
        if (castIds.length > 0) {
          const { data: profiles } = await supabase
            .from("profiles")
            .select("*")
            .in("user_id", castIds);

          // エントリー情報にプロフィール情報をくっつける
          const entriesWithProfile = entryData.map((entry) => {
            const profile = profiles?.find((p) => p.user_id === entry.cast_id);
            return { ...entry, profile };
          });
          
          setEntries(entriesWithProfile);
        } else {
          setEntries([]);
        }
      }
      setLoading(false);
    };

    fetchData();
  }, [params, router]);

  // ステータス更新処理
  const updateStatus = async (entryId: number, newStatus: string) => {
    if (!confirm(`この応募を「${newStatus}」に変更しますか？`)) return;

    try {
      const { error } = await supabase
        .from("entries")
        .update({ status: newStatus })
        .eq("id", entryId); // entriesのidで指定

      if (error) throw error;

      // 画面上の表示も更新
      setEntries(entries.map(e => 
        e.id === entryId ? { ...e, status: newStatus } : e
      ));
      
      toast.error("ステータスを更新しました！");

    } catch (error: any) {
      toast.error("更新エラー: " + error.message);
    }
  };

  if (loading) return <div style={{ padding: "40px", textAlign: "center" }}>読み込み中...</div>;

  return (
    <>
      <header className="site-header">
        <div className="container header-inner">
          <Link href="/dashboard/events" className="logo-wrap" style={{ textDecoration: 'none' }}>
            <div className="logo-mark">C</div>
            <div className="logo-text-block">
              <div className="logo-text-main">Castket</div>
              <div className="logo-text-sub">Entry Manager</div>
            </div>
          </Link>
          <div className="header-actions">
            <Link href="/dashboard/events" className="btn btn-ghost">← 戻る</Link>
          </div>
        </div>
      </header>

      <main className="section section-soft" style={{ minHeight: "100vh" }}>
        <div className="container">
          <div style={{ marginBottom: "32px" }}>
            <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>イベント応募管理</p>
            <h1 className="section-title" style={{ textAlign: "left", fontSize: "1.8rem" }}>{event.title}</h1>
          </div>

          <div className="card">
            <h2 className="card-title" style={{ marginBottom: "20px" }}>応募者リスト ({entries.length}件)</h2>

            {entries.length === 0 ? (
              <p style={{ color: "var(--muted)", textAlign: "center", padding: "40px" }}>
                まだ応募はありません。
              </p>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {entries.map((entry) => (
                  <div key={entry.id} style={{ 
                    border: "1px solid var(--border)", 
                    borderRadius: "12px", 
                    padding: "20px",
                    display: "flex",
                    flexDirection: "column",
                    gap: "16px",
                    background: entry.status === "Accepted" ? "#f0fdf4" : entry.status === "Rejected" ? "#fef2f2" : "#fff"
                  }}>
                    {/* 上段：プロフィールとステータス */}
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
                      
                      {/* プロフィール情報 */}
                      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                        <div style={{ width: "50px", height: "50px", borderRadius: "50%", background: "#eee", overflow: "hidden" }}>
                          {entry.profile?.avatar_url ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={entry.profile.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          ) : (
                            <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", color: "#ccc" }}>?</div>
                          )}
                        </div>
                        <div>
                          <div style={{ fontWeight: "bold", fontSize: "1.1rem" }}>
                            {entry.profile?.display_name || "不明なユーザー"}
                          </div>
                          <div style={{ fontSize: "0.85rem", color: "var(--muted)" }}>
                            {entry.profile?.role}
                          </div>
                        </div>
                      </div>

                      {/* 現在のステータスバッジ */}
                      <div style={{ 
                        padding: "6px 16px", 
                        borderRadius: "99px", 
                        fontWeight: "bold",
                        fontSize: "0.9rem",
                        background: entry.status === "Accepted" ? "#22c55e" : entry.status === "Rejected" ? "#ef4444" : "#eab308",
                        color: "#fff"
                      }}>
                        {entry.status === "Pending" && "保留中"}
                        {entry.status === "Accepted" && "採用済み"}
                        {entry.status === "Rejected" && "見送り"}
                      </div>
                    </div>

                    {/* 中段：メッセージ */}
                    <div style={{ background: "rgba(0,0,0,0.03)", padding: "12px", borderRadius: "8px", fontSize: "0.95rem" }}>
                      <p style={{ fontWeight: "bold", fontSize: "0.8rem", color: "var(--muted)", marginBottom: "4px" }}>メッセージ:</p>
                      {entry.message || "なし"}
                    </div>

                    {/* 下段：操作ボタン */}
                    <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", borderTop: "1px solid rgba(0,0,0,0.05)", paddingTop: "12px" }}>
                      <Link href={`/casts/${entry.cast_id}`} target="_blank">
                        <button className="btn btn-ghost" style={{ fontSize: "0.9rem" }}>詳細プロフィール確認</button>
                      </Link>
                      
                      {entry.status !== "Accepted" && (
                        <button 
                          onClick={() => updateStatus(entry.id, "Accepted")}
                          className="btn btn-primary"
                          style={{ background: "#22c55e", borderColor: "#22c55e" }}
                        >
                          採用する
                        </button>
                      )}
                      
                      {entry.status !== "Rejected" && (
                        <button 
                          onClick={() => updateStatus(entry.id, "Rejected")}
                          className="btn btn-ghost"
                          style={{ color: "#ef4444", borderColor: "#ef4444", border: "1px solid" }}
                        >
                          見送る
                        </button>
                      )}
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </>
  );
}