"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";

type Props = {
  targetId: string | number; // イベントID(number) または キャストID(uuid)
  targetType: "event" | "cast";
  userId?: string;
};

export default function BookmarkButton({ targetId, targetType, userId }: Props) {
  const [isBookmarked, setIsBookmarked] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!userId) return;
    const checkBookmark = async () => {
      const table = targetType === "event" ? "event_bookmarks" : "cast_bookmarks";
      const idColumn = targetType === "event" ? "event_id" : "target_cast_id";

      const { data } = await supabase
        .from(table)
        .select("id")
        .eq("user_id", userId)
        .eq(idColumn, targetId)
        .single();
      
      if (data) setIsBookmarked(true);
    };
    checkBookmark();
  }, [userId, targetId, targetType]);

  const toggleBookmark = async () => {
    if (!userId) {
      alert("保存するにはログインが必要です");
      return;
    }
    if (loading) return;
    setLoading(true);

    const table = targetType === "event" ? "event_bookmarks" : "cast_bookmarks";
    const idColumn = targetType === "event" ? "event_id" : "target_cast_id";

    try {
      if (isBookmarked) {
        // 解除
        await supabase
          .from(table)
          .delete()
          .eq("user_id", userId)
          .eq(idColumn, targetId);
        setIsBookmarked(false);
      } else {
        // 登録
        await supabase
          .from(table)
          .insert({ user_id: userId, [idColumn]: targetId });
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
    <button 
      onClick={toggleBookmark}
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
  );
}