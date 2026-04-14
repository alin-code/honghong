'use client';

import React from 'react';
import { Heart } from 'lucide-react';
import { MIN_AFFECTION, MAX_AFFECTION } from '@/types/game';

interface AffectionBarProps {
  affection: number;
}

export function AffectionBar({ affection }: AffectionBarProps) {
  // 计算进度条百分比（从MIN_AFFECTION到MAX_AFFECTION）
  const percentage = ((affection - MIN_AFFECTION) / (MAX_AFFECTION - MIN_AFFECTION)) * 100;

  // 根据好感度决定颜色
  const getColor = () => {
    if (affection < 0) return '#ef4444'; // 红色
    if (affection < 50) return '#eab308'; // 黄色
    if (affection < 80) return '#3b82f6'; // 蓝色
    return '#22c55e'; // 绿色
  };

  return (
    <div className="w-full space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Heart 
            className="w-5 h-5" 
            fill={getColor()}
            style={{ color: getColor() }}
          />
          <span className="text-sm font-medium text-gray-700">好感度</span>
        </div>
      </div>
      
      {/* 使用原生div实现进度条 */}
      <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
        <div
          className="h-full rounded-full transition-all duration-500 ease-out"
          style={{
            width: `${percentage}%`,
            backgroundColor: getColor(),
          }}
        />
      </div>
    </div>
  );
}
