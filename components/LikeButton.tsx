"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

type Props = {
  eventId: string;
  userId?: string;     // ログインしてない場合もあるので ? をつける
  initialIsLiked: boolean;
  initialCount: number;
};

export default function LikeButton({ eventId, userId, initialIsLiked, initialCount }: Props) {
  const [isLiked, setIsLiked] = useState(initialIsLiked);
  const [count, setCount] = useState(initialCount);
  const [isLoading, setIsLoading] = useState(false);

  const toggleLike = async () => {
    if (!userId) {
      alert("いいねするにはログインが必要です");
      return;
    }
    if (isLoading) return;

    setIsLoading(true);
    
    // UIを先に更新（サクサク動くように見せる）
    const nextIsLiked = !isLiked;
    setIsLiked(nextIsLiked);
    setCount((prev) => nextIsLiked ? prev + 1 : prev - 1);

    try {
      if (nextIsLiked) {
        // いいね登録
        const { error } = await supabase
          .from("likes")
          .insert({ user_id: userId, event_id: eventId });
        if (error) throw error;
      } else {
        // いいね解除
        const { error } = await supabase
          .from("likes")
          .delete()
          .eq("user_id", userId)
          .eq("event_id", eventId);
        if (error) throw error;
      }
    } catch (error) {
      console.error("Like Error:", error);
      // エラーが出たら見た目を元に戻す
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
        fontSize: "1rem"
      }}
    >
      <span style={{ fontSize: "1.2rem" }}>
        {isLiked ? "❤️" : "🤍"}
      </span>
      <span>{count}</span>
      
      <style jsx>{`
        .like-btn:hover { transform: scale(1.05); }
        .like-btn:active { transform: scale(0.95); }
      `}</style>
    </button>
  );
}