"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";

type OfferReplyModalProps = {
  isOpen: boolean;
  onClose: () => void;
  offer: any;            // 選択されたオファーデータ
  onUpdate: () => void;  // 更新後に親画面をリフレッシュする関数
};

export default function OfferReplyModal({ isOpen, onClose, offer, onUpdate }: OfferReplyModalProps) {
  const [loading, setLoading] = useState(false);

  if (!isOpen || !offer) return null;

  // オファーへの返信処理
  const handleRespond = async (status: "accepted" | "rejected") => {
    if (!confirm(status === "accepted" ? "オファーを承諾しますか？" : "本当に辞退しますか？")) return;

    setLoading(true);
    try {
      // 1. オファーのステータスを更新
      const { error } = await supabase
        .from("offers")
        .update({ status: status })
        .eq("id", offer.id);

      if (error) throw error;

      // (将来的にはここで entries テーブルにも追加すると完璧ですが、まずはオファー状況の更新だけでOK)

      toast.success(status === "accepted" ? "オファーを承諾しました！🎉" : "オファーを辞退しました。");
      onUpdate(); // ダッシュボードを更新
      onClose();  // 閉じる
    } catch (err: any) {
      toast.error("エラー: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
      backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000
    }}>
      <div className="card" style={{ width: "90%", maxWidth: "500px", background: "#fff", padding: "32px", position: "relative" }}>
        {/* 閉じるボタン */}
        <button onClick={onClose} style={{ position: "absolute", top: "16px", right: "16px", background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer" }}>×</button>

        <h3 style={{ fontSize: "1.2rem", marginBottom: "24px", textAlign: "center" }}>📩 オファー内容の確認</h3>

        <div style={{ marginBottom: "24px", textAlign: "center" }}>
          <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "#eee", overflow: "hidden", margin: "0 auto 12px" }}>
            {offer.sender?.avatar_url && <img src={offer.sender.avatar_url} style={{ width: "100%", height: "100%", objectFit: "cover" }} />}
          </div>
          <div style={{ fontWeight: "bold", fontSize: "1.1rem" }}>{offer.sender?.display_name} さんより</div>
          <div style={{ color: "var(--muted)", fontSize: "0.9rem" }}>イベントへの出演依頼</div>
        </div>

        <div style={{ background: "#f9f9f9", padding: "16px", borderRadius: "8px", marginBottom: "24px" }}>
          <div style={{ fontSize: "0.85rem", color: "var(--muted)", marginBottom: "4px" }}>対象イベント</div>
          <div style={{ fontWeight: "bold", marginBottom: "16px", fontSize: "1.1rem" }}>{offer.event?.title}</div>
          
          <div style={{ fontSize: "0.85rem", color: "var(--muted)", marginBottom: "4px" }}>メッセージ</div>
          <div style={{ whiteSpace: "pre-wrap", lineHeight: 1.6 }}>{offer.message || "(メッセージはありません)"}</div>
        </div>

        {/* アクションボタン (ステータスが pending の時だけ表示) */}
        {offer.status === "pending" ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <button 
              className="btn" 
              style={{ background: "#eee", color: "#333" }}
              onClick={() => handleRespond("rejected")}
              disabled={loading}
            >
              辞退する
            </button>
            <button 
              className="btn btn-primary"
              onClick={() => handleRespond("accepted")}
              disabled={loading}
            >
              承諾する
            </button>
          </div>
        ) : (
          <div style={{ textAlign: "center", padding: "12px", background: offer.status === "accepted" ? "#d1fae5" : "#f3f4f6", borderRadius: "8px", color: offer.status === "accepted" ? "#065f46" : "#374151", fontWeight: "bold" }}>
            {offer.status === "accepted" ? "✅ このオファーは承諾済みです" : "🚫 このオファーは辞退しました"}
          </div>
        )}
      </div>
    </div>
  );
}