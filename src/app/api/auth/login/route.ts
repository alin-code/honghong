import { NextRequest, NextResponse } from 'next/server';
import { createSession, findUserByEmail, verifyPassword } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = (await request.json()) as {
      email?: string;
      password?: string;
    };

    if (!email || !password) {
      return NextResponse.json({ error: '请输入邮箱和密码' }, { status: 400 });
    }

    const user = await findUserByEmail(email);
    if (!user || !verifyPassword(password, user.password_hash)) {
      return NextResponse.json({ error: '邮箱或密码不正确' }, { status: 401 });
    }

    await createSession({
      id: user.id,
      email: user.email,
    });

    return NextResponse.json({
      user: {
        id: user.id,
        email: user.email,
      },
    });
  } catch (error) {
    console.error('Error in /api/auth/login:', error);
    return NextResponse.json({ error: '登录失败，请稍后再试' }, { status: 500 });
  }
}
