import { createClient } from '@supabase/supabase-js'

// .env.local に書いた鍵を読み込みます
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

// Supabaseと通信するクライアントを作成してエクスポート
export const supabase = createClient(supabaseUrl, supabaseAnonKey)