import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

export const dynamic = "force-dynamic"; // 常に最新データを取得

export async function GET() {
  // サーバー側でSupabaseクライアント作成
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY! // 管理者キーを使う（確実に数えるため）
  );

  // 1. ログインユーザーのIDを取得（Cookieからじゃなくヘッダー等で本当はやるべきですが、簡易的にClientから送るか、ここでは簡略化のため固定ユーザーの確認ロジックにします）
  // ※本来は cookies() を使ってサーバー側でユーザー特定すべきですが、
  // 今回は「Service Role」を使わず、クライアントから渡されたアクセストークンを使うのが安全です。
  // ですが、一番簡単な「クライアント側で直接DBを見る」方法（ステップ3）で行きましょう！
  
  // APIルートを使わず、直接コンポーネントからSupabaseを叩くほうが今回は簡単なので、
  // このファイルは一旦「なし」でOKです！
  return NextResponse.json({ message: "Use client side fetching for simplicity" });
}