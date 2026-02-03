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

  // 1. 【オファー】自分宛ての「返信待ち」オファー数
  const { count: offerCount } = await supabase
    .from("offers")
    .select("*", { count: "exact", head: true })
    .eq("receiver_id", user.id)
    .eq("status", "pending"); // ★ここ重要！未対応のものだけ数える

  // 2. 【応募】自分が主催しているイベントへの「承認待ち」参加者数
  // ステップA: 自分が主催者のイベントIDを全部取得
  const { data: myEvents } = await supabase
    .from("events")
    .select("id")
    .eq("organizer_id", user.id);
  
  let appCount = 0;

  // ステップB: そのイベントへの応募数（entriesテーブル）を数える
  if (myEvents && myEvents.length > 0) {
    const eventIds = myEvents.map(e => e.id);
    
    // ※ テーブル名が "entries" か "event_participants" か確認してください。
    // ダッシュボードの実装に合わせて "entries" としています。
    const { count } = await supabase
      .from("entries") 
      .select("*", { count: "exact", head: true })
      .in("event_id", eventIds)
      .eq("status", "pending"); // ★ここも！対応待ちの人だけ通知
    
    appCount = count || 0;
  }
  
  return { 
    offerCount: offerCount || 0,
    appCount: appCount || 0
  };
};

export default function NotificationListener() {
  const router = useRouter();
  
  // 前回の数を記録する箱
  const prevCountsRef = useRef<{ offer: number | null, app: number | null }>({
    offer: null,
    app: null
  });

  const { data } = useSWR('notification-check', fetchNotificationCounts, {
    refreshInterval: 30000,
    dedupingInterval: 10000, 
    refreshWhenHidden: true,
    refreshWhenOffline: false,
  });

  useEffect(() => {
    if (!data) return;

    // --- 1. 初回ロード時 ---
    if (prevCountsRef.current.offer === null) {
      prevCountsRef.current = { 
        offer: data.offerCount, 
        app: data.appCount 
      };
      return;
    }

    // --- 2. オファーが増えたかチェック ---
    // (未対応のものが増えた＝新しいオファーが来た！)
    if (data.offerCount > (prevCountsRef.current.offer || 0)) {
      toast((t) => (
        <div onClick={() => { router.push("/dashboard"); toast.dismiss(t.id); }} style={{ cursor: "pointer" }}>
          📩 <b>新着オファーが届きました！</b>
          <div style={{ fontSize: "0.80rem" }}>未読: {data.offerCount}件</div>
        </div>
      ), { duration: 6000, icon: '👏' });
    }

    // --- 3. 応募が増えたかチェック ---
    if (data.appCount > (prevCountsRef.current.app || 0)) {
      const diff = data.appCount - (prevCountsRef.current.app || 0);
      toast((t) => (
        <div onClick={() => { router.push("/dashboard"); toast.dismiss(t.id); }} style={{ cursor: "pointer" }}>
          🙋‍♂️ <b>イベントへの応募がありました！</b>
          <div style={{ fontSize: "0.80rem" }}>+{diff}件 の承認待ち</div>
        </div>
      ), { duration: 6000, icon: '🎉' });
    }

    // --- 4. 記録を更新 ---
    // 「対応して数が減った」場合もここで更新されるので、
    // 次にまた増えたらちゃんと通知が出ます。
    prevCountsRef.current = { 
      offer: data.offerCount, 
      app: data.appCount 
    };

  }, [data, router]);

  return null;
}