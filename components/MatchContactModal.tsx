"use client";

import { useState, useEffect } from "react";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  twitterId: string;
  vrchatId: string;
  onConfirm: (selected: string[]) => Promise<void>;
  loading: boolean;
};

export default function MatchContactModal({ isOpen, onClose, twitterId, vrchatId, onConfirm, loading }: Props) {
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    if (isOpen) setSelected([]);
  }, [isOpen]);

  if (!isOpen) return null;

  const toggle = (key: string) => {
    setSelected(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

  const hasAnyContact = twitterId || vrchatId;

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
      backgroundColor: "rgba(0,0,0,0.6)", display: "flex", alignItems: "center",
      justifyContent: "center", zIndex: 1100,
    }}>
      <div className="card" style={{ width: "90%", maxWidth: "440px", background: "#fff", padding: "32px" }}>
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <div style={{ fontSize: "2.5rem", marginBottom: "8px" }}>🤝</div>
          <h3 style={{ fontSize: "1.2rem", fontWeight: "bold", marginBottom: "8px" }}>マッチング成立！</h3>
          <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>相手に共有する連絡先を選んでください</p>
        </div>

        {!hasAnyContact ? (
          <div style={{ background: "#f9f9f9", padding: "16px", borderRadius: "8px", textAlign: "center", marginBottom: "24px" }}>
            <p style={{ color: "var(--muted)", fontSize: "0.9rem", marginBottom: "8px" }}>
              プロフィールに連絡先が登録されていません。
            </p>
            <a href="/dashboard/profile" style={{ color: "var(--accent)", fontSize: "0.9rem", fontWeight: "bold" }}>
              プロフィールに連絡先を追加する →
            </a>
          </div>
        ) : (
          <div style={{ display: "grid", gap: "12px", marginBottom: "24px" }}>
            {twitterId && (
              <label style={{
                display: "flex", alignItems: "center", gap: "12px", padding: "16px",
                border: `2px solid ${selected.includes("twitter") ? "var(--accent)" : "#ddd"}`,
                borderRadius: "10px", cursor: "pointer", transition: "border-color 0.15s",
              }}>
                <input
                  type="checkbox"
                  checked={selected.includes("twitter")}
                  onChange={() => toggle("twitter")}
                  style={{ width: "18px", height: "18px", accentColor: "var(--accent)", flexShrink: 0 }}
                />
                <div>
                  <div style={{ fontWeight: "bold", fontSize: "0.95rem" }}>𝕏 (Twitter)</div>
                  <div style={{ color: "var(--muted)", fontSize: "0.85rem" }}>@{twitterId}</div>
                </div>
              </label>
            )}
            {vrchatId && (
              <label style={{
                display: "flex", alignItems: "center", gap: "12px", padding: "16px",
                border: `2px solid ${selected.includes("vrchat") ? "var(--accent)" : "#ddd"}`,
                borderRadius: "10px", cursor: "pointer", transition: "border-color 0.15s",
              }}>
                <input
                  type="checkbox"
                  checked={selected.includes("vrchat")}
                  onChange={() => toggle("vrchat")}
                  style={{ width: "18px", height: "18px", accentColor: "var(--accent)", flexShrink: 0 }}
                />
                <div>
                  <div style={{ fontWeight: "bold", fontSize: "0.95rem" }}>VRChat</div>
                  <div style={{ color: "var(--muted)", fontSize: "0.85rem" }}>{vrchatId}</div>
                </div>
              </label>
            )}
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
          <button className="btn btn-ghost" onClick={onClose} disabled={loading}>
            キャンセル
          </button>
          <button className="btn btn-primary" onClick={() => onConfirm(selected)} disabled={loading}>
            {loading ? "処理中..." : selected.length === 0 ? "共有せずに進む" : "共有して進む"}
          </button>
        </div>
      </div>
    </div>
  );
}
