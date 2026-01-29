"use client";

import Link from "next/link";
import Image from "next/image";

export default function AuthErrorPage() {
  return (
    <div className="error-container">
      <h1 className="error-title">認証エラーが発生しました</h1>
      
      {/* アニメーションクラス(fade-in)をここにつける */}
      <div className="image-wrapper fade-in">
        <Image
          src="/images/sorry.png"
          alt="ごめんなさい"
          width={250}
          height={250}
          className="soft-circle-image"
          priority
        />
      </div>

      <p className="error-text">
        ログインやパスワードリセットの処理中に問題が発生しました。<br/>
        リンクの有効期限が切れている可能性があります。
      </p>
      
      <Link href="/login" className="btn btn-primary" style={{ padding: "12px 32px" }}>
        ログイン画面に戻る
      </Link>
    </div>
  );
}