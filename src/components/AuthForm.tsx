'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { Heart, Loader2, LockKeyhole, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';

const TurnstileWidget = dynamic(
  () => import('@/components/TurnstileWidget').then((mod) => mod.TurnstileWidget),
  {
    ssr: false,
    loading: () => (
      <div className="flex h-[65px] items-center justify-center rounded-xl bg-slate-50 text-sm text-slate-400">
        正在加载安全验证...
      </div>
    ),
  }
);

interface AuthFormProps {
  mode: 'login' | 'register';
}

export function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [turnstileToken, setTurnstileToken] = useState('');
  const [error, setError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isLogin = mode === 'login';

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');

    if (isLogin && !turnstileToken) {
      setError('请先完成安全验证');
      return;
    }

    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email,
          password,
          turnstileToken: isLogin ? turnstileToken : undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || '请求失败');
      }

      router.replace('/');
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : '操作失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.9),_rgba(255,228,236,0.75)_35%,_rgba(255,244,228,0.65)_70%,_rgba(255,255,255,0.95)_100%)] px-4 py-10">
      <div className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-6xl items-center justify-center">
        <div className="grid w-full max-w-5xl gap-8 lg:grid-cols-[1.1fr_0.9fr]">
          <section className="relative overflow-hidden rounded-[2rem] border border-white/70 bg-[linear-gradient(140deg,rgba(255,236,241,0.96),rgba(255,248,236,0.95)_48%,rgba(236,246,255,0.92))] p-8 shadow-[0_25px_70px_rgba(227,113,155,0.18)] lg:p-12">
            <div className="absolute -left-12 top-10 h-40 w-40 rounded-full bg-rose-200/50 blur-3xl" />
            <div className="absolute right-0 top-0 h-52 w-52 rounded-full bg-amber-200/45 blur-3xl" />
            <div className="absolute bottom-0 right-12 h-44 w-44 rounded-full bg-sky-200/45 blur-3xl" />
            <div className="relative space-y-8">
              <div className="inline-flex items-center rounded-full bg-white/75 px-4 py-2 text-sm text-rose-500 shadow-sm">
                <Heart className="mr-2 h-4 w-4 fill-current" />
                哄哄模拟器会员入口
              </div>
              <div className="space-y-4">
                <h1 className="max-w-xl text-4xl font-semibold leading-tight text-slate-900 lg:text-5xl">
                  先登录，再开始这一局甜蜜又抓马的哄人挑战。
                </h1>
                <p className="max-w-xl text-base leading-7 text-slate-600">
                  你的账号会把游戏入口和用户身份隔开。密码不会明文保存，而是经过安全哈希后再写入数据库。
                </p>
              </div>
              <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-3xl bg-white/70 p-4 shadow-sm backdrop-blur-sm">
                  <div className="text-sm font-medium text-slate-900">登录优先</div>
                  <div className="mt-2 text-sm leading-6 text-slate-600">
                    未登录用户会先进入认证页，不能直接打开游戏主页。
                  </div>
                </div>
                <div className="rounded-3xl bg-white/70 p-4 shadow-sm backdrop-blur-sm">
                  <div className="text-sm font-medium text-slate-900">密码加密</div>
                  <div className="mt-2 text-sm leading-6 text-slate-600">
                    使用 scrypt 哈希存储，不会把原始密码存进数据库。
                  </div>
                </div>
                <div className="rounded-3xl bg-white/70 p-4 shadow-sm backdrop-blur-sm">
                  <div className="text-sm font-medium text-slate-900">即登即玩</div>
                  <div className="mt-2 text-sm leading-6 text-slate-600">
                    登录或注册成功后会自动建立会话并跳转到主页面。
                  </div>
                </div>
              </div>
            </div>
          </section>

          <Card className="border-0 bg-white/88 shadow-[0_24px_60px_rgba(15,23,42,0.14)] backdrop-blur-sm">
            <CardHeader className="space-y-3 pb-4">
              <CardTitle className="text-3xl font-semibold text-slate-900">
                {isLogin ? '登录账号' : '创建账号'}
              </CardTitle>
              <CardDescription className="text-sm leading-6 text-slate-500">
                {isLogin
                  ? '登录后才能进入主页面开始游戏。'
                  : '注册完成后会直接登录并进入主页面。'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form className="space-y-5" onSubmit={handleSubmit}>
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">邮箱</span>
                  <div className="relative">
                    <Mail className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      type="email"
                      required
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                      className="h-12 rounded-2xl border-slate-200 bg-white pl-11"
                      placeholder="you@example.com"
                    />
                  </div>
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-slate-700">密码</span>
                  <div className="relative">
                    <LockKeyhole className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                    <Input
                      type="password"
                      required
                      minLength={8}
                      value={password}
                      onChange={(event) => setPassword(event.target.value)}
                      className="h-12 rounded-2xl border-slate-200 bg-white pl-11"
                      placeholder={isLogin ? '请输入密码' : '至少 8 位密码'}
                    />
                  </div>
                </label>

                {error && (
                  <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-600">
                    {error}
                  </div>
                )}

                {isLogin && (
                  <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white p-3">
                    <TurnstileWidget
                      onSuccess={(token) => {
                        setTurnstileToken(token);
                        setError('');
                      }}
                      onExpire={() => {
                        setTurnstileToken('');
                      }}
                      onError={() => {
                        setTurnstileToken('');
                        setError('安全验证加载失败，请稍后重试');
                      }}
                    />
                  </div>
                )}

                <Button
                  type="submit"
                  size="lg"
                  className="h-12 w-full rounded-2xl bg-[linear-gradient(135deg,#ef5a84,#f9854c)] text-white shadow-lg hover:opacity-95"
                  disabled={isSubmitting || (isLogin && !turnstileToken)}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      正在处理...
                    </>
                  ) : isLogin ? (
                    '登录并进入游戏'
                  ) : (
                    '注册并进入游戏'
                  )}
                </Button>

                <div className="text-center text-sm text-slate-500">
                  {isLogin ? '还没有账号？' : '已经有账号了？'}{' '}
                  <Link
                    href={isLogin ? '/register' : '/login'}
                    className="font-medium text-rose-500 transition hover:text-rose-600"
                  >
                    {isLogin ? '去注册' : '去登录'}
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
