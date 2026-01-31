import { createClient } from '@supabase/supabase-js'

// .env.local に書いた鍵を読み込みます
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

// ▼ ログ出力用のコード（キーそのものは表示せず、有無だけ確認）
console.log("--- Supabase Client Debug ---");
console.log("URL exists:", !!supabaseUrl); // trueならOK
console.log("KEY exists:", !!supabaseAnonKey); // trueならOK
console.log("KEY length:", supabaseAnonKey ? supabaseAnonKey.length : 0); // 文字数を確認
console.log("-----------------------------");

// キーがない場合はここでエラーを投げて、ログに残るようにする
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Supabaseの環境変数が設定されていません！Vercelの設定を確認してください。");
}

// Supabaseと通信するクライアントを作成してエクスポート（ここ1箇所だけにする！）
export const supabase = createClient(supabaseUrl, supabaseAnonKey)