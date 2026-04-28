"use client";

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/lib/supabase";

type Message = {
  id: string;
  event_id: number;
  user_id: string;
  message: string;
  created_at: string;
};

type Profile = {
  display_name: string;
  avatar_url: string;
};

type Props = {
  eventId: number;
  currentUserId: string;
};

export default function EventChat({ eventId, currentUserId }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [profiles, setProfiles] = useState<Record<string, Profile>>({});
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const fetchedIds = useRef<Set<string>>(new Set());

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const fetchProfiles = async (userIds: string[]) => {
    const newIds = userIds.filter(id => !fetchedIds.current.has(id));
    if (newIds.length === 0) return;
    newIds.forEach(id => fetchedIds.current.add(id));
    const { data } = await supabase
      .from("profiles")
      .select("user_id, display_name, avatar_url")
      .in("user_id", newIds);
    if (data) {
      setProfiles(prev => {
        const next = { ...prev };
        data.forEach((p: any) => { next[p.user_id] = { display_name: p.display_name, avatar_url: p.avatar_url }; });
        return next;
      });
    }
  };

  useEffect(() => {
    const init = async () => {
      const { data } = await supabase
        .from("event_messages")
        .select("*")
        .eq("event_id", eventId)
        .order("created_at", { ascending: true });

      if (data && data.length > 0) {
        setMessages(data);
        await fetchProfiles([...new Set(data.map((m: Message) => m.user_id))]);
      }
      scrollToBottom();
    };

    init();

    const channel = supabase
      .channel(`event-chat-${eventId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "event_messages",
          filter: `event_id=eq.${eventId}`,
        },
        async (payload) => {
          const newMsg = payload.new as Message;
          setMessages(prev => [...prev, newMsg]);
          await fetchProfiles([newMsg.user_id]);
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [eventId]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      await supabase.from("event_messages").insert({
        event_id: eventId,
        user_id: currentUserId,
        message: text,
      });
      setInput("");
    } finally {
      setSending(false);
    }
  };

  return (
    <div style={{ background: "#fdfaff", border: "2px dashed var(--accent)", borderRadius: "12px", padding: "20px", marginBottom: "32px" }}>
      <h3 style={{ color: "var(--accent)", fontSize: "1.1rem", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
        💬 メンバーチャット
      </h3>

      <div style={{ height: "320px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "12px", marginBottom: "12px", paddingRight: "4px" }}>
        {messages.length === 0 && (
          <div style={{ textAlign: "center", color: "var(--muted)", fontSize: "0.9rem", marginTop: "auto", marginBottom: "auto" }}>
            まだメッセージはありません。最初のメッセージを送ってみましょう！
          </div>
        )}
        {messages.map(msg => {
          const profile = profiles[msg.user_id];
          const isMe = msg.user_id === currentUserId;
          return (
            <div key={msg.id} style={{ display: "flex", gap: "8px", justifyContent: isMe ? "flex-end" : "flex-start" }}>
              {!isMe && (
                <div style={{ width: "32px", height: "32px", borderRadius: "50%", background: "#eee", overflow: "hidden", flexShrink: 0, marginTop: "18px" }}>
                  {profile?.avatar_url
                    ? <img src={profile.avatar_url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                    : <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "0.8rem", color: "#aaa" }}>?</div>
                  }
                </div>
              )}
              <div style={{ maxWidth: "70%", display: "flex", flexDirection: "column", alignItems: isMe ? "flex-end" : "flex-start" }}>
                {!isMe && (
                  <div style={{ fontSize: "0.75rem", color: "var(--muted)", marginBottom: "2px" }}>
                    {profile?.display_name ?? "..."}
                  </div>
                )}
                <div style={{
                  background: isMe ? "var(--accent)" : "#f0f0f0",
                  color: isMe ? "#fff" : "var(--text)",
                  padding: "8px 12px",
                  borderRadius: isMe ? "12px 12px 2px 12px" : "12px 12px 12px 2px",
                  fontSize: "0.9rem",
                  lineHeight: 1.5,
                  wordBreak: "break-word",
                  whiteSpace: "pre-wrap",
                }}>
                  {msg.message}
                </div>
                <div style={{ fontSize: "0.7rem", color: "var(--muted)", marginTop: "2px" }}>
                  {new Date(msg.created_at).toLocaleTimeString("ja-JP", { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <div style={{ display: "flex", gap: "8px" }}>
        <input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
          placeholder="メッセージを入力... (Enterで送信)"
          style={{ flex: 1, padding: "10px 14px", borderRadius: "8px", border: "1px solid #ddd", fontSize: "0.95rem", outline: "none" }}
          disabled={sending}
        />
        <button
          onClick={handleSend}
          disabled={sending || !input.trim()}
          className="btn btn-primary"
          style={{ padding: "10px 20px", flexShrink: 0 }}
        >
          送信
        </button>
      </div>
      <p style={{ fontSize: "0.75rem", color: "var(--muted)", marginTop: "8px" }}>
        ※このチャットは主催者と出演決定メンバーのみ閲覧できます
      </p>
    </div>
  );
}
