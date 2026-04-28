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
    .eq("status", "pending");

  // 2. 【応募】自分が主催しているイベントへの「承認待ち」参加者数
  const { data: myEvents } = await supabase
    .from("events")
    .select("id")
    .eq("organizer_id", user.id);

  let appCount = 0;
  if (myEvents && myEvents.length > 0) {
    const eventIds = myEvents.map(e => e.id);
    const { count } = await supabase
      .from("entries")
      .select("*", { count: "exact", head: true })
      .in("event_id", eventIds)
      .eq("status", "Pending");
    appCount = count || 0;
  }

  // 3. 【マッチング①】自分のエントリーが採用されたときの累計数（キャスト側）
  const { count: acceptedEntryCount } = await supabase
    .from("entries")
    .select("*", { count: "exact", head: true })
    .eq("cast_id", user.id)
    .eq("status", "Accepted");

  // 4. 【マッチング②】自分のオファーが承諾されたときの累計数（主催者側）
  const { count: acceptedOfferCount } = await supabase
    .from("offers")
    .select("*", { count: "exact", head: true })
    .eq("sender_id", user.id)
    .eq("status", "accepted");

  // 5. 【レビュー】終了済みイベントの未記入レビュー数
  const today = new Date().toISOString().split("T")[0];
  let pendingReviewCount = 0;

  // ①主催者として：終了済みイベントの採用キャストへの未レビュー
  const { data: orgEvents } = await supabase
    .from("events")
    .select("id, event_date, schedule_type, irregular_dates")
    .eq("organizer_id", user.id);

  const endedOrgIds = (orgEvents || []).filter((e: any) => {
    if (e.schedule_type === "one_time") return (e.event_date ?? "") < today;
    if (e.schedule_type === "irregular") return e.irregular_dates?.every((d: string) => d < today) ?? false;
    return false;
  }).map((e: any) => e.id);

  if (endedOrgIds.length > 0) {
    const [{ data: accepted }, { data: doneReviews }] = await Promise.all([
      supabase.from("entries").select("event_id, cast_id").in("event_id", endedOrgIds).eq("status", "Accepted"),
      supabase.from("reviews").select("event_id, reviewee_id").in("event_id", endedOrgIds).eq("reviewer_id", user.id),
    ]);
    const reviewedSet = new Set((doneReviews || []).map((r: any) => `${r.event_id}-${r.reviewee_id}`));
    for (const e of (accepted || [])) {
      if (!reviewedSet.has(`${e.event_id}-${e.cast_id}`)) pendingReviewCount++;
    }
  }

  // ②キャストとして：終了済みイベントの主催者への未レビュー
  const { data: castEntries } = await supabase
    .from("entries")
    .select("event_id, events!inner(organizer_id, event_date, schedule_type, irregular_dates)")
    .eq("cast_id", user.id)
    .eq("status", "Accepted");

  const endedCastEventIds: number[] = [];
  for (const entry of (castEntries || [])) {
    const ev = (entry as any).events;
    if (!ev) continue;
    let ended = false;
    if (ev.schedule_type === "one_time") ended = (ev.event_date ?? "") < today;
    else if (ev.schedule_type === "irregular") ended = ev.irregular_dates?.every((d: string) => d < today) ?? false;
    if (ended) endedCastEventIds.push(entry.event_id);
  }

  if (endedCastEventIds.length > 0) {
    const { data: castDoneReviews } = await supabase
      .from("reviews")
      .select("event_id")
      .in("event_id", endedCastEventIds)
      .eq("reviewer_id", user.id);
    const castReviewedSet = new Set((castDoneReviews || []).map((r: any) => r.event_id));
    for (const eid of endedCastEventIds) {
      if (!castReviewedSet.has(eid)) pendingReviewCount++;
    }
  }

  return {
    offerCount: offerCount || 0,
    appCount: appCount || 0,
    acceptedEntryCount: acceptedEntryCount || 0,
    acceptedOfferCount: acceptedOfferCount || 0,
    pendingReviewCount,
  };
};

export default function NotificationListener() {
  const router = useRouter();
  
  const prevCountsRef = useRef<{
    offer: number | null;
    app: number | null;
    acceptedEntry: number | null;
    acceptedOffer: number | null;
    pendingReview: number | null;
  }>({
    offer: null,
    app: null,
    acceptedEntry: null,
    acceptedOffer: null,
    pendingReview: null,
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
        app: data.appCount,
        acceptedEntry: data.acceptedEntryCount,
        acceptedOffer: data.acceptedOfferCount,
        pendingReview: data.pendingReviewCount,
      };
      if (data.pendingReviewCount > 0) {
        toast((t) => (
          <div onClick={() => { router.push("/dashboard"); toast.dismiss(t.id); }} style={{ cursor: "pointer" }}>
            ✍️ <b>未記入のレビューがあります</b>
            <div style={{ fontSize: "0.80rem" }}>{data.pendingReviewCount}件 イベントページから送れます</div>
          </div>
        ), { duration: 8000, icon: '⭐' });
      }
      return;
    }

    // --- 2. オファーが増えたかチェック ---
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

    // --- 4. マッチング通知①：自分のエントリーが採用されたとき（キャスト側）---
    if (data.acceptedEntryCount > (prevCountsRef.current.acceptedEntry || 0)) {
      const diff = data.acceptedEntryCount - (prevCountsRef.current.acceptedEntry || 0);
      toast((t) => (
        <div onClick={() => { router.push("/dashboard"); toast.dismiss(t.id); }} style={{ cursor: "pointer" }}>
          🎉 <b>イベントへの出演が決定しました！</b>
          <div style={{ fontSize: "0.80rem" }}>+{diff}件 採用されました</div>
        </div>
      ), { duration: 8000, icon: '🌟' });
    }

    // --- 5. マッチング通知②：自分のオファーが承諾されたとき（主催者側）---
    if (data.acceptedOfferCount > (prevCountsRef.current.acceptedOffer || 0)) {
      const diff = data.acceptedOfferCount - (prevCountsRef.current.acceptedOffer || 0);
      toast((t) => (
        <div onClick={() => { router.push("/dashboard"); toast.dismiss(t.id); }} style={{ cursor: "pointer" }}>
          ✅ <b>オファーが承諾されました！</b>
          <div style={{ fontSize: "0.80rem" }}>+{diff}件 マッチング成立</div>
        </div>
      ), { duration: 8000, icon: '🤝' });
    }

    // --- 6. 記録を更新 ---
    prevCountsRef.current = {
      offer: data.offerCount,
      app: data.appCount,
      acceptedEntry: data.acceptedEntryCount,
      acceptedOffer: data.acceptedOfferCount,
      pendingReview: data.pendingReviewCount,
    };

  }, [data, router]);

  return null;
}