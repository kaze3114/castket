import { NextRequest, NextResponse } from 'next/server';

export const config = {
  matcher: ['/:path*'], // すべてのページで実行
};

export function middleware(req: NextRequest) {
  // 基本的な認証情報（ここに設定したいIDとPASSを書くこともできますが、環境変数がおすすめ）
  // Vercelの環境変数で設定した値を使います
  const basicAuthUser = process.env.BASIC_AUTH_USER;
  const basicAuthPassword = process.env.BASIC_AUTH_PASSWORD;

  // 環境変数が設定されていない場合は、認証なしで通す（または開発環境など）
  if (!basicAuthUser || !basicAuthPassword) {
    return NextResponse.next();
  }

  const authorizationHeader = req.headers.get('authorization');

  if (authorizationHeader) {
    const authValue = authorizationHeader.split(' ')[1];
    const [user, password] = atob(authValue).split(':');

    if (user === basicAuthUser && password === basicAuthPassword) {
      return NextResponse.next();
    }
  }

  // 認証に失敗、または未入力の場合
  return new NextResponse('Authentication required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Secure Area"',
    },
  });
}