import { NextRequest, NextResponse } from 'next/server';
import { createSession, createUser, findUserByEmail } from '@/lib/auth';

export async function POST(request: NextRequest) {
  try {
    const { email, password } = (await request.json()) as {
      email?: string;
      password?: string;
    };

    if (!email || !password) {
      return NextResponse.json({ error: '请输入邮箱和密码' }, { status: 400 });
    }

    if (password.length < 8) {
      return NextResponse.json({ error: '密码至少需要 8 位' }, { status: 400 });
    }

    const existingUser = await findUserByEmail(email);
    if (existingUser) {
      return NextResponse.json({ error: '这个邮箱已经注册过了' }, { status: 409 });
    }

    const user = await createUser(email, password);
    await createSession(user);

    return NextResponse.json({
      user,
    });
  } catch (error) {
    console.error('Error in /api/auth/register:', error);
    return NextResponse.json({ error: '注册失败，请稍后再试' }, { status: 500 });
  }
}
