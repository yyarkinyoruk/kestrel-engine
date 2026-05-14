import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { username, password } = body as { username?: string; password?: string };

    const validUser = process.env.KESTREL_ADMIN_USER;
    const validPass = process.env.KESTREL_ADMIN_PASS;

    if (!validUser || !validPass) {
      console.error('[api/auth/login] KESTREL_ADMIN_USER veya KESTREL_ADMIN_PASS tanımlı değil');
      return NextResponse.json({ error: 'Sunucu yapılandırması eksik' }, { status: 500 });
    }

    if (username === validUser && password === validPass) {
      const token = Buffer.from(`${username}:${Date.now()}`).toString('base64');

      const response = NextResponse.json({ success: true });
      response.cookies.set('kestrel-auth', token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
      });
      return response;
    }

    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  } catch (e) {
    console.error('[api/auth/login]', e);
    return NextResponse.json({ error: 'Bad Request' }, { status: 400 });
  }
}
