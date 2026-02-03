"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
// ▼ 追加
import BookmarkModal from "./BookmarkModal";

type Props = {
  targetId: string | number;
  targetType: "event" | "cast";
  userId?: string;
  targetName?: string; // ▼ 追加: モダールに名前を出すため
};

export default function BookmarkButton({ targetId, targetType, userId, targetName = "このユーザー" }: Props) {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // ▼ 追加: モダール開閉用
  const [isModalOpen, setIsModalOpen] = useState(false);

  // 初期状態チェック
  const checkBookmark = async () => {
    if (!userId) return;
    const table = targetType === "event" ? "event_bookmarks" : "cast_bookmarks";
    const idColumn = targetType === "event" ? "event_id" : "target_cast_id";

    const { data } = await supabase
      .from(table)
      .select("id")
      .eq("user_id", userId)
      .eq(idColumn, targetId)
      .maybeSingle();
    
    setIsBookmarked(!!data);
  };

  useEffect(() => {
    checkBookmark();
  }, [userId, targetId, targetType]);

  const handleClick = async () => {
    if (!userId) {
      alert("保存するにはログインが必要です");
      return;
    }

    // ★キャストの場合はモダールを開く
    if (targetType === "cast") {
      setIsModalOpen(true);
      return;
    }

    // --- 以下はイベント用の既存ロジック（そのまま） ---
    if (loading) return;
    setLoading(true);

    try {
      if (isBookmarked) {
        await supabase.from("event_bookmarks").delete().eq("user_id", userId).eq("event_id", targetId);
        setIsBookmarked(false);
      } else {
        await supabase.from("event_bookmarks").insert({ user_id: userId, event_id: targetId });
        setIsBookmarked(true);
      }
    } catch (error) {
      console.error(error);
      alert("エラーが発生しました");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <button 
        onClick={handleClick}
        style={{
          background: isBookmarked ? "#333" : "#f0f0f0",
          color: isBookmarked ? "#fff" : "#333",
          border: "none",
          borderRadius: "99px",
          padding: "8px 16px",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          gap: "6px",
          fontWeight: "bold",
          fontSize: "0.9rem",
          transition: "all 0.2s"
        }}
      >
        <span>{isBookmarked ? "🔖 保存済み" : "🔖 保存する"}</span>
      </button>

      {/* ▼ キャスト用モダール */}
      {targetType === "cast" && userId && (
        <BookmarkModal 
          isOpen={isModalOpen} 
          onClose={() => setIsModalOpen(false)}
          targetId={targetId as string}
          targetName={targetName}
          userId={userId}
          onUpdate={checkBookmark} // 保存後に状態を再確認
        />
      )}
    </>
  );
}