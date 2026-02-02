"use client";

import { useEffect, useRef } from "react";
import useSWR from "swr";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

// データ取得関数
const fetchNotificationCounts = async () => {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  // オファーの総数を数える
  const { count: offerCount, error } = await supabase
    .from("offers")
    .select("*", { count: "exact", head: true }) // head: true で中身を取らず数だけ取得
    .eq("receiver_id", user.id);

  if (error) {
    console.error("通知チェックエラー:", error);
    return null;
  }
  
  // ログで確認（F12のコンソールに出ます）
  console.log("🔔 [通知チェック] 現在のオファー総数:", offerCount);
  
  return { offerCount: offerCount || 0 };
};

export default function NotificationListener() {
  const router = useRouter();
  
  // 前回の数を記録する箱
  const prevCountRef = useRef<number | null>(null);

  // SWRの設定
  const { data } = useSWR('notification-check', fetchNotificationCounts, {
    refreshInterval: 20000, // テスト用に10秒に短縮中
    dedupingInterval: 10000, 
    refreshWhenHidden: true, // ★追加: タブが裏にあってもサボらず動く
    refreshWhenOffline: false,
  });

  useEffect(() => {
    // データがない、またはログインしていない時は何もしない
    if (!data || data.offerCount === undefined) return;

    // 1. 初回ロード時
    if (prevCountRef.current === null) {
      prevCountRef.current = data.offerCount;
      return;
    }

    // 2. 数が増えた時だけ通知！
    if (data.offerCount > prevCountRef.current) {
      
      toast((t) => (
        <div onClick={() => { router.push("/dashboard/offers"); toast.dismiss(t.id); }} style={{ cursor: "pointer" }}>
          📩 <b>新着オファーが届きました！</b>
          <div style={{ fontSize: "0.80rem" }}>総数: {data.offerCount}件</div>
        </div>
      ), { duration: 6000, icon: '💡' });
    }

    // ★重要: 増えても減っても、必ず「今の数」を「前回の数」として上書きする
    // これをしないと、一度減った後に増えたとき通知されません
    prevCountRef.current = data.offerCount;

  }, [data, router]);

  return null;
}