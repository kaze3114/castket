"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import Link from "next/link";
import { useRouter } from "next/navigation";
import EventBannerUpload from "@/components/EventBannerUpload";
import { EVENT_TAGS } from "@/lib/constants";
// ↓ ここで checkImageSafety も一緒に読み込むように修正しています！
import { checkContentSafety, checkImageSafety } from "@/app/actions/moderate";

const WEEKDAYS = [
  { val: "Sun", label: "日" },
  { val: "Mon", label: "月" },
  { val: "Tue", label: "火" },
  { val: "Wed", label: "水" },
  { val: "Thu", label: "木" },
  { val: "Fri", label: "金" },
  { val: "Sat", label: "土" },
];

export default function MyEventsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [myEvents, setMyEvents] = useState<any[]>([]);

  // フォーム入力用
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [requirements, setRequirements] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [privateInfo, setPrivateInfo] = useState("");
  const [capacity, setCapacity] = useState(""); 

  const [isSubmitting, setIsSubmitting] = useState(false);

  // 日時・スケジュール設定用
  const [scheduleType, setScheduleType] = useState("one_time");
  const [startTime, setStartTime] = useState("");
  const [endTime, setEndTime] = useState("");
  const [singleDate, setSingleDate] = useState("");
  const [selectedWeekdays, setSelectedWeekdays] = useState<string[]>([]);
  const [irregularDatesText, setIrregularDatesText] = useState("");

  useEffect(() => {
    const fetchData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }
      setUser(user);

      const { data } = await supabase
        .from("events")
        .select("*")
        .eq("organizer_id", user.id)
        .order("created_at", { ascending: false });

      if (data) setMyEvents(data);
      setLoading(false);
    };
    fetchData();
  }, [router]);

  const handleTagChange = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleWeekdayChange = (day: string) => {
    if (selectedWeekdays.includes(day)) {
      setSelectedWeekdays(selectedWeekdays.filter(d => d !== day));
    } else {
      setSelectedWeekdays([...selectedWeekdays, day]);
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setIsSubmitting(true);

    try {
      // ▼▼▼ AIチェック開始 ▼▼▼
      
      // 1. テキストチェック
      const contentToCheck = `タイトル: ${title}\n詳細: ${description}\n要項: ${requirements}`;
      
      // user.id を渡してチェック（クールダウン判定のため）
      const textCheckResult = await checkContentSafety(contentToCheck, user.id);

      // 変数名を textCheckResult に統一
      if (!textCheckResult.isSafe) {
        alert(`【登録エラー】\n${textCheckResult.reason}`);
        setIsSubmitting(false);
        return; 
      }

      // 2. 画像チェック
      if (bannerUrl) {
        // 画像がある場合のみチェック
        const imageCheckResult = await checkImageSafety(bannerUrl, user.id);
        
        if (!imageCheckResult.isSafe) {
          alert(`【登録エラー】\n${imageCheckResult.reason}`);
          setIsSubmitting(false);
          return; 
        }
      }
      // ▲▲▲ AIチェック終了 ▲▲▲

      let irregularDatesArray: string[] = [];
      if (scheduleType === "irregular") {
        irregularDatesArray = irregularDatesText
          .split(/,|\n/)
          .map(d => d.trim())
          .filter(d => d !== "");
      }

      const { error } = await supabase
        .from("events")
        .insert({
          organizer_id: user.id,
          title: title,
          description: description,
          requirements: requirements,
          banner_url: bannerUrl,
          tags: selectedTags,
          private_info: privateInfo,
          capacity: capacity ? parseInt(capacity) : null,
          schedule_type: scheduleType,
          start_time: startTime || null,
          end_time: endTime || null,
          event_date: scheduleType === "one_time" ? singleDate : null,
          weekdays: scheduleType === "weekly" ? selectedWeekdays : null,
          irregular_dates: scheduleType === "irregular" ? irregularDatesArray : null,
        });

      if (error) throw error;

      alert("イベントを登録しました！");
      window.location.reload(); 

    } catch (error: any) {
      alert("エラー: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("本当にこのイベントを削除しますか？")) return;
    const { error } = await supabase.from("events").delete().eq("id", id);
    if (!error) setMyEvents(myEvents.filter((e) => e.id !== id));
  };

  return (
    <>
      <header className="site-header">
        <div className="container header-inner">
          <Link href="/dashboard" className="logo-wrap" style={{ textDecoration: 'none' }}>
            <div className="logo-mark">C</div>
            <div className="logo-text-block">
              <div className="logo-text-main">Castket</div>
              <div className="logo-text-sub">Event Manager</div>
            </div>
          </Link>
          <div className="header-actions">
            <Link href="/dashboard" className="btn btn-ghost">← ダッシュボードに戻る</Link>
          </div>
        </div>
      </header>

      <main className="section section-soft" style={{ minHeight: "100vh" }}>
        <div className="container">
          <h1 className="section-title" style={{ textAlign: "left", marginBottom: "32px" }}>イベント管理</h1>

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px", alignItems: "start" }}>
            
            {/* 左側：新規作成フォーム */}
            <div className="card">
              <h2 className="card-title">新規イベント作成</h2>
              <form onSubmit={handleCreateEvent} style={{ display: "grid", gap: "16px", marginTop: "16px" }}>
                
                <div>
                  <label className="label-bold">イベントバナー画像</label>
                  <EventBannerUpload 
                    userId={user?.id || ""}
                    url={bannerUrl}
                    onUpload={(url) => setBannerUrl(url)}
                  />
                </div>

                <div>
                  <label className="label-bold">イベント名</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="例: Bar Noxtella"
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="label-bold">募集人数 (定員)</label>
                  <input
                    type="number"
                    min="1"
                    value={capacity}
                    onChange={(e) => setCapacity(e.target.value)}
                    placeholder="空欄の場合は「無制限」になります"
                    className="input-field"
                  />
                </div>

                <div>
                  <label className="label-bold">ジャンルタグ (複数選択可)</label>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
                    {EVENT_TAGS.map((tag) => (
                      <label key={tag} style={{ 
                        padding: "6px 12px", 
                        borderRadius: "99px", 
                        border: "1px solid var(--border)",
                        fontSize: "0.85rem",
                        cursor: "pointer",
                        background: selectedTags.includes(tag) ? "var(--accent)" : "#fff",
                        color: selectedTags.includes(tag) ? "#fff" : "var(--text)",
                        transition: "all 0.2s"
                      }}>
                        <input 
                          type="checkbox" 
                          value={tag} 
                          checked={selectedTags.includes(tag)} 
                          onChange={() => handleTagChange(tag)}
                          style={{ display: "none" }} 
                        />
                        {tag}
                      </label>
                    ))}
                  </div>
                </div>

                <div style={{ background: "var(--bg)", padding: "16px", borderRadius: "8px" }}>
                  <label className="label-bold">開催スケジュール</label>
                  <div style={{ display: "flex", gap: "12px", marginBottom: "16px" }}>
                    <label style={{ display: "flex", alignItems: "center", gap: "4px", cursor: "pointer" }}><input type="radio" name="type" value="one_time" checked={scheduleType === "one_time"} onChange={(e) => setScheduleType(e.target.value)} /> 単発</label>
                    <label style={{ display: "flex", alignItems: "center", gap: "4px", cursor: "pointer" }}><input type="radio" name="type" value="weekly" checked={scheduleType === "weekly"} onChange={(e) => setScheduleType(e.target.value)} /> 毎週</label>
                    <label style={{ display: "flex", alignItems: "center", gap: "4px", cursor: "pointer" }}><input type="radio" name="type" value="irregular" checked={scheduleType === "irregular"} onChange={(e) => setScheduleType(e.target.value)} /> 不定期</label>
                  </div>
                  <div style={{ marginBottom: "16px" }}>
                    {scheduleType === "one_time" && (
                      <input type="date" className="input-field" required value={singleDate} onChange={(e) => setSingleDate(e.target.value)} />
                    )}
                    {scheduleType === "weekly" && (
                      <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        {WEEKDAYS.map(day => (
                          <label key={day.val} style={{ 
                            padding: "6px 12px", borderRadius: "4px", 
                            background: selectedWeekdays.includes(day.val) ? "var(--accent)" : "#fff",
                            color: selectedWeekdays.includes(day.val) ? "#fff" : "var(--text)",
                            border: "1px solid var(--border)", cursor: "pointer", fontSize: "0.9rem"
                          }}>
                            <input type="checkbox" value={day.val} checked={selectedWeekdays.includes(day.val)} onChange={() => handleWeekdayChange(day.val)} style={{ display: "none" }} />
                            {day.label}
                          </label>
                        ))}
                      </div>
                    )}
                    {scheduleType === "irregular" && (
                      <textarea className="input-field" rows={3} placeholder="例:&#13;2025-12-01&#13;2025-12-15" value={irregularDatesText} onChange={(e) => setIrregularDatesText(e.target.value)} />
                    )}
                  </div>
                  <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                    <div style={{ flex: 1 }}><input type="time" className="input-field" value={startTime} onChange={(e) => setStartTime(e.target.value)} /></div>
                    <span>〜</span>
                    <div style={{ flex: 1 }}><input type="time" className="input-field" value={endTime} onChange={(e) => setEndTime(e.target.value)} /></div>
                  </div>
                </div>

                <div>
                  <label className="label-bold">イベント詳細 (一般公開用)</label>
                  <p style={{ fontSize: "0.8rem", color: "var(--muted)", marginBottom: "4px" }}>
                    イベントの内容、魅力、お客さん向けの説明などを書いてください。
                  </p>
                  <textarea required rows={5} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="例: 初心者向けのバーイベントです！誰でも気軽に参加できます。" className="input-field" style={{ fontFamily: "inherit" }} />
                </div>

                <div>
                  <label className="label-bold">募集要項 (キャスト志望者向け)</label>
                  <p style={{ fontSize: "0.8rem", color: "var(--muted)", marginBottom: "4px" }}>
                    求める人物像、必要なスキル、注意事項など。<br/>
                    ここに入力があると「キャスト募集中」として表示されます。
                  </p>
                  <textarea rows={5} value={requirements} onChange={(e) => setRequirements(e.target.value)} placeholder="例: 接客が好きな方！VRChat歴は問いません。" className="input-field" style={{ fontFamily: "inherit" }} />
                </div>

                <div style={{ background: "#fdfaff", padding: "16px", borderRadius: "8px", border: "2px dashed var(--accent)" }}>
                  <label className="label-bold" style={{ color: "var(--accent)" }}>🔒 参加者限定情報 (任意)</label>
                  <p style={{ fontSize: "0.8rem", color: "var(--muted)", marginBottom: "8px" }}>
                    DiscordのURLや集合場所など。<br/>
                    この情報は「出演決定」した人と、主催者であるあなたにしか表示されません。
                  </p>
                  <textarea
                    rows={3}
                    value={privateInfo}
                    onChange={(e) => setPrivateInfo(e.target.value)}
                    placeholder="（例）当日連絡用Discord: https://discord.gg/..."
                    className="input-field"
                    style={{ fontFamily: "inherit", background: "#fff" }}
                  />
                </div>

                <button type="submit" className="btn btn-primary" disabled={isSubmitting}>
                  {isSubmitting ? "登録中..." : "イベントを作成する"}
                </button>
              </form>
            </div>

            {/* 右側：リスト表示 */}
            <div>
              <h2 className="section-lead" style={{ textAlign: "left", marginBottom: "16px" }}>登録済みイベント</h2>
              {myEvents.length === 0 ? (
                <p style={{ color: "var(--muted)" }}>まだ登録されたイベントはありません。</p>
              ) : (
                <div style={{ display: "grid", gap: "16px" }}>
                  {myEvents.map((event) => (
                    <div key={event.id} className="card" style={{ padding: "0", overflow: "hidden" }}>
                      {event.banner_url && (
                        <div style={{ width: "100%", aspectRatio: "16/9", background: "var(--bg)" }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={event.banner_url} alt={event.title} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                        </div>
                      )}
                      <div style={{ padding: "20px" }}>
                        <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginBottom: "8px" }}>
                          {event.tags && event.tags.map((tag: string) => (
                            <span key={tag} style={{ fontSize: "0.75rem", padding: "2px 8px", background: "var(--bg)", borderRadius: "6px", color: "var(--text)" }}>#{tag}</span>
                          ))}
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start" }}>
                          <div>
                            <h3 style={{ fontSize: "1.2rem", fontWeight: "bold", marginBottom: "8px" }}>{event.title}</h3>
                            {event.capacity && (
                              <div style={{ fontSize: "0.85rem", color: "var(--accent)", fontWeight: "bold", marginBottom: "8px" }}>
                                募集: {event.capacity}名
                              </div>
                            )}
                          </div>
                          
                          <div style={{ display: "flex", gap: "12px" }}>
                            <Link href={`/dashboard/events/${event.id}`}>
                              <button style={{ background: "var(--bg)", border: "1px solid var(--border)", padding: "4px 12px", borderRadius: "4px", cursor: "pointer", fontSize: "0.85rem" }}>👥 応募管理</button>
                            </Link>
                            <button onClick={() => handleDelete(event.id)} style={{ background: "none", border: "none", color: "#ff4757", cursor: "pointer", fontSize: "0.9rem" }}>削除</button>
                          </div>

                        </div>
                        <p style={{ fontSize: "0.9rem", color: "var(--muted)", whiteSpace: "pre-wrap" }}>
                          {event.description.length > 30 ? event.description.slice(0, 30) + "..." : event.description}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        </div>
      </main>
      <style jsx>{`
        .label-bold { display: block; margin-bottom: 8px; fontWeight: bold; }
        .input-field { width: 100%; padding: 10px; border-radius: 8px; border: 1px solid var(--border); }
      `}</style>
    </>
  );
}