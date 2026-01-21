"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

type Props = {
  castId: string;      // キャスト(ユーザー)のID
  userId?: string;     // 今ログインしている人のID
  initialIsLiked: boolean;
  initialCount: number;
};

export default function CastLikeButton({ castId, userId, initialIsLiked, initialCount }: Props) {
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [count, setCount] = useState(initialCount);
  const [isLoading, setIsLoading] = useState(false);

  const toggleLike = async () => {
    // 自分のIDと相手のIDが同じなら押せないようにする
    if (userId === castId) {
      alert("自分にはいいねできません");
      return;
    }
    if (!userId) {
      alert("応援するにはログインが必要です");
      return;
    }
    if (isLoading) return;

    setIsLoading(true);
    
    const nextIsLiked = !isLiked;
    setIsLiked(nextIsLiked);
    setCount((prev) => nextIsLiked ? prev + 1 : prev - 1);

    try {
      if (nextIsLiked) {
        // いいね登録
        const { error } = await supabase
          .from("profile_likes")
          .insert({ user_id: userId, target_cast_id: castId });
        if (error) throw error;
      } else {
        // いいね解除
        const { error } = await supabase
          .from("profile_likes")
          .delete()
          .eq("user_id", userId)
          .eq("target_cast_id", castId);
        if (error) throw error;
      }
    } catch (error) {
      console.error("Like Error:", error);
      setIsLiked(!nextIsLiked);
      setCount((prev) => nextIsLiked ? prev - 1 : prev + 1);
      alert("通信エラーが発生しました");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <button 
      onClick={toggleLike}
      className={`like-btn ${isLiked ? "liked" : ""}`}
      style={{
        display: "flex",
        alignItems: "center",
        gap: "6px",
        padding: "8px 16px",
        border: `1px solid ${isLiked ? "#ff4757" : "#ddd"}`,
        borderRadius: "99px",
        background: isLiked ? "#fff0f1" : "#fff",
        color: isLiked ? "#ff4757" : "#666",
        fontWeight: "bold",
        cursor: isLoading ? "wait" : "pointer",
        transition: "all 0.2s",
        fontSize: "0.9rem"
      }}
    >
      <span style={{ fontSize: "1.1rem" }}>
        {isLiked ? "💖" : "🤍"} 
      </span>
      <span>{count}</span>
      
      <style jsx>{`
        .like-btn:hover { transform: scale(1.05); }
        .like-btn:active { transform: scale(0.95); }
      `}</style>
    </button>
  );
}