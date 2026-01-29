"use client";

import Link from "next/link";

export default function AuthErrorPage() {
  return (
    <div style={{ padding: "40px", textAlign: "center", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      <h1 style={{ fontSize: "1.5rem", marginBottom: "16px", color: "#ff4757" }}>認証エラーが発生しました</h1>
      <p style={{ color: "#666", marginBottom: "24px" }}>
        ログインやパスワードリセットの処理中に問題が発生しました。<br/>
        リンクの有効期限が切れている可能性があります。
      </p>
      <Link href="/login" className="btn btn-primary">
        ログイン画面に戻る
      </Link>
    </div>
  );
}