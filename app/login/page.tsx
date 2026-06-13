"use client";

import { useState, useRef, useEffect, UIEvent, Suspense } from "react";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nextPath = searchParams.get("next") ?? "/dashboard";

  const [mode, setMode] = useState<"login" | "signup">("login");
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [oauthLoading, setOauthLoading] = useState<"twitter" | "discord" | null>(null);
  const [message, setMessage] = useState("");

  // 新規登録用
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(false);
  const [isAgreed, setIsAgreed] = useState(false);
  const [isAgeConfirmed, setIsAgeConfirmed] = useState(false);
  const termsRef = useRef<HTMLDivElement>(null);

  // メール/パスワード用
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [emailMode, setEmailMode] = useState<"login" | "signup" | "reset">("login");

  useEffect(() => {
    if (mode === "signup" && termsRef.current) {
      const { scrollHeight, clientHeight } = termsRef.current;
      if (scrollHeight <= clientHeight) setIsScrolledToBottom(true);
    } else {
      setIsScrolledToBottom(false);
      setIsAgreed(false);
      setIsAgeConfirmed(false);
    }
    setShowEmailForm(false);
    setMessage("");
  }, [mode]);

  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight + 10) setIsScrolledToBottom(true);
  };

  const isReadyToSignup = isAgreed && isAgeConfirmed;
  const oauthEnabled = mode === "login" || isReadyToSignup;

  const handleOAuth = async (provider: "twitter" | "discord") => {
    setOauthLoading(provider);
    await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?next=${encodeURIComponent(nextPath)}`,
      },
    });
  };

  const handleEmailAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      if (emailMode === "reset") {
        const { error } = await supabase.auth.resetPasswordForEmail(email, {
          redirectTo: `${window.location.origin}/update-password`,
        });
        if (error) throw error;
        setMessage("パスワード再設定メールを送信しました。");
      } else if (emailMode === "signup") {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) throw error;
        setMessage("登録完了！ダッシュボードに移動します...");
        setTimeout(() => { router.push("/dashboard"); router.refresh(); }, 1500);
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        router.push(nextPath);
        router.refresh();
      }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : "予期しないエラーが発生しました";
      setMessage(`エラー: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)", padding: "40px 16px" }}>
      <div className="card" style={{ width: "100%", maxWidth: "400px" }}>

        {/* ロゴ */}
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <div className="logo-mark" style={{ margin: "0 auto 12px", width: "48px", height: "48px" }}>C</div>
          <h1 className="card-title" style={{ fontSize: "1.5rem" }}>
            {mode === "login" ? "ログイン" : "アカウント登録"}
          </h1>
          <p className="card-text">
            {mode === "login" ? "おかえりなさい！" : "Castketで新しい物語を始めましょう"}
          </p>
        </div>

        {/* モード切替タブ */}
        <div style={{ display: "flex", borderRadius: "8px", overflow: "hidden", border: "1px solid var(--border)", marginBottom: "24px" }}>
          {(["login", "signup"] as const).map(m => (
            <button
              key={m}
              onClick={() => setMode(m)}
              style={{
                flex: 1, padding: "10px", border: "none", cursor: "pointer", fontSize: "0.9rem", fontWeight: "bold",
                background: mode === m ? "var(--accent)" : "#fff",
                color: mode === m ? "#fff" : "var(--muted)",
                transition: "all 0.15s",
              }}
            >
              {m === "login" ? "ログイン" : "新規登録"}
            </button>
          ))}
        </div>

        {/* 新規登録：利用規約 */}
        {mode === "signup" && (
          <div style={{ marginBottom: "20px" }}>
            <label style={{ display: "block", marginBottom: "6px", fontSize: "0.85rem", color: "var(--muted)", fontWeight: "bold" }}>利用規約</label>
            <div
              ref={termsRef}
              onScroll={handleScroll}
              style={{ height: "180px", overflowY: "auto", border: "1px solid var(--border)", borderRadius: "8px", padding: "12px", background: "#f9f9f9", fontSize: "0.78rem", lineHeight: 1.6 }}
            >
              <p><strong>第1条（適用）</strong></p>
              <p>本規約は、ユーザーと本サービス（Castket）の運営者との間の、本サービスの利用に関わる一切の関係に適用されるものとします。</p><br />
              <p><strong>第2条（本サービスの性質と運営の立ち位置）</strong></p>
              <ol style={{ paddingLeft: "20px", margin: "4px 0 0 0" }}>
                <li>本サービスは、VRChat上のイベント主催者とキャスト希望者をマッチングするためのプラットフォームを提供するものです。</li>
                <li>運営は、ユーザー間のマッチング、イベントの実施内容、およびユーザー間のトラブルについて一切の責任を負わないものとします。当事者間で解決するものとします。</li>
              </ol><br />
              <p><strong>第3条（ユーザー登録とアカウント管理）</strong></p>
              <ol style={{ paddingLeft: "20px", margin: "4px 0 0 0" }}>
                <li>本サービスの利用を希望する者は、本規約に同意の上、運営が定める方法により登録を行うものとします。</li>
                <li>本サービスは、18歳以上（高校生を除く）の方のみ利用できるものとします。18歳未満、または高校生の登録が発覚した場合、運営は事前の通知なく直ちにアカウントを削除することができます。</li>
                <li>ユーザーは、自己の責任においてアカウント情報を適切に管理するものとします。アカウントの不正利用によって生じた損害について、運営は一切の責任を負いません。</li>
              </ol><br />
              <p><strong>第4条（禁止事項）</strong></p>
              <ul style={{ paddingLeft: "20px", margin: "4px 0 0 0" }}>
                <li>法令、公序良俗、またはVRChatの利用規約に違反する行為</li>
                <li>運営、他のユーザー、または第三者のサーバーやネットワークの機能を破壊したり、妨害したりする行為</li>
                <li>他のユーザー、または第三者に不利益、損害、不快感を与える行為（誹謗中傷、ハラスメント、荒らし行為を含む）</li>
                <li>本サービスが予定している利用目的と異なる目的で本サービスを利用する行為</li>
                <li>その他、運営が不適切と判断する行為</li>
              </ul><br />
              <p><strong>第5条（コンテンツの取り扱いとモデレーション）</strong></p>
              <ol style={{ paddingLeft: "20px", margin: "4px 0 0 0" }}>
                <li>ユーザーが本サービス上に投稿したコンテンツの責任は、投稿したユーザー自身に帰属します。</li>
                <li>運営は、投稿内容が本規約に違反していると判断した場合、事前通知なく削除やアカウント停止を行うことができます。</li>
              </ol><br />
              <p><strong>第6条（本サービスの提供の停止等）</strong></p>
              <p>運営は、システムの保守、不可抗力により、ユーザーに事前に通知することなく本サービスの全部または一部の提供を停止または中断することができます。</p><br />
              <p><strong>第7条（利用規約の変更）</strong></p>
              <p>運営は、必要と判断した場合には、ユーザーに個別の通知をすることなく本規約を変更することができるものとします。</p><br />
              <p><strong>第8条（金銭のやり取りに関する免責）</strong></p>
              <p>ユーザー間で発生した金銭の授受はすべて当事者間の責任において行われるものとします。運営は金銭トラブルに関して一切の責任を負いません。</p><br />
              <p><strong>第9条（退会とデータの取り扱い）</strong></p>
              <ol style={{ paddingLeft: "20px", margin: "4px 0 0 0" }}>
                <li>ユーザーは、いつでも本サービスから退会することができます。</li>
                <li>退会後のデータは30日間保管され、その後完全に削除されます。</li>
              </ol>
              <p style={{ color: "var(--accent)", fontWeight: "bold", marginTop: "12px", fontSize: "0.78rem" }}>
                ※一番下までスクロールするとチェックボックスが有効になります。
              </p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "10px" }}>
              {[
                { checked: isAgreed, set: setIsAgreed, label: "利用規約を最後まで読み、同意します" },
                { checked: isAgeConfirmed, set: setIsAgeConfirmed, label: "私は18歳以上（高校生を除く）であることを確約します" },
              ].map(({ checked, set, label }) => (
                <label key={label} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.82rem", cursor: isScrolledToBottom ? "pointer" : "not-allowed", opacity: isScrolledToBottom ? 1 : 0.5 }}>
                  <input type="checkbox" disabled={!isScrolledToBottom} checked={checked} onChange={e => set(e.target.checked)} style={{ width: "15px", height: "15px" }} />
                  {label}
                </label>
              ))}
            </div>
          </div>
        )}

        {/* OAuth ボタン */}
        <div style={{ display: "grid", gap: "10px" }}>
          <button
            onClick={() => handleOAuth("twitter")}
            disabled={!oauthEnabled || oauthLoading !== null}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
              width: "100%", padding: "12px", borderRadius: "8px", border: "none",
              background: oauthEnabled ? "#000" : "#ccc", color: "#fff",
              fontSize: "0.95rem", fontWeight: "bold", cursor: oauthEnabled ? "pointer" : "not-allowed",
              transition: "opacity 0.15s", opacity: oauthLoading === "twitter" ? 0.7 : 1,
            }}
          >
            <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
              <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
            </svg>
            {oauthLoading === "twitter" ? "リダイレクト中..." : `X (Twitter) で${mode === "login" ? "ログイン" : "登録"}`}
          </button>

          <button
            onClick={() => handleOAuth("discord")}
            disabled={!oauthEnabled || oauthLoading !== null}
            style={{
              display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
              width: "100%", padding: "12px", borderRadius: "8px", border: "none",
              background: oauthEnabled ? "#5865F2" : "#ccc", color: "#fff",
              fontSize: "0.95rem", fontWeight: "bold", cursor: oauthEnabled ? "pointer" : "not-allowed",
              transition: "opacity 0.15s", opacity: oauthLoading === "discord" ? 0.7 : 1,
            }}
          >
            <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
              <path d="M20.317 4.37a19.791 19.791 0 0 0-4.885-1.515.074.074 0 0 0-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 0 0-5.487 0 12.64 12.64 0 0 0-.617-1.25.077.077 0 0 0-.079-.037A19.736 19.736 0 0 0 3.677 4.37a.07.07 0 0 0-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 0 0 .031.057 19.9 19.9 0 0 0 5.993 3.03.078.078 0 0 0 .084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 0 0-.041-.106 13.107 13.107 0 0 1-1.872-.892.077.077 0 0 1-.008-.128 10.2 10.2 0 0 0 .372-.292.074.074 0 0 1 .077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 0 1 .078.01c.12.098.246.198.373.292a.077.077 0 0 1-.006.127 12.299 12.299 0 0 1-1.873.892.077.077 0 0 0-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 0 0 .084.028 19.839 19.839 0 0 0 6.002-3.03.077.077 0 0 0 .032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 0 0-.031-.03zM8.02 15.33c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.956-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.956 2.418-2.157 2.418zm7.975 0c-1.183 0-2.157-1.085-2.157-2.419 0-1.333.955-2.419 2.157-2.419 1.21 0 2.176 1.096 2.157 2.42 0 1.333-.946 2.418-2.157 2.418z"/>
            </svg>
            {oauthLoading === "discord" ? "リダイレクト中..." : `Discord で${mode === "login" ? "ログイン" : "登録"}`}
          </button>
        </div>

        {mode === "signup" && !isReadyToSignup && (
          <p style={{ textAlign: "center", fontSize: "0.78rem", color: "var(--muted)", marginTop: "8px" }}>
            ※利用規約に同意するとボタンが有効になります
          </p>
        )}

        {/* 区切り */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", margin: "20px 0" }}>
          <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
          <span style={{ fontSize: "0.78rem", color: "var(--muted)" }}>または</span>
          <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
        </div>

        {/* メール折りたたみ */}
        {!showEmailForm ? (
          <button
            onClick={() => { setShowEmailForm(true); setEmailMode(mode === "signup" ? "signup" : "login"); }}
            style={{ width: "100%", padding: "11px", borderRadius: "8px", border: "1px solid var(--border)", background: "#fff", color: "var(--muted)", fontSize: "0.88rem", cursor: "pointer" }}
          >
            メールアドレスで続ける
          </button>
        ) : (
          <form onSubmit={handleEmailAuth} style={{ display: "grid", gap: "12px" }}>
            <div style={{ display: "flex", gap: "8px", fontSize: "0.82rem", justifyContent: "center" }}>
              {(["login", "signup", "reset"] as const).map(m => (
                <button key={m} type="button" onClick={() => setEmailMode(m)}
                  style={{ background: "none", border: "none", cursor: "pointer", color: emailMode === m ? "var(--accent)" : "var(--muted)", fontWeight: emailMode === m ? "bold" : "normal", textDecoration: emailMode === m ? "underline" : "none" }}>
                  {m === "login" ? "ログイン" : m === "signup" ? "新規登録" : "パスワード再設定"}
                </button>
              ))}
            </div>
            <input type="email" required value={email} onChange={e => setEmail(e.target.value)} placeholder="name@example.com"
              style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)", outline: "none" }} />
            {emailMode !== "reset" && (
              <input type="password" required value={password} onChange={e => setPassword(e.target.value)} placeholder="6文字以上"
                style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)", outline: "none" }} />
            )}
            {message && (
              <div style={{ padding: "10px", borderRadius: "8px", background: message.includes("エラー") ? "#ffecec" : "#e8fbf6", color: message.includes("エラー") ? "#ff4757" : "#00b894", fontSize: "0.82rem" }}>
                {message}
              </div>
            )}
            <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: "100%" }}>
              {loading ? "処理中..." : emailMode === "reset" ? "送信する" : emailMode === "signup" ? "登録する" : "ログイン"}
            </button>
          </form>
        )}

        <div style={{ marginTop: "20px", textAlign: "center" }}>
          <Link href="/" style={{ fontSize: "0.8rem", color: "var(--muted)" }}>トップページに戻る</Link>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--muted)" }}>読み込み中...</div>}>
      <LoginForm />
    </Suspense>
  );
}
