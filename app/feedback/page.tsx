"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function FeedbackPage() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  
  // ステップ管理 (1:入力, 2:確認, 3:完了)
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // フォームデータ
  const [category, setCategory] = useState("機能リクエスト");
  const [content, setContent] = useState("");
  const [pageUrl, setPageUrl] = useState("");

  useEffect(() => {
    const init = async () => {
      // 1. ログインチェック
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        // ログインしていなければログイン画面へ飛ばす（またはトップへ）
        router.push("/login");
        return;
      }
      setUser(user);

      // 2. 直前のURLを取得（リファラーがあれば。なければ今のURL）
      setPageUrl(document.referrer || window.location.href);
      
      setLoading(false);
    };
    init();
  }, [router]);

const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      // ★修正: 直接Supabaseではなく、自作APIを呼ぶ
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user_id: user.id,
          category: category,
          content: content,
          page_url: pageUrl,
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "送信に失敗しました");
      }

      setStep(3); // 完了画面へ（ユーザーには成功したように見える）

    } catch (error: any) {
      alert("エラーが発生しました: " + error.message);
      setIsSubmitting(false);
    }
  };

  if (loading) return <div style={{ padding: "40px", textAlign: "center" }}>読み込み中...</div>;

  return (
    <div className="container" style={{ maxWidth: "600px", marginTop: "60px", paddingBottom: "80px" }}>
      <h1 className="section-title">フィードバック</h1>
      
      <div className="card">
        {/* === ステップ1: 入力画面 === */}
        {step === 1 && (
          <div>
            <p style={{ color: "var(--muted)", marginBottom: "24px", fontSize: "0.9rem" }}>
              Castketをご利用いただきありがとうございます。<br/>
              サービス改善のため、気になった点やご要望をぜひお聞かせください。
            </p>

            <div style={{ marginBottom: "20px" }}>
              <label className="label-title">カテゴリ</label>
              <select 
                className="input-field" 
                value={category} 
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="機能リクエスト">✨ 機能リクエスト (こうして欲しい)</option>
                <option value="バグ・不具合">🐛 バグ・不具合の報告</option>
                <option value="感想・応援">📣 感想・応援メッセージ</option>
                <option value="その他">🤔 その他</option>
              </select>
            </div>

            <div style={{ marginBottom: "24px" }}>
              <label className="label-title">内容</label>
              <textarea 
                className="input-field" 
                rows={8} 
                value={content} 
                onChange={(e) => setContent(e.target.value)}
                placeholder="具体的な内容をご記入ください..."
                required
              />
            </div>

            <button 
              className="btn btn-primary" 
              style={{ width: "100%", padding: "14px" }}
              disabled={!content.trim()}
              onClick={() => setStep(2)}
            >
              確認画面へ
            </button>
          </div>
        )}

        {/* === ステップ2: 確認画面 (プレビュー) === */}
        {step === 2 && (
          <div>
            <h2 style={{ fontSize: "1.1rem", marginBottom: "16px", borderBottom: "1px solid #eee", paddingBottom: "8px" }}>送信内容の確認</h2>
            
            <div style={{ marginBottom: "20px" }}>
              <div style={{ fontSize: "0.85rem", color: "var(--muted)" }}>カテゴリ</div>
              <div style={{ fontWeight: "bold", padding: "8px 0" }}>{category}</div>
            </div>

            <div style={{ marginBottom: "24px" }}>
              <div style={{ fontSize: "0.85rem", color: "var(--muted)" }}>内容</div>
              <div style={{ whiteSpace: "pre-wrap", background: "#f9f9f9", padding: "16px", borderRadius: "8px", marginTop: "8px" }}>
                {content}
              </div>
            </div>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "16px" }}>
              <button 
                className="btn btn-ghost" 
                onClick={() => setStep(1)}
                disabled={isSubmitting}
              >
                修正する
              </button>
              <button 
                className="btn btn-primary" 
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? "送信中..." : "この内容で送信する"}
              </button>
            </div>
          </div>
        )}

        {/* === ステップ3: 完了画面 === */}
        {step === 3 && (
          <div style={{ textAlign: "center", padding: "40px 0" }}>
            <div style={{ fontSize: "3rem", marginBottom: "16px" }}>📬</div>
            <h2 style={{ fontSize: "1.5rem", marginBottom: "16px" }}>送信完了</h2>
            <p style={{ color: "var(--muted)", marginBottom: "32px" }}>
              貴重なご意見ありがとうございます！<br/>
              今後の開発の参考にさせていただきます。
            </p>
            <button 
              className="btn btn-primary" 
              onClick={() => router.push("/dashboard")}
            >
              ダッシュボードへ戻る
            </button>
          </div>
        )}

      </div>
      
      <style jsx>{`
        .label-title { display: block; margin-bottom: 8px; font-weight: bold; color: #333; }
        .input-field { width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 1rem; background: #fff; }
        .input-field:focus { outline: none; border-color: var(--accent); box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1); }
      `}</style>
    </div>
  );
}