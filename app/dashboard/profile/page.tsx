"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { checkUserRestriction } from "@/app/actions/moderate";
import imageCompression from "browser-image-compression";
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
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const [displayName, setDisplayName] = useState("");
  const [role, setRole] = useState(ROLE_OPTIONS[0].value);
  const [subRole1, setSubRole1] = useState("");
  const [subRole2, setSubRole2] = useState("");
  const [playStyle, setPlayStyle] = useState("");
  const [bio, setBio] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setUser(user);

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", user.id)
        .single();

      if (profile) {
        setDisplayName(profile.display_name || "");
        // 既存のデータがあればそれを使う。無ければデフォルト
        setRole(profile.role || ROLE_OPTIONS[0].value);
        setSubRole1(profile.sub_role_1 || "");
        setSubRole2(profile.sub_role_2 || "");
        setPlayStyle(profile.play_style || "");
        setBio(profile.bio || "");
        setAvatarUrl(profile.avatar_url || "");
      }
      setLoading(false);
    };

    fetchProfile();
  }, [router]);

  // 更新処理など（変更なし、省略）
  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(true);

    try {
      const restriction = await checkUserRestriction(user.id);
      if (!restriction.allowed) throw new Error(restriction.reason);

      const updates = {
        user_id: user.id,
        display_name: displayName,
        role: role,
        sub_role_1: subRole1,
        sub_role_2: subRole2,
        play_style: playStyle,
        bio: bio,
        avatar_url: avatarUrl,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("profiles")
        .upsert(updates, { onConflict: 'user_id' });

      if (error) throw error;
      alert("プロフィールを更新しました！");
      router.push("/dashboard");
    } catch (error: any) {
      alert("エラー: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    // 省略（以前のコードと同じ、圧縮＆upsert処理）
    if (!e.target.files || e.target.files.length === 0) return;
    setIsUploading(true);
    const file = e.target.files[0];
    const options = { maxSizeMB: 0.5, maxWidthOrHeight: 500, useWebWorker: true };
    try {
      let uploadFile = file;
      try { uploadFile = await imageCompression(file, options); } catch(e){ console.error(e) }
      
      const { data: oldFiles } = await supabase.storage.from("avatars").list("", { search: user.id + "-" });
      if (oldFiles && oldFiles.length > 0) {
        const filesToRemove = oldFiles.map((x) => x.name);
        await supabase.storage.from("avatars").remove(filesToRemove);
      }

      const fileExt = file.name.split('.').pop();
      const filePath = `${user.id}/avatar.${fileExt}`; 

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, uploadFile, { upsert: true });

      if (uploadError) throw uploadError;

      const { data } = supabase.storage.from('avatars').getPublicUrl(filePath);
      const publicUrlWithTimestamp = `${data.publicUrl}?t=${new Date().getTime()}`;
      setAvatarUrl(publicUrlWithTimestamp);
    } catch (error: any) {
      console.error(error);
      alert('画像アップロードエラー: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  if (loading) return <div style={{ padding: "40px", textAlign: "center" }}>読み込み中...</div>;

  return (
    <div className="container" style={{ maxWidth: "600px", marginTop: "40px", paddingBottom: "80px" }}>
      <h1 className="section-title">プロフィール編集</h1>
      <div className="card">
        {/* アバター画像エリア (省略) */}
        <div style={{ textAlign: "center", marginBottom: "24px" }}>
          <div style={{ width: "100px", height: "100px", borderRadius: "50%", overflow: "hidden", background: "#eee", margin: "0 auto 12px auto" }}>
            {avatarUrl ? <img src={avatarUrl} alt="Avatar" style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "#aaa" }}>No Image</div>}
          </div>
          <label className="btn btn-ghost" style={{ cursor: isUploading ? "wait" : "pointer", fontSize: "0.9rem" }}>
            {isUploading ? "処理中..." : "画像を変更"}
            <input type="file" accept="image/*" onChange={handleAvatarUpload} style={{ display: "none" }} disabled={isUploading} />
          </label>
        </div>

        <form onSubmit={handleUpdate} style={{ display: "grid", gap: "24px" }}>
          <div>
            <label className="label-title">表示名 (VRChat IDなど)</label>
            <input className="input-field" type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} required placeholder="例: kaze-san"/>
          </div>

          {/* ▼▼▼ ROLE_OPTIONS を使ってプルダウン生成 ▼▼▼ */}
<div>
            <label className="label-title">メインロール (一番やりたいこと) <span style={{color:"red"}}>*</span></label>
            <select 
              className="input-field" 
              value={role} 
              onChange={(e) => setRole(e.target.value)} 
              required
            >
              {ROLE_OPTIONS.map(opt => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div>
              <label className="label-title">サブロール 1</label>
              <select className="input-field" value={subRole1} onChange={(e) => setSubRole1(e.target.value)}>
                <option value="">設定しない</option>
                {/* サブロールも同様に英語IDで保存 */}
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

          <button type="submit" className="btn btn-primary" disabled={isSubmitting || isUploading} style={{ padding: "16px", fontSize: "1.1rem" }}>
            {isSubmitting ? "更新中..." : "プロフィールを保存して更新"}
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