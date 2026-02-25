"use client";

import { useState, useRef, useEffect, UIEvent } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  
  const [mode, setMode] = useState<"login" | "signup" | "reset">("login");
  const [message, setMessage] = useState("");

  // ▼ 新規登録用のステート
  const [isScrolledToBottom, setIsScrolledToBottom] = useState(false);
  const [isAgreed, setIsAgreed] = useState(false);
  const [isAgeConfirmed, setIsAgeConfirmed] = useState(false); // 👈 年齢確認用のステートを追加
  const termsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (mode === "signup" && termsRef.current) {
      const { scrollHeight, clientHeight } = termsRef.current;
      if (scrollHeight <= clientHeight) {
        setIsScrolledToBottom(true);
      }
    } else {
      // 画面を切り替えたらチェックをすべて外す
      setIsScrolledToBottom(false);
      setIsAgreed(false);
      setIsAgeConfirmed(false); // 👈 これもリセット
    }
  }, [mode]);

  const handleScroll = (e: UIEvent<HTMLDivElement>) => {
    const { scrollTop, scrollHeight, clientHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight + 10) {
      setIsScrolledToBottom(true);
    }
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      if (mode === "signup") {
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

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/update-password`,
      });
      if (error) throw error;
      setMessage("パスワード再設定メールを送信しました。メールボックスを確認してください。");
      
    } catch (error: any) {      
      setMessage(`エラー: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  const getTitle = () => {
    if (mode === "signup") return "アカウント登録";
    if (mode === "reset") return "パスワード再設定";
    return "ログイン";
  };

  // ▼ 登録できる状態かどうかの判定（両方チェックでtrue）
  const isReadyToSignup = isAgreed && isAgeConfirmed;

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "var(--bg)",
        padding: "40px 16px"
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
            {mode === "signup" && "Castketで新しい物語を始めましょう"}
            {mode === "login" && "おかえりなさい！"}
            {mode === "reset" && "登録したメールアドレスを入力してください"}
          </p>
        </div>

        <form onSubmit={mode === "reset" ? handleResetPassword : handleAuth} style={{ display: "grid", gap: "16px" }}>
          
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

          {mode !== "reset" && (
            <div>
              <div style={{display: "flex", justifyContent: "space-between", marginBottom: "6px"}}>
                <label style={{ fontSize: "0.85rem", color: "var(--muted)" }}>
                  パスワード
                </label>
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

          {mode === "signup" && (
            <div style={{ marginTop: "8px" }}>
              <label style={{ display: "block", marginBottom: "6px", fontSize: "0.85rem", color: "var(--muted)", fontWeight: "bold" }}>
                利用規約
              </label>
              <div 
                ref={termsRef}
                onScroll={handleScroll}
                style={{
                  height: "200px", 
                  overflowY: "auto",
                  border: "1px solid var(--border)",
                  borderRadius: "8px",
                  padding: "12px",
                  backgroundColor: "#f9f9f9",
                  fontSize: "0.8rem",
                  lineHeight: "1.6",
                }}
              >
                <p><strong>第1条（適用）</strong></p>
                <p>本規約は、ユーザーと本サービス（Castket）の運営者との間の、本サービスの利用に関わる一切の関係に適用されるものとします。</p>
                <br />

                <p><strong>第2条（本サービスの性質と運営の立ち位置）</strong></p>
                <ol style={{ paddingLeft: "20px", margin: "4px 0 0 0" }}>
                  <li>本サービスは、VRChat上のイベント主催者とキャスト希望者をマッチングするためのプラットフォームを提供するものです。</li>
                  <li>運営は、ユーザー間のマッチング、イベントの実施内容、およびユーザー間のトラブルについて一切の責任を負わないものとします。当事者間で解決するものとします。</li>
                </ol>
                <br />

                <p><strong>第3条（ユーザー登録とアカウント管理）</strong></p>
                <ol style={{ paddingLeft: "20px", margin: "4px 0 0 0" }}>
                  <li>本サービスの利用を希望する者は、本規約に同意の上、運営が定める方法により登録を行うものとします。</li>
                  <li>本サービスは、18歳以上（高校生を除く）の方のみ利用できるものとします。18歳未満、または高校生の登録が発覚した場合、運営は事前の通知なく直ちにアカウントを削除することができます。</li>
                  <li>ユーザーは、自己の責任においてアカウント情報を適切に管理するものとします。アカウントの不正利用によって生じた損害について、運営は一切の責任を負いません。</li>
                </ol>
                <br />

                <p><strong>第4条（禁止事項）</strong></p>
                <p>ユーザーは、本サービスの利用にあたり、以下の行為をしてはなりません。</p>
                <ul style={{ paddingLeft: "20px", margin: "4px 0 0 0" }}>
                  <li>法令、公序良俗、またはVRChatの利用規約に違反する行為</li>
                  <li>運営、他のユーザー、または第三者のサーバーやネットワークの機能を破壊したり、妨害したりする行為</li>
                  <li>他のユーザー、または第三者に不利益、損害、不快感を与える行為（誹謗中傷、ハラスメント、荒らし行為を含む）</li>
                  <li>本サービスが予定している利用目的と異なる目的で本サービスを利用する行為（出会い目的、ネットワークビジネスや宗教の勧誘など）</li>
                  <li>その他、運営が不適切と判断する行為</li>
                </ul>
                <br />

                <p><strong>第5条（コンテンツの取り扱いとモデレーション）</strong></p>
                <ol style={{ paddingLeft: "20px", margin: "4px 0 0 0" }}>
                  <li>ユーザーが本サービス上に投稿したコンテンツ（プロフィール、イベント情報など）の責任は、投稿したユーザー自身に帰属します。</li>
                  <li>運営は、AI等を利用した自動判定システム、または目視により、投稿内容が本規約に違反している（またはそのおそれがある）と判断した場合、ユーザーに事前の通知をすることなく、該当コンテンツの削除やアカウントの停止・削除を行うことができるものとします。</li>
                </ol>
                <br />

                <p><strong>第6条（本サービスの提供の停止等）</strong></p>
                <p>運営は、システムの保守、不可抗力（サーバーダウン、災害など）により、ユーザーに事前に通知することなく本サービスの全部または一部の提供を停止または中断することができるものとします。これによってユーザーに生じた損害について、運営は一切の責任を負いません。</p>
                <br />

                <p><strong>第7条（利用規約の変更）</strong></p>
                <p>運営は、必要と判断した場合には、ユーザーに個別の通知をすることなく本規約を変更することができるものとします。変更後の規約は、本サービス上に掲示した時点で効力を生じるものとします。</p>
                <br />

                <p><strong>第8条（金銭のやり取りに関する免責）</strong></p>
                <p>ユーザー間で本サービスを通じて、または本サービスを契機として金銭の授受、報酬の支払い等（VRChat内でのギフティングや外部サービスでの決済を含む）が発生した場合、これらはすべて当事者間の責任において行われるものとします。運営は、金銭トラブル、未払い、返金等に関して一切の責任を負わず、いかなる関与も行いません。</p>
                <br />

                <p><strong>第9条（退会とデータの取り扱い）</strong></p>
                <ol style={{ paddingLeft: "20px", margin: "4px 0 0 0" }}>
                  <li>ユーザーは、運営が定める手順に従い、いつでも本サービスから退会することができます。</li>
                  <li>ユーザーが退会した場合、当該ユーザーのプロフィールおよび作成したイベント情報等のデータは、直ちに第三者からの閲覧ができない状態（非公開）となります。</li>
                  <li>退会に伴い非公開となったデータは、トラブル防止および調査の目的で退会日から30日間システム上に保管され、当該期間が経過した後に完全に削除されます。ただし、法令に基づく開示請求がある場合など、運営が保持を必要と判断した場合はこの限りではありません。</li>
                </ol>

                <p style={{ color: "var(--accent)", fontWeight: "bold", marginTop: "12px" }}>
                  ※一番下までスクロールするとチェックボックスが有効になります。
                </p>
              </div>

              {/* ▼ チェックボックス群 ▼ */}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "12px" }}>
                
                {/* 1つ目：規約同意 */}
                <label style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: "8px", 
                  fontSize: "0.85rem",
                  cursor: isScrolledToBottom ? "pointer" : "not-allowed",
                  opacity: isScrolledToBottom ? 1 : 0.6
                }}>
                  <input 
                    type="checkbox" 
                    disabled={!isScrolledToBottom} 
                    checked={isAgreed}
                    onChange={(e) => setIsAgreed(e.target.checked)}
                    style={{ width: "16px", height: "16px", cursor: isScrolledToBottom ? "pointer" : "not-allowed" }}
                  />
                  利用規約を最後まで読み、同意します
                </label>

                {/* 2つ目：年齢確約 */}
                <label style={{ 
                  display: "flex", 
                  alignItems: "center", 
                  gap: "8px", 
                  fontSize: "0.85rem",
                  cursor: isScrolledToBottom ? "pointer" : "not-allowed",
                  opacity: isScrolledToBottom ? 1 : 0.6
                }}>
                  <input 
                    type="checkbox" 
                    disabled={!isScrolledToBottom} 
                    checked={isAgeConfirmed}
                    onChange={(e) => setIsAgeConfirmed(e.target.checked)}
                    style={{ width: "16px", height: "16px", cursor: isScrolledToBottom ? "pointer" : "not-allowed" }}
                  />
                  私は18歳以上（高校生を除く）であることを確約します
                </label>
              </div>
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

          {/* ▼ 登録ボタンの判定を両方に変更 */}
          <button
            type="submit"
            className="btn btn-primary"
            style={{ 
              width: "100%", 
              marginTop: "8px",
              opacity: (mode === "signup" && !isReadyToSignup) ? 0.5 : 1,
              cursor: (mode === "signup" && !isReadyToSignup) ? "not-allowed" : "pointer"
            }}
            disabled={loading || (mode === "signup" && !isReadyToSignup)}
          >
            {loading ? "処理中..." : mode === "signup" ? "同意して登録する" : mode === "reset" ? "送信する" : "ログイン"}
          </button>
        </form>

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