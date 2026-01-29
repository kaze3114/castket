import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { GoogleGenerativeAI } from "@google/generative-ai";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { user_id, category, content, page_url } = body;

    console.log("AI判定を開始します: ", content); // ★ログ追加

    // 1. AIによるモデレーション（毒舌判定・厳格モード）
    let status = "open"; 
    
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });
      
      // ★修正: プロンプトを強化して、煽りや嘲笑も許さないようにする
      const prompt = `
        あなたはWebサービスの厳格なコンテンツモデレーターです。
        以下のフィードバック内容を分析し、少しでも「悪意」「嘲笑」「攻撃性」「不快感」が含まれる場合は有害と判定してください。

        【判定基準】
        - 誹謗中傷、暴言、脅迫は即アウト
        - 「馬鹿」「ゴミ」「くだらない」などの侮辱的な言葉が含まれる場合はアウト
        - 文末の「wwww」や「？？？？」など、相手を煽るような表現もアウト
        - 建設的な批判ではなく、単に相手を傷つける目的の文章はアウト

        回答は以下のJSON形式のみで返してください。
        { "is_harmful": true または false, "reason": "判定理由" }

        分析対象のテキスト:
        ${content}
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const text = response.text();
      
      console.log("AIの回答 raw:", text); // ★AIが何を言ったかログで見る

      const jsonStr = text.replace(/```json|```/g, "").trim();
      const analysis = JSON.parse(jsonStr);

      if (analysis.is_harmful) {
        status = "attention";
        console.log("→ 有害判定されました:", analysis.reason);
      } else {
        console.log("→ 安全判定されました");
      }

    } catch (e) {
      console.error("!! AI判定中にエラーが発生しました !!");
      console.error(e);
      // エラーが出た場合、念のため人間が確認できるよう 'attention' に倒す手もありますが、
      // まずはログを見て原因（APIキーミスなど）を特定しましょう。
    }

    // 2. Supabaseに保存
    const { error } = await supabase
      .from("feedbacks")
      .insert({
        user_id,
        category,
        content,
        page_url,
        status: status
      });

    if (error) throw error;

    return NextResponse.json({ success: true });

  } catch (error) {
    console.error("Feedback API Error:", error);
    return NextResponse.json({ error: "Failed to send feedback" }, { status: 500 });
  }
}