"use client";

import { useState } from "react";
import { supabase } from "@/lib/supabase";
import imageCompression from "browser-image-compression";
import toast from "react-hot-toast";

// ↓ userIdを受け取るように変更されているか確認！
type Props = {
  userId: string;
  url: string | null;
  onUpload: (url: string) => void;
};

export default function AvatarUpload({ userId, url, onUpload }: Props) {
  const [uploading, setUploading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(url);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      setUploading(true);

      if (!event.target.files || event.target.files.length === 0) {
        throw new Error("画像を選択してください。");
      }

      const originalFile = event.target.files[0];

      // 圧縮設定
      const options = {
        maxSizeMB: 0.1,
        maxWidthOrHeight: 500,
        useWebWorker: true,
        fileType: "image/jpeg"
      };

      let compressedFile;
      try {
        compressedFile = await imageCompression(originalFile, options);
      } catch (error) {
        console.error("圧縮失敗", error);
        compressedFile = originalFile;
      }

      // 【重要】ここが修正ポイント！
      // ランダムな名前ではなく、ユーザーIDを使った固定の名前にする
      const filePath = `${userId}/avatar.jpg`;

      // 上書き許可 (upsert: true) でアップロード
      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, compressedFile, {
          upsert: true, 
        });

      if (uploadError) {
        throw uploadError;
      }

      // 公開URLを取得
      const { data } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);
      
      // キャッシュ対策で時刻をつける
      const publicUrl = `${data.publicUrl}?t=${Date.now()}`;

      setPreviewUrl(publicUrl);
      onUpload(publicUrl);

    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px" }}>
      <div
        style={{
          width: "100px",
          height: "100px",
          borderRadius: "50%",
          overflow: "hidden",
          background: "var(--bg)",
          border: "2px solid var(--border)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          position: "relative",
        }}
      >
        {previewUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={previewUrl}
            alt="Avatar"
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        ) : (
          <span style={{ color: "var(--muted)", fontSize: "2rem" }}>?</span>
        )}
        {uploading && (
          <div style={{ position: "absolute", inset: 0, background: "rgba(255,255,255,0.7)", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <span style={{ fontSize: "0.8rem", fontWeight: "bold", color: "var(--accent)" }}>UP中...</span>
          </div>
        )}
      </div>

      <div>
        <label className="btn btn-secondary" style={{ cursor: "pointer", fontSize: "0.8rem", padding: "6px 12px" }}>
          {uploading ? "処理中..." : "画像を変更"}
          <input
            type="file"
            accept="image/*"
            onChange={handleFileChange}
            disabled={uploading}
            style={{ display: "none" }}
          />
        </label>
      </div>
    </div>
  );
}