"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  targetId: string; // キャストのユーザーID
  targetName: string; // キャストの名前
  userId: string;   // 自分のID
  onUpdate?: () => void; // 更新後のコールバック（ダッシュボード用）
};

export default function BookmarkModal({ isOpen, onClose, targetId, targetName, userId, onUpdate }: Props) {
  const [memo, setMemo] = useState("");
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  // モダールが開いたときに現状のデータを取得
  useEffect(() => {
    if (isOpen && userId && targetId) {
      setFetching(true);
      const checkStatus = async () => {
        const { data } = await supabase
          .from("cast_bookmarks")
          .select("memo")
          .eq("user_id", userId)
          .eq("target_cast_id", targetId)
          .maybeSingle();

        if (data) {
          setIsBookmarked(true);
          setMemo(data.memo || "");
        } else {
          setIsBookmarked(false);
          setMemo("");
        }
        setFetching(false);
      };
      checkStatus();
    }
  }, [isOpen, userId, targetId]);

  const handleSave = async () => {
    setLoading(true);
    try {
      // upsert: なければ作成、あれば更新（メモも保存）
      const { error } = await supabase
        .from("cast_bookmarks")
        .upsert({ 
          user_id: userId, 
          target_cast_id: targetId,
          memo: memo 
        }, { onConflict: 'user_id, target_cast_id' });

      if (error) throw error;

      toast.success(isBookmarked ? "メモを更新しました！" : "ブックマークしました！");
      if (onUpdate) onUpdate();
      onClose();
    } catch (e: any) {
      toast.error("エラー: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async () => {
    if (!confirm("ブックマークを解除しますか？")) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from("cast_bookmarks")
        .delete()
        .eq("user_id", userId)
        .eq("target_cast_id", targetId);

      if (error) throw error;

      toast.success("ブックマークを解除しました");
      if (onUpdate) onUpdate();
      onClose();
    } catch (e: any) {
      toast.error("エラー: " + e.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
      backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100
    }}>
      <div className="card" style={{ width: "90%", maxWidth: "400px", background: "#fff", padding: "24px", position: "relative" }}>
        <button onClick={onClose} style={{ position: "absolute", top: "12px", right: "12px", background: "none", border: "none", fontSize: "1.2rem", cursor: "pointer" }}>×</button>
        
        <h3 style={{ fontSize: "1.1rem", marginBottom: "16px" }}>
          🔖 {targetName} さんを記録
        </h3>

        {fetching ? (
          <div style={{ textAlign: "center", padding: "20px" }}>読み込み中...</div>
        ) : (
          <>
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold", fontSize: "0.9rem" }}>メモ (任意)</label>
              <textarea
                rows={4}
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="例：歌声が素敵だった。次回の音楽イベントに誘いたい。"
                style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #ddd", fontFamily: "inherit" }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              {isBookmarked ? (
                <button onClick={handleRemove} className="btn" style={{ background: "#fee2e2", color: "#ef4444", fontSize: "0.9rem" }} disabled={loading}>
                  🗑 解除
                </button>
              ) : (
                <div></div> /* スペース調整用 */
              )}
              
              <div style={{ display: "flex", gap: "8px" }}>
                <button onClick={onClose} className="btn btn-ghost">キャンセル</button>
                <button onClick={handleSave} className="btn btn-primary" disabled={loading}>
                  {loading ? "処理中..." : "保存する"}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}