'use client';

import { useRouter } from 'next/navigation';
import { LogOut } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function LogoutButton() {
  const router = useRouter();

  const handleLogout = async () => {
    await fetch('/api/auth/logout', {
      method: 'POST',
    });

    router.push('/login');
    router.refresh();
  };

  return (
    <Button
      variant="outline"
      size="sm"
      className="rounded-full border-white/70 bg-white/80 text-slate-700 shadow-sm backdrop-blur-sm hover:bg-white"
      onClick={handleLogout}
    >
      <LogOut className="mr-2 h-4 w-4" />
      退出登录
    </Button>
  );
}
