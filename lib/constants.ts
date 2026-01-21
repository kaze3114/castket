// アプリ全体で使う「ロールの選択肢」をここで一元管理します
export const ROLE_OPTIONS = [
{ value: "Organizer", label: "イベント主催" },
  { value: "Cast",      label: "接客・キャスト" }, // SingerからCastに変更推奨
  { value: "Staff",     label: "運営スタッフ" },   // DJからStaffに変更
  { value: "DJ",        label: "DJ" },            // MusicianからDJに変更
  { value: "Performer", label: "パフォーマー" },   // DancerからPerformerに変更
  { value: "Photographer", label: "カメラマン" },  // PerformerからPhotographerに変更
  { value: "Creator",   label: "クリエイター" },   // StaffからCreatorに変更
  { value: "Tech",      label: "技術・ギミック" }, // CreatorからTechに変更
  { value: "Other",     label: "その他" },
];

// 英語の曜日を日本語に変換する辞書
export const WEEKDAY_MAP: { [key: string]: string } = {
  Sun: "日",
  Mon: "月",
  Tue: "火",
  Wed: "水",
  Thu: "木",
  Fri: "金",
  Sat: "土",
};

// イベントのジャンルタグ
export const EVENT_TAGS = [
  "音楽・ライブ",
  "雑談・交流",
  "ゲーム",
  "ロールプレイ",
  "技術・創作",
  "スキルアップ",
  "その他"
];