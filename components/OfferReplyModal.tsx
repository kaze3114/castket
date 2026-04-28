"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";

type OfferReplyModalProps = {
  isOpen: boolean;
  onClose: () => void;
  offer: any;
  onUpdate: () => void;
  currentUserId: string;
};

export default function OfferReplyModal({ isOpen, onClose, offer, onUpdate, currentUserId }: OfferReplyModalProps) {
  const [loading, setLoading] = useState(false);
  const [step, setStep] = useState<"view" | "contact">("view");
  const [twitterId, setTwitterId] = useState("");
  const [vrchatId, setVrchatId] = useState("");
  const [selectedContacts, setSelectedContacts] = useState<string[]>([]);

  useEffect(() => {
    if (!isOpen) return;
    setStep("view");
    setSelectedContacts([]);
    if (!currentUserId) return;
    supabase
      .from("profiles")
      .select("twitter_id, vrchat_id")
      .eq("user_id", currentUserId)
      .single()
      .then(({ data }) => {
        if (data) {
          setTwitterId(data.twitter_id || "");
          setVrchatId(data.vrchat_id || "");
        }
      });
  }, [isOpen, currentUserId]);

  if (!isOpen || !offer) return null;

  const toggleContact = (key: string) => {
    setSelectedContacts(prev => prev.includes(key) ? prev.filter(k => k !== key) : [...prev, key]);
  };

  const handleReject = async () => {
    if (!confirm("本当に辞退しますか？")) return;
    setLoading(true);
    try {
      const { error } = await supabase.from("offers").update({ status: "rejected" }).eq("id", offer.id);
      if (error) throw error;
      toast.success("オファーを辞退しました。");
      onUpdate();
      onClose();
    } catch (err: any) {
      toast.error("エラー: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAcceptConfirm = async () => {
    setLoading(true);
    try {
      const { error } = await supabase
        .from("offers")
        .update({ status: "accepted", cast_shared_contacts: selectedContacts })
        .eq("id", offer.id);
      if (error) throw error;
      toast.success("オファーを承諾しました！🎉");
      onUpdate();
      onClose();
    } catch (err: any) {
      toast.error("エラー: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const hasAnyContact = twitterId || vrchatId;

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, width: "100%", height: "100%",
      backgroundColor: "rgba(0,0,0,0.5)", display: "flex", alignItems: "center",
      justifyContent: "center", zIndex: 1000,
    }}>
      <div className="card" style={{ width: "90%", maxWidth: "500px", background: "#fff", padding: "32px", position: "relative" }}>
        <button onClick={onClose} style={{ position: "absolute", top: "16px", right: "16px", background: "none", border: "none", fontSize: "1.5rem", cursor: "pointer" }}>×</button>

        {step === "view" ? (
          <>
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

            {offer.status === "pending" ? (
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <button className="btn" style={{ background: "#eee", color: "#333" }} onClick={handleReject} disabled={loading}>
                  辞退する
                </button>
                <button className="btn btn-primary" onClick={() => setStep("contact")} disabled={loading}>
                  承諾する
                </button>
              </div>
            ) : (
              <div style={{ textAlign: "center", padding: "12px", background: offer.status === "accepted" ? "#d1fae5" : "#f3f4f6", borderRadius: "8px", color: offer.status === "accepted" ? "#065f46" : "#374151", fontWeight: "bold" }}>
                {offer.status === "accepted" ? "✅ このオファーは承諾済みです" : "🚫 このオファーは辞退しました"}
              </div>
            )}
          </>
        ) : (
          <>
            <div style={{ textAlign: "center", marginBottom: "24px" }}>
              <div style={{ fontSize: "2.5rem", marginBottom: "8px" }}>🤝</div>
              <h3 style={{ fontSize: "1.2rem", fontWeight: "bold", marginBottom: "8px" }}>マッチング成立！</h3>
              <p style={{ color: "var(--muted)", fontSize: "0.9rem" }}>主催者に共有する連絡先を選んでください</p>
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
                    border: `2px solid ${selectedContacts.includes("twitter") ? "var(--accent)" : "#ddd"}`,
                    borderRadius: "10px", cursor: "pointer", transition: "border-color 0.15s",
                  }}>
                    <input
                      type="checkbox"
                      checked={selectedContacts.includes("twitter")}
                      onChange={() => toggleContact("twitter")}
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
                    border: `2px solid ${selectedContacts.includes("vrchat") ? "var(--accent)" : "#ddd"}`,
                    borderRadius: "10px", cursor: "pointer", transition: "border-color 0.15s",
                  }}>
                    <input
                      type="checkbox"
                      checked={selectedContacts.includes("vrchat")}
                      onChange={() => toggleContact("vrchat")}
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
              <button className="btn btn-ghost" onClick={() => setStep("view")} disabled={loading}>
                戻る
              </button>
              <button className="btn btn-primary" onClick={handleAcceptConfirm} disabled={loading}>
                {loading ? "処理中..." : selectedContacts.length === 0 ? "共有せずに承諾" : "共有して承諾"}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
