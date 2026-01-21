"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [isSignUp, setIsSignUp] = useState(false); // ログインか登録かの切り替えフラグ
  const [message, setMessage] = useState("");

  // ログインまたは登録処理
  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      if (isSignUp) {
        // 新規登録モード
        const { error } = await supabase.auth.signUp({
          email,
          password,
        });
        if (error) throw error;
        setMessage("登録が完了しました！自動的にログインします...");
        // 登録成功したらそのままトップページへ
        setTimeout(() => {
          router.push("/dashboard");
          router.refresh();
        }, 1500);
      } else {
        // ログインモード
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
        setMessage("ログイン成功！");
        // ログイン成功したらトップページへ
        router.push("/dashboard");
        router.refresh();
      }
    } catch (error: any) {
      setMessage(`エラー: ${error.message}`);
    } finally {
      setLoading(false);
    }
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
            {isSignUp ? "アカウント登録" : "ログイン"}
          </h1>
          <p className="card-text">
            {isSignUp
              ? "Castketで新しいリレーションを始めましょう"
              : "おかえりなさい！"}
          </p>
        </div>

        <form onSubmit={handleAuth} style={{ display: "grid", gap: "16px" }}>
          <div>
            <label
              style={{
                display: "block",
                marginBottom: "6px",
                fontSize: "0.85rem",
                color: "var(--muted)",
              }}
            >
              メールアドレス
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "8px",
                border: "1px solid var(--border)",
                outline: "none",
              }}
              placeholder="name@example.com"
            />
          </div>
          <div>
            <label
              style={{
                display: "block",
                marginBottom: "6px",
                fontSize: "0.85rem",
                color: "var(--muted)",
              }}
            >
              パスワード
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{
                width: "100%",
                padding: "10px",
                borderRadius: "8px",
                border: "1px solid var(--border)",
                outline: "none",
              }}
              placeholder="6文字以上で入力"
            />
          </div>

          {message && (
            <div
              style={{
                padding: "10px",
                borderRadius: "8px",
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
            {loading ? "処理中..." : isSignUp ? "登録してはじめる" : "ログイン"}
          </button>
        </form>

        <div
          style={{
            marginTop: "24px",
            textAlign: "center",
            fontSize: "0.85rem",
            color: "var(--muted)",
          }}
        >
          {isSignUp ? "すでにアカウントをお持ちですか？" : "アカウントをお持ちでないですか？"}{" "}
          <button
            type="button"
            onClick={() => setIsSignUp(!isSignUp)}
            style={{
              background: "none",
              border: "none",
              color: "var(--accent)",
              cursor: "pointer",
              fontWeight: "600",
              textDecoration: "underline",
            }}
          >
            {isSignUp ? "ログインへ" : "新規登録へ"}
          </button>
        </div>
        
        <div style={{marginTop: "16px", textAlign: "center"}}>
            <a href="/" style={{fontSize: "0.8rem", color: "var(--muted)"}}>トップページに戻る</a>
        </div>
      </div>
    </div>
  );
}