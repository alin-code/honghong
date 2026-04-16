import { NextRequest, NextResponse } from 'next/server';
import { createSession, createUser, findUserByEmail, verifyPassword } from '@/lib/auth';
import { sendWelcomeEmail } from '@/lib/email';

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
      if (!verifyPassword(password, existingUser.password_hash)) {
        return NextResponse.json({ error: '该账号已存在，请输入正确密码继续登录' }, { status: 401 });
      }

      const user = {
        id: existingUser.id,
        email: existingUser.email,
      };

      await createSession(user);

      try {
        const userName = user.email.split('@')[0] || '宝宝';
        await sendWelcomeEmail(user.email, userName);
      } catch (emailError) {
        console.error('Failed to send welcome email:', emailError);
      }

      return NextResponse.json({
        user,
      });
    }

    const user = await createUser(email, password);
    await createSession(user);

    try {
      const userName = user.email.split('@')[0] || '宝宝';
      await sendWelcomeEmail(user.email, userName);
    } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
    }

    return NextResponse.json({
      user,
    });
  } catch (error) {
    console.error('Error in /api/auth/register:', error);
    return NextResponse.json({ error: '注册失败，请稍后再试' }, { status: 500 });
  }
}
