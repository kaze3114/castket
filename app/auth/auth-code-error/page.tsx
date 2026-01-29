"use client";

import Link from "next/link";
import Image from "next/image";

export default function AuthErrorPage() {
  return (
    <div className="error-container">
      <h1 className="error-title">認証エラーが発生しました</h1>
      
      {/* ▼▼▼ 画像を追加 ▼▼▼ */}
      <div className="image-wrapper fade-in">
        <Image
          src="/images/sorry.png" // public/images/sorry.png を読み込む
          alt="ごめんなさい"
          width={250}  // 表示サイズはお好みで調整してください
          height={250}
          className="soft-circle-image"
          priority // すぐに表示する設定
        />
      </div>

      <p className="error-text">
        ログインやパスワードリセットの処理中に問題が発生しました。<br/>
        リンクの有効期限が切れている可能性があります。
      </p>
      <Link href="/login" className="btn btn-primary go-back-btn">
        ログイン画面に戻る
      </Link>

      {/* ▼▼▼ CSSスタイリング ▼▼▼ */}
      <style jsx>{`
        .error-container {
          padding: 40px;
          text-align: center;
          min-height: 100vh;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          background: var(--bg); /* 背景色も少し考慮 */
        }
        .error-title {
          font-size: 1.5rem;
          margin-bottom: 24px;
          color: #ff4757;
        }
        .error-text {
          color: var(--muted);
          margin-bottom: 32px;
          line-height: 1.6;
        }
        .image-wrapper {
          margin-bottom: 24px;
          /* 画像の周りに少し光彩をつけて、よりぼんやり感を強調 */
          filter: drop-shadow(0 0 15px rgba(255, 255, 255, 0.8));
        }

        /* ★ここがポイント！画像を丸くぼんやりさせるCSS★ */
        .soft-circle-image {
          border-radius: 50%; /* 丸くする */
          object-fit: cover;  /* 正方形にトリミング */
          
          /* 円形のグラデーションマスクをかけてエッジを透明にする技 */
          /* 中心(black)から外側(transparent)に向かってフワッと消える */
          -webkit-mask-image: radial-gradient(circle at center, black 40%, transparent 70%);
          mask-image: radial-gradient(circle at center, black 40%, transparent 70%);
        }

        .go-back-btn {
            padding: 12px 32px;
        }

        /* ふわっと表示させるアニメーション */
        .fade-in {
            animation: fadeIn 1s ease-out;
        }
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}