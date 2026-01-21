"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import imageCompression from "browser-image-compression"; // 圧縮ライブラリをインポート

export default function EventBannerUpload({ userId, url, onUpload }: { userId: string, url: string, onUpload: (url: string) => void }) {
  const [uploading, setUploading] = useState(false);

  const uploadBanner = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error("画像を選択してください");
      }

      const file = event.target.files[0];

      // ▼▼▼ 圧縮設定（フルHDサイズ、最大1MB） ▼▼▼
      const options = {
        maxSizeMB: 1,
        maxWidthOrHeight: 1920,
        useWebWorker: true,
      };

      // 圧縮を実行
      const compressedFile = await imageCompression(file, options);
      // ▲▲▲ 圧縮完了 ▲▲▲

      // ファイル名をランダムにして重複を防ぐ
      const fileExt = file.name.split(".").pop();
      const fileName = `${userId}/${Math.random()}.${fileExt}`;
      const filePath = `${fileName}`;

      // 'events' バケットにアップロード（圧縮後のファイルを使用）
      const { error: uploadError } = await supabase.storage
        .from("event-banners") // ※もしバケット名が違う場合はここを修正してください
        .upload(filePath, compressedFile);

      if (uploadError) {
        throw uploadError;
      }

      // 公開URLを取得
      const { data } = supabase.storage.from("event-banners").getPublicUrl(filePath);
      
      onUpload(data.publicUrl);
    } catch (error: any) {
      alert("アップロードエラー: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ marginBottom: "16px" }}>
      {/* プレビュー表示エリア */}
      <div style={{ 
        width: "100%", 
        aspectRatio: "16/9", 
        backgroundColor: "#f0f0f0", 
        borderRadius: "8px", 
        overflow: "hidden", 
        marginBottom: "8px",
        position: "relative",
        border: "1px solid #ddd",
        display: "flex",
        alignItems: "center",
        justifyContent: "center"
      }}>
        {url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img 
            src={url} 
            alt="Event Banner" 
            style={{ width: "100%", height: "100%", objectFit: "cover" }} 
          />
        ) : (
          <span style={{ color: "#aaa", fontSize: "0.9rem", fontWeight: "bold" }}>NO IMAGE</span>
        )}
        
        {uploading && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,0.7)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span>圧縮＆UP中...</span>
          </div>
        )}
      </div>

      <div style={{ textAlign: "right" }}>
        <label className="btn btn-secondary" style={{ cursor: "pointer", fontSize: "0.85rem", padding: "4px 12px" }}>
          {uploading ? "処理中..." : "🖼 画像を変更"}
          <input
            type="file"
            accept="image/*"
            onChange={uploadBanner}
            disabled={uploading}
            style={{ display: "none" }}
          />
        </label>
      </div>
    </div>
  );
}