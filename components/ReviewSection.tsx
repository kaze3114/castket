"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";

type ReviewTarget = {
  user_id: string;
  display_name: string;
  avatar_url: string;
};

type Review = {
  id: string;
  reviewee_id: string;
  rating: number;
  comment: string | null;
};

type Props = {
  event: any;
  currentUserId: string;
  isMyEvent: boolean;
};

function StarSelector({ value, onChange, readonly = false }: { value: number; onChange?: (v: number) => void; readonly?: boolean }) {
  const [hovered, setHovered] = useState(0);
  return (
    <div style={{ display: "flex", gap: "2px" }}>
      {[1, 2, 3, 4, 5].map(n => (
        <span
          key={n}
          onClick={() => !readonly && onChange?.(n)}
          onMouseEnter={() => !readonly && setHovered(n)}
          onMouseLeave={() => !readonly && setHovered(0)}
          style={{
            fontSize: "1.6rem",
            cursor: readonly ? "default" : "pointer",
            color: n <= (hovered || value) ? "#f59e0b" : "#ddd",
            transition: "color 0.1s",
            lineHeight: 1,
          }}
        >★</span>
      ))}
    </div>
  );
}

function isEventEnded(event: any): boolean {
  const today = new Date().toISOString().split("T")[0];
  if (event.end_date) return event.end_date < today;
  if (event.schedule_type === "one_time") return (event.event_date ?? "") < today;
  if (event.schedule_type === "irregular") return event.irregular_dates?.every((d: string) => d < today) ?? false;
  return false;
}

export default function ReviewSection({ event, currentUserId, isMyEvent }: Props) {
  const [targets, setTargets] = useState<ReviewTarget[]>([]);
  const [myReviews, setMyReviews] = useState<Record<string, Review>>({});
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [comments, setComments] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  const ended = isEventEnded(event);

  useEffect(() => {
    if (!ended) { setLoading(false); return; }

    const init = async () => {
      if (isMyEvent) {
        const { data: entries } = await supabase
          .from("entries")
          .select("cast_id")
          .eq("event_id", event.id)
          .eq("status", "Accepted");

        if (entries && entries.length > 0) {
          const castIds = entries.map((e: any) => e.cast_id);
          const { data: profiles } = await supabase
            .from("profiles")
            .select("user_id, display_name, avatar_url")
            .in("user_id", castIds);
          if (profiles) setTargets(profiles);
        }
      } else {
        const { data: orgProfile } = await supabase
          .from("profiles")
          .select("user_id, display_name, avatar_url")
          .eq("user_id", event.organizer_id)
          .single();
        if (orgProfile) setTargets([orgProfile]);
      }

      const { data: reviews } = await supabase
        .from("reviews")
        .select("*")
        .eq("event_id", event.id)
        .eq("reviewer_id", currentUserId);

      if (reviews) {
        const map: Record<string, Review> = {};
        const rMap: Record<string, number> = {};
        reviews.forEach((r: Review) => { map[r.reviewee_id] = r; rMap[r.reviewee_id] = r.rating; });
        setMyReviews(map);
        setRatings(rMap);
      }

      setLoading(false);
    };

    init();
  }, [event.id, isMyEvent, currentUserId, ended]);

  const handleSubmit = async (targetId: string) => {
    const rating = ratings[targetId];
    if (!rating) return toast.error("星評価を選んでください");

    setSubmitting(prev => ({ ...prev, [targetId]: true }));
    try {
      const { data, error } = await supabase
        .from("reviews")
        .insert({
          event_id: event.id,
          reviewer_id: currentUserId,
          reviewee_id: targetId,
          rating,
          comment: comments[targetId]?.trim() || null,
        })
        .select()
        .single();

      if (error) throw error;
      setMyReviews(prev => ({ ...prev, [targetId]: data }));
      toast.success("レビューを送信しました！");
    } catch (err: any) {
      toast.error("エラー: " + err.message);
    } finally {
      setSubmitting(prev => ({ ...prev, [targetId]: false }));
    }
  };

  if (!ended) {
    return (
      <div style={{ background: "#f9f9f9", border: "1px solid var(--border)", borderRadius: "12px", padding: "20px", marginBottom: "32px", textAlign: "center" }}>
        <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>⏳ イベント終了後にレビューを書けるようになります</p>
      </div>
    );
  }

  if (loading || targets.length === 0) return null;

  const pendingCount = targets.filter(t => !myReviews[t.user_id]).length;

  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: "12px", padding: "20px", marginBottom: "32px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
        <h3 style={{ fontSize: "1.1rem", fontWeight: "bold", margin: 0 }}>⭐ レビュー</h3>
        {pendingCount > 0 && (
          <span style={{ background: "#fef3c7", color: "#92400e", padding: "4px 12px", borderRadius: "99px", fontSize: "0.8rem", fontWeight: "bold" }}>
            ✍️ {pendingCount}件 未記入
          </span>
        )}
      </div>

      <div style={{ display: "grid", gap: "16px" }}>
        {targets.map(target => {
          const existing = myReviews[target.user_id];
          const isSending = submitting[target.user_id];
          return (
            <div
              key={target.user_id}
              style={{
                background: existing ? "#f0fdf4" : "#fafafa",
                border: `1px solid ${existing ? "#bbf7d0" : "#eee"}`,
                borderRadius: "10px",
                padding: "16px",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "12px" }}>
                <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "#eee", overflow: "hidden", flexShrink: 0 }}>
                  {target.avatar_url && <img src={target.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
                </div>
                <div style={{ fontWeight: "bold" }}>{target.display_name}</div>
                {existing && (
                  <span style={{ marginLeft: "auto", color: "#16a34a", fontSize: "0.85rem", fontWeight: "bold" }}>✓ レビュー済み</span>
                )}
              </div>

              {existing ? (
                <div>
                  <StarSelector value={existing.rating} readonly />
                  {existing.comment && (
                    <p style={{ marginTop: "8px", fontSize: "0.9rem", color: "var(--text)", whiteSpace: "pre-wrap" }}>{existing.comment}</p>
                  )}
                </div>
              ) : (
                <div style={{ display: "grid", gap: "10px" }}>
                  <StarSelector
                    value={ratings[target.user_id] || 0}
                    onChange={v => setRatings(prev => ({ ...prev, [target.user_id]: v }))}
                  />
                  <textarea
                    rows={3}
                    value={comments[target.user_id] || ""}
                    onChange={e => setComments(prev => ({ ...prev, [target.user_id]: e.target.value }))}
                    placeholder="コメント（任意）"
                    style={{ width: "100%", padding: "8px 12px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "0.9rem", resize: "vertical" }}
                  />
                  <div style={{ display: "flex", justifyContent: "flex-end" }}>
                    <button
                      onClick={() => handleSubmit(target.user_id)}
                      disabled={isSending || !ratings[target.user_id]}
                      className="btn btn-primary"
                    >
                      {isSending ? "送信中..." : "レビューを送る"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
