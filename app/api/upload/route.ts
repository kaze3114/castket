import { NextResponse } from "next/server";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// R2クライアントの作成
const R2 = new S3Client({
  region: "auto",
  endpoint: `https://${process.env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com`,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export async function POST(request: Request) {
  // 認証チェック
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { cookies: { getAll: () => cookieStore.getAll() } }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { fileType } = await request.json();
    
    // ユニークなファイル名を生成
    // もし uuid のインポートでエラーが出るなら、下の行を `${crypto.randomUUID()}.${...}` に変えてください
    const fileName = `${crypto.randomUUID()}.${fileType.split("/")[1]}`;

    // 「ここにアップロードしていいよ」という命令書を作成
    const putCommand = new PutObjectCommand({
      Bucket: process.env.R2_BUCKET_NAME,
      Key: fileName,
      ContentType: fileType,
    });

    // 署名付きURLを発行 (有効期限: 60秒)
    const signedUrl = await getSignedUrl(R2, putCommand, { expiresIn: 60 });

    // 公開用URL (DB保存用)
    const publicUrl = `${process.env.R2_PUBLIC_URL}/${fileName}`;

    return NextResponse.json({ signedUrl, publicUrl });
  } catch (error) {
    console.error("Upload API Error:", error);
    return NextResponse.json({ error: "Upload preparation failed" }, { status: 500 });
  }
}