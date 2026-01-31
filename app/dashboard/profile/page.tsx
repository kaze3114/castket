"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { checkUserRestriction } from "@/app/actions/moderate";
import { ROLE_OPTIONS } from "@/lib/constants";

const PLAY_STYLE_OPTIONS = [
  "デスクトップモード",
  "VR (3点トラッキング)",
  "VR (フルトラッキング)",
  "スタンドアロン (Quest/Pico単体)",
  "その他 / 移行中",
];

export default function EditProfilePage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  
  // プロフィール更新用ステート
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompressing, setIsCompressing] = useState(false); // アバター圧縮中フラグ

  // 基本情報ステート
  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState(ROLE_OPTIONS[0].value);
  const [subRole1, setSubRole1] = useState("");
  const [subRole2, setSubRole2] = useState("");
  const [playStyle, setPlayStyle] = useState("");
  const [bio, setBio] = useState("");
  
  // アバター関連
  const [previewUrl, setPreviewUrl] = useState(""); // 表示用URL
  const [avatarFile, setAvatarFile] = useState<File | null>(null); // アップロード待ちファイル
  const originalAvatarUrl = useRef<string>(""); // 元の画像URL（削除用）

  // ポートフォリオ（ギャラリー）関連ステート
  const [portfolioImages, setPortfolioImages] = useState<any[]>([]);
  const [isGalleryUploading, setIsGalleryUploading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setUser(user);

      // 1. プロフィール情報の取得
      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (profile) {
        setDisplayName(profile.display_name || "");
        setRole(profile.role || ROLE_OPTIONS[0].value);
        setSubRole1(profile.sub_role_1 || "");
        setSubRole2(profile.sub_role_2 || "");
        setPlayStyle(profile.play_style || "");
        setBio(profile.bio || "");
        
        const currentUrl = profile.avatar_url || "";
        setPreviewUrl(currentUrl);
        originalAvatarUrl.current = currentUrl;
      }

      // 2. ポートフォリオ画像の取得
      const { data: images } = await supabase
        .from("portfolio_images")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: true });

      if (images) {
        setPortfolioImages(images);
      }

      setLoading(false);
    };

    fetchData();
  }, [router]);

  // 画像削除APIを呼び出す関数
  const deleteImageFromR2 = async (url: string) => {
    if (!url) return;
    try {
      await fetch("/api/delete-image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fileUrl: url }),
      });
      console.log("削除リクエスト送信:", url);
    } catch (e) {
      console.error("古い画像の削除に失敗:", e);
    }
  };

  // R2アップロード処理（共通関数）
  const uploadImageToR2 = async (file: File) => {
    const res = await fetch("/api/upload", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ fileType: file.type }),
    });
    
    if (!res.ok) throw new Error("署名付きURLの取得に失敗しました");
    const { signedUrl, publicUrl } = await res.json();
  
    const uploadRes = await fetch(signedUrl, {
      method: "PUT",
      headers: { "Content-Type": file.type },
      body: file,
    });
  
    if (!uploadRes.ok) throw new Error("アップロードに失敗しました");
  
    return publicUrl;
  };

  // アバター: ファイルを選択しただけ（プレビュー表示のみ、アップロードはまだ）
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    
    const file = e.target.files[0];
    setIsCompressing(true);

    try {
      // ★修正: 自作のユーティリティを動的インポート
      const { compressImage } = await import("@/app/utils/imageCompressor");

      // アバター用に圧縮
      const compressedFile = await compressImage(file, "avatar");

      setAvatarFile(compressedFile);
      const localUrl = URL.createObjectURL(compressedFile);
      setPreviewUrl(localUrl);

    } catch (error) {
      console.error(error);
      alert("画像の読み込みに失敗しました");
    } finally {
      setIsCompressing(false);
    }
  };

  // ギャラリー画像のアップロード（選択即アップロード）
  const handleGalleryUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files || e.target.files.length === 0) return;
    if (portfolioImages.length >= 4) {
      alert("画像は最大4枚までです");
      return;
    }
    
    setIsGalleryUploading(true);
    const file = e.target.files[0];
    
    try {
      // ★修正: 自作のユーティリティを動的インポート
      const { compressImage } = await import("@/app/utils/imageCompressor");

      // ギャラリー用に圧縮
      const compressedFile = await compressImage(file, "gallery");
      
      const publicUrl = await uploadImageToR2(compressedFile);
  
      // DBに保存
      const { data, error } = await supabase
        .from("portfolio_images")
        .insert({
          user_id: user.id,
          image_url: publicUrl
        })
        .select()
        .single();
  
      if (error) throw error;
  
      // 画面に即反映
      setPortfolioImages([...portfolioImages, data]);
  
    } catch (error: any) {
      console.error(error);
      alert("アップロード失敗: " + error.message);
    } finally {
      setIsGalleryUploading(false);
    }
  };
  
  // ギャラリー画像の削除
  const handleDeleteGalleryImage = async (imageId: string, imageUrl: string) => {
    if (!confirm("この画像を削除しますか？")) return;
  
    try {
      // 1. DBから削除
      const { error } = await supabase
        .from("portfolio_images")
        .delete()
        .eq("id", imageId);
  
      if (error) throw error;
  
      // 2. R2から削除
      await deleteImageFromR2(imageUrl);
  
      // 3. 画面から削除
      setPortfolioImages(portfolioImages.filter(img => img.id !== imageId));
  
    } catch (error: any) {
      alert("削除失敗: " + error.message);
    }
  };

  // プロフィール全体の保存処理
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(true);

    try {
      const restriction = await checkUserRestriction(user.id);
      if (!restriction.allowed) throw new Error(restriction.reason);

      let finalAvatarUrl = previewUrl;

      // 新しいアバターファイルがあればアップロード
      if (avatarFile) {
        finalAvatarUrl = await uploadImageToR2(avatarFile);

        // 古い画像の削除処理
        if (originalAvatarUrl.current && originalAvatarUrl.current !== finalAvatarUrl) {
           await deleteImageFromR2(originalAvatarUrl.current);
        }
      }

      // DB更新
      const updates = {
        user_id: user.id,
        display_name: displayName,
        role: role,
        sub_role_1: subRole1,
        sub_role_2: subRole2,
        play_style: playStyle,
        bio: bio,
        avatar_url: finalAvatarUrl,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("profiles")
        .upsert(updates, { onConflict: 'user_id' });

      if (error) throw error;
      
      alert("プロフィールを更新しました！");
      router.push("/dashboard");

    } catch (error: any) {
      console.error(error);
      alert("エラー: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) return <div style={{ padding: "40px", textAlign: "center" }}>読み込み中...</div>;

  return (
    <div className="container" style={{ maxWidth: "600px", marginTop: "40px", paddingBottom: "80px" }}>
      <h1 className="section-title">プロフィール編集</h1>
      <div className="card">
        
        {/* アバター画像エリア */}
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <div style={{ width: "100px", height: "100px", borderRadius: "50%", overflow: "hidden", background: "#eee", margin: "0 auto 12px auto" }}>
            {previewUrl ? <img src={previewUrl} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#aaa" }}>No Image</div>}
          </div>
          <label className="btn btn-ghost" style={{ cursor: isCompressing ? "wait" : "pointer", fontSize: "0.9rem" }}>
            {isCompressing ? "画像処理中..." : "アバターを変更"}
            <input type="file" accept="image/*" onChange={handleFileSelect} style={{ display: "none" }} disabled={isCompressing || isSubmitting} />
          </label>
        </div>

        <form onSubmit={handleUpdate} style={{ display: "grid", gap: "24px" }}>
          
          <div>
            <label className="label-title">表示名 (VRChat IDなど)</label>
            <input className="input-field" type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required placeholder="例: kaze-san"/>
          </div>

          <div>
            <label className="label-title">メインロール (一番やりたいこと) <span style={{color:"red"}}>*</span></label>
            <select className="input-field" value={role} onChange={(e) => setRole(e.target.value)} required>
              {ROLE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
            </select>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div>
              <label className="label-title">サブロール 1</label>
              <select className="input-field" value={subRole1} onChange={(e) => setSubRole1(e.target.value)}>
                <option value="">設定しない</option>
                {ROLE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>
            <div>
              <label className="label-title">サブロール 2</label>
              <select className="input-field" value={subRole2} onChange={(e) => setSubRole2(e.target.value)}>
                <option value="">設定しない</option>
                {ROLE_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="label-title">プレイ環境 (デバイス)</label>
            <select className="input-field" value={playStyle} onChange={(e) => setPlayStyle(e.target.value)}>
              <option value="">未設定</option>
              {PLAY_STYLE_OPTIONS.map(opt => <option key={opt} value={opt}>{opt}</option>)}
            </select>
            <p style={{ fontSize: "0.8rem", color: "var(--muted)", marginTop: "4px" }}>※キャスティングの際に、フルトラッキング対応かどうかが重視される場合があります。</p>
          </div>

          <div>
            <label className="label-title">自己紹介・アピール</label>
            <textarea className="input-field" rows={6} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="活動可能時間や、得意なこと、過去の実績などを書いてみましょう！"/>
          </div>

          {/* ギャラリーエリア */}
          <div style={{ marginTop: "20px", borderTop: "1px solid #eee", paddingTop: "24px" }}>
            <label className="label-title">ポートフォリオ / 活動写真 (最大4枚)</label>
            <p style={{ fontSize: "0.85rem", color: "var(--muted)", marginBottom: "16px" }}>
              あなたの魅力を伝えましょう！
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              {/* 登録済み画像の表示 */}
              {portfolioImages.map((img) => (
                <div key={img.id} style={{ position: "relative", aspectRatio: "16/9", borderRadius: "8px", overflow: "hidden", border: "1px solid #eee" }}>
                  <img src={img.image_url} alt="Portfolio" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                  <button
                    onClick={() => handleDeleteGalleryImage(img.id, img.image_url)}
                    type="button"
                    style={{
                      position: "absolute", top: "4px", right: "4px",
                      background: "rgba(0,0,0,0.6)", color: "#fff", border: "none",
                      borderRadius: "50%", width: "24px", height: "24px", cursor: "pointer",
                      display: "flex", alignItems: "center", justifyContent: "center"
                    }}
                  >
                    ×
                  </button>
                </div>
              ))}

              {/* 追加ボタン (4枚未満のときだけ表示) */}
              {portfolioImages.length < 4 && (
                <label style={{ 
                  border: "2px dashed #ccc", borderRadius: "8px", 
                  display: "flex", alignItems: "center", justifyContent: "center", 
                  aspectRatio: "16/9", cursor: isGalleryUploading ? "wait" : "pointer",
                  color: "#aaa", flexDirection: "column", gap: "4px"
                }}>
                  {isGalleryUploading ? (
                    <span style={{ fontSize: "0.8rem" }}>UP中...</span>
                  ) : (
                    <>
                      <span style={{ fontSize: "1.5rem" }}>+</span>
                      <span style={{ fontSize: "0.8rem" }}>写真を追加</span>
                    </>
                  )}
                  <input 
                    type="file" 
                    accept="image/*" 
                    onChange={handleGalleryUpload} 
                    style={{ display: "none" }} 
                    disabled={isGalleryUploading}
                  />
                </label>
              )}
            </div>
          </div>

          {/* 保存ボタン */}
          <button type="submit" className="btn btn-primary" disabled={isSubmitting || isCompressing} style={{ padding: "16px", fontSize: "1.1rem", marginTop: "24px" }}>
            {isSubmitting ? "保存中..." : "プロフィールを保存して更新"}
          </button>
        </form>
      </div>
      <style jsx>{`
        .label-title { display: block; margin-bottom: 8px; font-weight: bold; color: #333; }
        .input-field { width: 100%; padding: 12px; border: 1px solid #ddd; border-radius: 8px; font-size: 1rem; background: #fff; }
        .input-field:focus { outline: none; border-color: var(--accent); box-shadow: 0 0 0 3px rgba(124, 58, 237, 0.1); }
      `}</style>
    </div>
  );
}