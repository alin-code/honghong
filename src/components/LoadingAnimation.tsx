'use client';

import React from 'react';
import { Heart } from 'lucide-react';
import { Gender } from '@/types/game';

interface LoadingAnimationProps {
  gender: Gender | null;
}

export function LoadingAnimation({ gender }: LoadingAnimationProps) {
  const pronoun = gender === 'male' ? '他' : '她';

  return (
    <div className="flex items-center justify-center gap-3 py-4">
      {/* 跳动爱心图标 */}
      <Heart 
        className="w-6 h-6 text-pink-500 animate-bounce"
        fill="#ec4899"
      />
      
      {/* 动态文字 */}
      <span className="text-gray-600 animate-pulse">
        {pronoun}正在思考...
      </span>
    </div>
  );
}
