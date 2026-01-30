"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";

type OfferModalProps = {
  isOpen: boolean;
  onClose: () => void;
  castId: string;        // 相手のID
  castName: string;      // 相手の名前
  myEvents: any[];       // 自分が主催しているイベントのリスト
  currentUserId: string; // 自分のID
};

export default function OfferModal({ isOpen, onClose, castId, castName, myEvents, currentUserId }: OfferModalProps) {
  const [selectedEventId, setSelectedEventId] = useState("");
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  const handleSendOffer = async () => {
    if (!selectedEventId) return alert("イベントを選択してください");
    
    setLoading(true);
    try {
      const { error } = await supabase.from("offers").insert({
        event_id: selectedEventId,
        sender_id: currentUserId,
        receiver_id: castId,
        message: message,
        status: "pending"
      });

      if (error) throw error;

      alert("オファーを送信しました！");
      onClose(); // 閉じる
      setMessage(""); // リセット
    } catch (err: any) {
      alert("エラー: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
      backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000
    }}>
      <div className="card" style={{ width: "90%", maxWidth: "500px", background: "#fff", padding: "24px" }}>
        <h3 style={{ fontSize: "1.2rem", marginBottom: "16px" }}>
          ✨ {castName} さんへオファー
        </h3>

        {myEvents.length === 0 ? (
          <div style={{ textAlign: "center", padding: "20px" }}>
            <p>主催しているイベントがありません。<br/>まずはイベントを作成してください。</p>
            <button className="btn btn-ghost" onClick={onClose} style={{ marginTop: "10px" }}>閉じる</button>
          </div>
        ) : (
          <>
            <div style={{ marginBottom: "16px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold" }}>どのイベントに招待しますか？</label>
              <select 
                value={selectedEventId} 
                onChange={(e) => setSelectedEventId(e.target.value)}
                style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #ddd" }}
              >
                <option value="">イベントを選択...</option>
                {myEvents.map(ev => (
                  <option key={ev.id} value={ev.id}>{ev.title}</option>
                ))}
              </select>
            </div>

            <div style={{ marginBottom: "24px" }}>
              <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold" }}>メッセージ (任意)</label>
              <textarea 
                rows={4}
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="例：ぜひメインキャストとして出演していただきたいです！"
                style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #ddd" }}
              />
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
              <button className="btn btn-ghost" onClick={onClose} disabled={loading}>キャンセル</button>
              <button className="btn btn-primary" onClick={handleSendOffer} disabled={loading || !selectedEventId}>
                {loading ? "送信中..." : "オファーを送る"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}