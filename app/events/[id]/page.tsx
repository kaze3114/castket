import type { Metadata } from "next";
import { supabase } from "@/lib/supabase";
import EventDetailClient from "./EventDetailClient";

const SITE_NAME = "Castket";
const DEFAULT_OGP = "https://www.castket.net/ogp-image.png";

export async function generateMetadata(
  { params }: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await params;

  const { data: event } = await supabase
    .from("events")
    .select("title, description, banner_url")
    .eq("id", id)
    .maybeSingle();

  if (!event) {
    return {
      title: `イベントが見つかりません | ${SITE_NAME}`,
    };
  }

  const title = `${event.title} | ${SITE_NAME}`;
  const description =
    (event.description || "VRChatイベントのキャストを募集中です。")
      .replace(/\s+/g, " ")
      .slice(0, 120);
  const image = event.banner_url || DEFAULT_OGP;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      siteName: SITE_NAME,
      type: "article",
      locale: "ja_JP",
      images: [{ url: image }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export default function EventDetailPage() {
  return <EventDetailClient />;
}
