"use client";

import { useState } from "react";

type ApplyModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (message: string) => void;
  loading: boolean;
  eventTitle: string;
};

const DEFAULT_MESSAGE = "ぜひ参加させてください！";

export default function ApplyModal({ isOpen, onClose, onSubmit, loading, eventTitle }: ApplyModalProps) {
  const [message, setMessage] = useState(DEFAULT_MESSAGE);

  if (!isOpen) return null;

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
        backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1100, padding: "16px",
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="card"
        style={{ width: "100%", maxWidth: "500px", background: "#fff", padding: "24px" }}
      >
        <h3 style={{ fontSize: "1.2rem", marginBottom: "4px" }}>🙋 このイベントに応募する</h3>
        <p style={{ fontSize: "0.9rem", color: "var(--muted)", marginBottom: "16px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
          {eventTitle}
        </p>

        <div style={{ marginBottom: "20px" }}>
          <label style={{ display: "block", marginBottom: "8px", fontWeight: "bold", fontSize: "0.9rem" }}>
            主催者へのメッセージ <span style={{ color: "var(--muted)", fontWeight: "normal" }}>(任意)</span>
          </label>
          <textarea
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="自己紹介や意気込み、できる役割などを書くと採用されやすくなります。"
            maxLength={500}
            autoFocus
            style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid #ddd", resize: "vertical", fontFamily: "inherit", fontSize: "0.95rem", lineHeight: 1.6 }}
          />
          <div style={{ textAlign: "right", fontSize: "0.75rem", color: "var(--muted)", marginTop: "4px" }}>
            {message.length} / 500
          </div>
        </div>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
          <button className="btn btn-ghost" onClick={onClose} disabled={loading}>キャンセル</button>
          <button className="btn btn-primary" onClick={() => onSubmit(message)} disabled={loading}>
            {loading ? "送信中..." : "応募を送信する"}
          </button>
        </div>
      </div>
    </div>
  );
}
