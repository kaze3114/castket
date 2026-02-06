"use client";

import { useState } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import toast from "react-hot-toast";

// ▼ よくある質問のデータ
const FAQ_DATA = [
  {
    id: 1,
    category: "general",
    question: "Castketは無料で使えますか？",
    answer: "はい、基本的な機能はすべて無料でご利用いただけます。イベントの作成、キャストへの応募、プロフィールの公開などに費用はかかりません。"
  },
  {
    id: 2,
    category: "general",
    question: "VRChatのアカウントが必要ですか？",
    answer: "はい、VRChat上でのイベントマッチングを目的としているため、VRChatのアカウントをお持ちであることを前提としています。"
  },
  {
    id: 3,
    category: "cast",
    question: "ポートフォリオ画像が表示されません",
    answer: "プロフィール編集画面から画像をアップロードした後、「保存」ボタンを押し忘れていませんか？ 画像を選択しただけでは保存されませんのでご注意ください。"
  },
  {
    id: 4,
    category: "cast",
    question: "応募したのに返信がきません",
    answer: "主催者の都合により返信が遅れる場合があります。ダッシュボードの「応募したイベント」からステータス（返信待ち・承認・見送り）を確認できます。"
  },
  {
    id: 5,
    category: "organizer",
    question: "イベントの日時を変更したいです",
    answer: "ダッシュボードの「主催イベント」一覧にある「編集」ボタンから、いつでも日時や内容を変更できます。"
  },
  {
    id: 6,
    category: "organizer",
    question: "特定のキャストにオファーを送るには？",
    answer: "キャスト詳細ページの「オファーを送る」ボタンから、ご自身が主催するイベントへの招待を送ることができます。"
  },
];

export default function HelpPage() {
  const [activeCategory, setActiveCategory] = useState<"all" | "general" | "cast" | "organizer">("all");
  const [openItems, setOpenItems] = useState<number[]>([]);

  // お問い合わせフォーム用
  const [contactBody, setContactBody] = useState("");
  const [isSending, setIsSending] = useState(false);

  // アコーディオンの開閉
  const toggleItem = (id: number) => {
    if (openItems.includes(id)) {
      setOpenItems(openItems.filter((item) => item !== id));
    } else {
      setOpenItems([...openItems, id]);
    }
  };

  // フィルタリング
  const filteredFaqs = FAQ_DATA.filter(item => 
    activeCategory === "all" ? true : item.category === activeCategory
  );

  // お問い合わせ送信処理
  const handleSendContact = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contactBody.trim()) return;
    
    setIsSending(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();

      // 以前作成した feedback API を再利用します
      // (もしAPIのルートが違う場合は適宜修正してください)
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user?.id || null, // ログインしていればIDを送る
          category: "contact",       // カテゴリはお問い合わせ
          content: contactBody,
          page_url: window.location.href
        }),
      });

      if (!res.ok) throw new Error("送信に失敗しました");

      toast.success("お問い合わせありがとうございます！\n内容を確認次第、ご連絡いたします。");
      setContactBody("");
    } catch (error) {
      toast.error("送信中にエラーが発生しました。");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <>

      <main className="section section-soft" style={{ minHeight: "100vh" }}>
        <div className="container" style={{ maxWidth: "800px" }}>
          
          <div style={{ textAlign: "center", marginBottom: "40px" }}>
            <h1 className="section-title">ヘルプセンター</h1>
            <p style={{ color: "var(--muted)" }}>
              Castketの使い方や、よくある質問をまとめました。<br/>
              解決しない場合は、ページ下部のフォームよりお問い合わせください。
            </p>
          </div>

          {/* ▼ カテゴリ切り替えタブ ▼ */}
          <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginBottom: "32px", flexWrap: "wrap" }}>
            {[
              { id: "all", label: "すべて" },
              { id: "general", label: "全般" },
              { id: "cast", label: "キャスト向け" },
              { id: "organizer", label: "主催者向け" },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveCategory(tab.id as any)}
                style={{
                  padding: "8px 20px",
                  borderRadius: "99px",
                  border: activeCategory === tab.id ? "2px solid var(--accent)" : "1px solid #ddd",
                  background: activeCategory === tab.id ? "var(--accent)" : "#fff",
                  color: activeCategory === tab.id ? "#fff" : "#666",
                  fontWeight: "bold",
                  cursor: "pointer",
                  transition: "all 0.2s"
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* ▼ FAQリスト (アコーディオン) ▼ */}
          <div style={{ display: "grid", gap: "16px", marginBottom: "60px" }}>
            {filteredFaqs.map((faq) => {
              const isOpen = openItems.includes(faq.id);
              return (
                <div key={faq.id} className="card" style={{ padding: "0", overflow: "hidden", cursor: "pointer" }} onClick={() => toggleItem(faq.id)}>
                  <div style={{ padding: "20px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#fff" }}>
                    <h3 style={{ fontSize: "1rem", fontWeight: "bold", margin: 0, color: "#333" }}>
                      <span style={{ color: "var(--accent)", marginRight: "8px" }}>Q.</span>
                      {faq.question}
                    </h3>
                    <span style={{ transform: isOpen ? "rotate(180deg)" : "rotate(0deg)", transition: "transform 0.2s", color: "#ccc" }}>▼</span>
                  </div>
                  {isOpen && (
                    <div style={{ padding: "20px", background: "#fdfaff", borderTop: "1px solid #eee", lineHeight: 1.6, color: "#555" }}>
                      {faq.answer}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          {/* ▼ お問い合わせフォーム ▼ */}
          <div className="card" style={{ padding: "40px" }}>
            <h2 className="section-lead" style={{ marginBottom: "24px" }}>📩 お問い合わせ</h2>
            <p style={{ marginBottom: "24px", color: "var(--muted)", fontSize: "0.9rem" }}>
              機能の要望やバグ報告、その他ご不明な点はこちらからお送りください。<br/>
              ログイン中の場合、あなたのユーザーIDも一緒に送信されます。
            </p>
            <form onSubmit={handleSendContact}>
              <textarea 
                className="input-field" 
                rows={5} 
                required
                placeholder="お問い合わせ内容をご記入ください..."
                value={contactBody}
                onChange={(e) => setContactBody(e.target.value)}
                style={{ width: "100%", padding: "16px", borderRadius: "8px", border: "1px solid #ddd", marginBottom: "16px", fontFamily: "inherit" }}
              />
              <button 
                type="submit" 
                className="btn btn-primary" 
                disabled={isSending || !contactBody}
                style={{ width: "100%", padding: "14px", fontSize: "1.1rem" }}
              >
                {isSending ? "送信中..." : "送信する"}
              </button>
            </form>
          </div>

        </div>
      </main>
    </>
  );
}