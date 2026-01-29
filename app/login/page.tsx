"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  
  // モード管理: "login" | "signup" | "reset"
  const [mode, setMode] = useState<"login" | "signup" | "reset">("login");
  
  const [message, setMessage] = useState("");

  // 認証処理 (ログイン / 登録)
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      if (mode === "signup") {
        // 新規登録
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setMessage("登録が完了しました！自動的にログインします...");
        setTimeout(() => {
          router.push("/dashboard");
          router.refresh();
        }, 1500);

      } else {
        // ログイン
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        setMessage("ログイン成功！");
        router.push("/dashboard");
        router.refresh();
      }
    } catch (error: any) {
      setMessage(`エラー: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // パスワードリセットメール送信処理
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      // 这里的URLは、後で作る「パスワード変更画面」への経由地です
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/callback?next=/update-password`,
      });
      
      if (error) throw error;
      setMessage("パスワード再設定メールを送信しました。メールボックスを確認してください。");
      
    } catch (error: any) {
      setMessage(`エラー: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  // タイトルの切り替え
  const getTitle = () => {
    if (mode === "signup") return "アカウント登録";
    if (mode === "reset") return "パスワード再設定";
    return "ログイン";
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg)",
      }}
    >
      <div className="card" style={{ width: "100%", maxWidth: "400px" }}>
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <div
            className="logo-mark"
            style={{ margin: "0 auto 12px", width: "48px", height: "48px" }}
          >
            C
          </div>
          <h1 className="card-title" style={{ fontSize: "1.5rem" }}>
            {getTitle()}
          </h1>
          <p className="card-text">
            {mode === "signup" && "Castketで新しいリレーションを始めましょう"}
            {mode === "login" && "おかえりなさい！"}
            {mode === "reset" && "登録したメールアドレスを入力してください"}
          </p>
        </div>

        {/* --- フォームエリア --- */}
        <form onSubmit={mode === "reset" ? handleResetPassword : handleAuth} style={{ display: "grid", gap: "16px" }}>
          
          {/* メールアドレス (全モードで共通) */}
          <div>
            <label style={{ display: "block", marginBottom: "6px", fontSize: "0.85rem", color: "var(--muted)" }}>
              メールアドレス
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: "100%", padding: "10px", borderRadius: "8px",
                border: "1px solid var(--border)", outline: "none",
              }}
              placeholder="name@example.com"
            />
          </div>

          {/* パスワード (リセットモード以外で表示) */}
          {mode !== "reset" && (
            <div>
              <div style={{display: "flex", justifyContent: "space-between", marginBottom: "6px"}}>
                <label style={{ fontSize: "0.85rem", color: "var(--muted)" }}>
                  パスワード
                </label>
                {/* ログインモードの時だけ「忘れた場合」を表示 */}
                {mode === "login" && (
                  <button
                    type="button"
                    onClick={() => { setMode("reset"); setMessage(""); }}
                    style={{ background: "none", border: "none", color: "var(--accent)", fontSize: "0.8rem", cursor: "pointer" }}
                  >
                    パスワードを忘れた場合
                  </button>
                )}
              </div>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: "100%", padding: "10px", borderRadius: "8px",
                  border: "1px solid var(--border)", outline: "none",
                }}
                placeholder="6文字以上で入力"
              />
            </div>
          )}

          {message && (
            <div
              style={{
                padding: "10px", borderRadius: "8px",
                background: message.includes("エラー") ? "#ffecec" : "#e8fbf6",
                color: message.includes("エラー") ? "#ff4757" : "#00b894",
                fontSize: "0.85rem",
              }}
            >
              {message}
            </div>
          )}

          <button
            type="submit"
            className="btn btn-primary"
            style={{ width: "100%", marginTop: "8px" }}
            disabled={loading}
          >
            {loading ? "処理中..." : mode === "signup" ? "登録してはじめる" : mode === "reset" ? "送信する" : "ログイン"}
          </button>
        </form>

        {/* --- モード切り替えリンク --- */}
        <div style={{ marginTop: "24px", textAlign: "center", fontSize: "0.85rem", color: "var(--muted)" }}>
          {mode === "reset" ? (
            <button
              type="button"
              onClick={() => { setMode("login"); setMessage(""); }}
              style={{ background: "none", border: "none", color: "var(--accent)", cursor: "pointer", fontWeight: "600", textDecoration: "underline" }}
            >
              ログイン画面に戻る
            </button>
          ) : (
            <>
              {mode === "signup" ? "すでにアカウントをお持ちですか？" : "アカウントをお持ちでないですか？"}{" "}
              <button
                type="button"
                onClick={() => { setMode(mode === "signup" ? "login" : "signup"); setMessage(""); }}
                style={{ background: "none", border: "none", color: "var(--accent)", cursor: "pointer", fontWeight: "600", textDecoration: "underline" }}
              >
                {mode === "signup" ? "ログインへ" : "新規登録へ"}
              </button>
            </>
          )}
        </div>
        
        <div style={{marginTop: "16px", textAlign: "center"}}>
            <a href="/" style={{fontSize: "0.8rem", color: "var(--muted)"}}>トップページに戻る</a>
        </div>
      </div>
    </div>
  );
}