"use server";

import { GoogleGenerativeAI } from "@google/generative-ai";
import { createClient } from "@supabase/supabase-js";

// 管理者権限クライアント
const getAdminSupabase = () => {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(supabaseUrl, serviceRoleKey);
};

// ▼▼▼ ルール設定 ▼▼▼
const VIOLATION_LIMIT = 5;      // 30分以内に5回でアウト
const VIOLATION_WINDOW_MIN = 30; // 30分

const SUSPENSION_LIMIT = 3;     // 30日以内に3回凍結でBAN
const SUSPENSION_WINDOW_DAYS = 30; // 30日

const SUSPENSION_HOURS = 24;    // 凍結時間は24時間

// ユーザーの状態を判定・更新するロジック
async function checkAndPenaltyUser(supabase: any, userId: string) {
  const { data: p } = await supabase
    .from("profiles")
    .select("*")
    .eq("user_id", userId)
    .single();

  const now = new Date();
  
  // 1. 永久BANチェック
  if (p.is_banned) {
    return { 
      allowed: false, 
      msg: "あなたのアカウントは永久停止されています。" 
    };
  }

  // 2. 凍結期間中かチェック
  if (p.suspended_until) {
    const suspendedUntil = new Date(p.suspended_until);
    if (now < suspendedUntil) {
      const remainingHours = Math.ceil((suspendedUntil.getTime() - now.getTime()) / (1000 * 60 * 60));

      // ▼▼▼ 追加：日本時間に変換して表示する ▼▼▼
      const jstTime = suspendedUntil.toLocaleString("ja-JP", { 
        timeZone: "Asia/Tokyo",
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit"
      });

      return { 
        allowed: false, 
        msg: `アカウントは一時凍結されています。\n解除予定: ${jstTime} (JST)\nあと約 ${remainingHours} 時間です。` 
      };
    }
  }

  // 3. 期間リセット処理（違反カウント）
  // 最初の違反から30分以上経っていたら、違反カウントを0に戻す
  if (p.first_violation_at) {
    const firstViolated = new Date(p.first_violation_at);
    const diffMin = (now.getTime() - firstViolated.getTime()) / (1000 * 60);
    if (diffMin > VIOLATION_WINDOW_MIN) {
      await supabase.from("profiles").update({ violation_count: 0, first_violation_at: null }).eq("user_id", userId);
      p.violation_count = 0; // メモリ上もリセット
    }
  }

  // 4. 期間リセット処理（凍結カウント）
  // 最初の凍結から30日以上経っていたら、凍結カウントを0に戻す
  if (p.first_suspension_at) {
    const firstSuspended = new Date(p.first_suspension_at);
    const diffDays = (now.getTime() - firstSuspended.getTime()) / (1000 * 60 * 60 * 24);
    if (diffDays > SUSPENSION_WINDOW_DAYS) {
      await supabase.from("profiles").update({ suspension_count: 0, first_suspension_at: null }).eq("user_id", userId);
    }
  }

  return { allowed: true, profile: p };
}

// 違反時の加算処理
async function addViolation(supabase: any, userId: string, profile: any) {
  const now = new Date();
  const updates: any = {};

  // 違反カウントを増やす
  const newViolationCount = (profile.violation_count || 0) + 1;
  updates.violation_count = newViolationCount;

  // 初回なら時間を記録
  if (newViolationCount === 1) {
    updates.first_violation_at = now.toISOString();
  }

  // ▼▼▼ 24時間凍結の発動判定 ▼▼▼
  if (newViolationCount >= VIOLATION_LIMIT) {
    const newSuspensionCount = (profile.suspension_count || 0) + 1;
    updates.suspension_count = newSuspensionCount;
    updates.violation_count = 0; // 違反カウントはリセット
    updates.first_violation_at = null;
    
    // 24時間後まで凍結
    const until = new Date(now.getTime() + (SUSPENSION_HOURS * 60 * 60 * 1000));
    updates.suspended_until = until.toISOString();

    // 凍結回数の期間管理
    if (newSuspensionCount === 1) {
      updates.first_suspension_at = now.toISOString();
    }

    // ▼▼▼ 永久BANの発動判定 ▼▼▼
    if (newSuspensionCount >= SUSPENSION_LIMIT) {
      updates.is_banned = true;
      updates.suspended_until = null; // 永久なので日付不要
    }
  }

  await supabase.from("profiles").update(updates).eq("user_id", userId);
  
  return { 
    newViolationCount, 
    isSuspended: updates.suspended_until ? true : false,
    isBanned: updates.is_banned ? true : false
  };
}


