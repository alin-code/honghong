import { redirect } from 'next/navigation';
import { GameApp } from '@/components/GameApp';
import { getCurrentUser } from '@/lib/auth';

export default async function Home() {
  const user = await getCurrentUser();

  if (!user) {
    redirect('/login');
  }

  return <GameApp />;
}
