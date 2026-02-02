"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      // パスワードを更新する
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) throw error;

      toast.success("パスワードを変更しました！");
      router.push("/dashboard");
      router.refresh();

    } catch (error: any) {
      setMessage(`エラー: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg)" }}>
      <div className="card" style={{ width: "100%", maxWidth: "400px" }}>
        <h1 className="card-title" style={{ textAlign: "center" }}>新しいパスワードの設定</h1>
        <p className="card-text" style={{ textAlign: "center", marginBottom: "24px" }}>
          新しいパスワードを入力してください。
        </p>

        <form onSubmit={handleUpdate}>
          <div style={{ marginBottom: "16px" }}>
            <label style={{ display: "block", marginBottom: "6px", fontSize: "0.85rem", color: "var(--muted)" }}>
              新しいパスワード
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="6文字以上で入力"
              style={{ width: "100%", padding: "10px", borderRadius: "8px", border: "1px solid var(--border)" }}
            />
          </div>

          {message && <div style={{ color: "red", fontSize: "0.85rem", marginBottom: "16px" }}>{message}</div>}

          <button type="submit" className="btn btn-primary" style={{ width: "100%" }} disabled={loading}>
            {loading ? "変更中..." : "パスワードを変更する"}
          </button>
        </form>
      </div>
    </div>
  );
}