// ▼▼▼ メイン関数（テキスト） ▼▼▼
export async function checkContentSafety(text: string, userId: string) {
  const supabase = getAdminSupabase();
  
  // 1. ユーザー状態確認
  const status = await checkAndPenaltyUser(supabase, userId);
  if (!status.allowed) {
    return { isSafe: false, reason: status.msg };
  }

  // 2. AIチェック
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return { isSafe: false, reason: "システムエラー" };

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const prompt = `
あなたはVRChatコミュニティのイベント掲載モデレーターです。
以下のテキストがイベント募集文として掲載可能かどうかを判定してください。

【判定対象テキスト】
"${text}"

【掲載OK（isSafe: true）の基準】
- VRChatの利用規約・コミュニティガイドラインに準ずる内容
- スポーツ・格闘技・ボクシング・武道など競技系イベントの説明（「殴る」「戦う」「倒す」などの競技文脈での表現は問題なし）
- 煽り文句・ハイプ表現・強調表現（「最強」「激アツ」「死ぬほど楽しい」など日常的な誇張表現は問題なし）
- 比喩・暗喩・スラング（悪意のない文脈でのもの）
- ゲーム内PvP・バトルイベント・対戦イベントの告知
- 18歳以上向けのアルコールや成人向けの話題（VRChatのAge Verification範囲内）

【掲載NG（isSafe: false）の基準】
- 特定個人・グループへのヘイトスピーチ・差別的内容
- 実在する人物の個人情報（ドクシング）
- 詐欺・フィッシング・金銭トラブルを誘導する内容
- 露骨な性的コンテンツの宣伝（VRChatのAge Verification対象外の場での告知）
- 自傷・自殺を美化・誘導する内容
- マルウェア・ハッキング行為の告知

必ずJSON形式のみで返答してください。
{ "isSafe": boolean, "reason": "短い理由（NGの場合のみ記載）" }
  `;

  try {
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const jsonString = response.text().match(/\{[\s\S]*\}/)?.[0] || "{}";
    const resultJson = JSON.parse(jsonString);

    // 3. NGだった場合の処理
    if (resultJson.isSafe === false) {
      const penaltyResult = await addViolation(supabase, userId, status.profile);
      
      let warningMsg = `理由: ${resultJson.reason}`;

      if (penaltyResult.isBanned) {
         warningMsg = "違反が重なったため、アカウントが永久停止されました。";
      } else if (penaltyResult.isSuspended) {
         warningMsg = "短時間に違反が集中したため、24時間の利用制限がかかりました。";
      } else {
         // ★ここで残り回数を表示！
         const remaining = VIOLATION_LIMIT - penaltyResult.newViolationCount;
         warningMsg += `\n\n⚠️ あと ${remaining} 回 違反すると、24時間の利用制限がかかります。`;
      }

      return { isSafe: false, reason: warningMsg };
    }

    return { isSafe: true, reason: "" };

  } catch (error) {
    console.error("AI Check Error:", error);
    return { isSafe: true, reason: "" }; 
  }
}

// ▼▼▼ メイン関数（画像） ▼▼▼
export async function checkImageSafety(imageUrl: string, userId: string) {
  const supabase = getAdminSupabase();

  // 1. ユーザー状態確認
  const status = await checkAndPenaltyUser(supabase, userId);
  if (!status.allowed) {
    return { isSafe: false, reason: status.msg };
  }

  // 2. AIチェック
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return { isSafe: false, reason: "システムエラー" };

  const genAI = new GoogleGenerativeAI(apiKey);
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  try {
    const imageResp = await fetch(imageUrl);
    const arrayBuffer = await imageResp.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Image = buffer.toString("base64");
    const mimeType = imageResp.headers.get("content-type") || "image/jpeg";

    const prompt = `
あなたはVRChatコミュニティのイベント掲載モデレーターです。
以下の画像がイベントバナーとして掲載可能かどうかを判定してください。

【掲載OK（isSafe: true）の基準】
- VRChatのアバター・ワールドのスクリーンショット
- スポーツ・格闘技・バトル系イベントのイラストや演出画像（競技文脈でのアクションシーンは問題なし）
- アニメ・ゲーム風のキャラクターイラスト
- イベントロゴ・タイトル画像・告知バナー
- VRChatのAge Verification範囲内の成人向けコンテンツ

【掲載NG（isSafe: false）の基準】
- 露骨な性的描写（ポルノグラフィー）
- 実写の過激な暴力・流血・グロテスク画像
- 特定個人・グループへの差別・ヘイトを示す画像
- 個人情報が写り込んでいる画像

必ずJSON形式のみで返答してください。
{ "isSafe": boolean, "reason": "短い理由（NGの場合のみ記載）" }
    `;

    const result = await model.generateContent([
      prompt, 
      { inlineData: { data: base64Image, mimeType } }
    ]);
    
    const response = await result.response;
    const jsonString = response.text().match(/\{[\s\S]*\}/)?.[0] || "{}";
    const resultJson = JSON.parse(jsonString);

    // 3. NGだった場合の処理
    if (resultJson.isSafe === false) {
      const penaltyResult = await addViolation(supabase, userId, status.profile);
      
      let warningMsg = `理由: ${resultJson.reason}`;

      if (penaltyResult.isBanned) {
         warningMsg = "違反が重なったため、アカウントが永久停止されました。";
      } else if (penaltyResult.isSuspended) {
         warningMsg = "短時間に違反が集中したため、24時間の利用制限がかかりました。";
      } else {
         const remaining = VIOLATION_LIMIT - penaltyResult.newViolationCount;
         warningMsg += `\n\n⚠️ あと ${remaining} 回 違反すると、24時間の利用制限がかかります。`;
      }

      return { isSafe: false, reason: warningMsg };
    }

    return { isSafe: resultJson.isSafe ?? true, reason: resultJson.reason || "" };

  } catch (error) {
    console.error("Image Check Error:", error);
    return { isSafe: true, reason: "" };
  }
}

// アクション実行前のチェック用（AI判定なし、ステータス確認のみ）
export async function checkUserRestriction(userId: string) {
  const supabase = getAdminSupabase();
  
  // 既存の判定ロジックを再利用
  const status = await checkAndPenaltyUser(supabase, userId);
  
  if (!status.allowed) {
    return { allowed: false, reason: status.msg }; // status.msg には「解除まであと◯時間」などが入っています
  }

  return { allowed: true, reason: "" };
}