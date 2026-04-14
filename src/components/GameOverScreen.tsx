'use client';

import React, { useEffect, useState } from 'react';
import { Heart, PartyPopper, HeartCrack, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useGame } from '@/context/GameContext';
import { getSpeakerByVoiceType } from '@/types/game';

export function GameOverScreen() {
  const { gameState, resetGame } = useGame();
  const { won, gender, voiceType, messages, affection, step } = gameState;

  const [endMessage, setEndMessage] = useState<string>('');
  const [audioUri, setAudioUri] = useState<string | undefined>();
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = React.useRef<HTMLAudioElement | null>(null);

  // 清理文本
  const cleanTextForSpeech = (text: string): string => {
    return text
      .replace(/（[^）]*）/g, '')
      .replace(/\([^)]*\)/g, '')
      .replace(/\[[^\]]*\]/g, '')
      .replace(/[「」『』]/g, '')
      .trim();
  };

  // 生成结束对话和语音
  useEffect(() => {
    const generateEndContent = async () => {
      if (!gender || !voiceType) return;

      try {
        // 调用API生成结束对话
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            gender,
            scenario: gameState.scenario?.title,
            messages: [...messages, { role: 'user', content: '[游戏结束]' }],
            affection,
            step,
            isGameOver: true,
            won,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to generate end message');
        }

        const data = await response.json();
        setEndMessage(data.partnerMessage);

        // 生成语音
        const cleanText = cleanTextForSpeech(data.partnerMessage);
        const speaker = getSpeakerByVoiceType(voiceType);

        const audioResponse = await fetch('/api/tts', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            text: cleanText,
            speaker,
            uid: 'game-user',
          }),
        });

        if (audioResponse.ok) {
          const audioData = await audioResponse.json();
          setAudioUri(audioData.audioUri);
        }
      } catch (error) {
        console.error('Error generating end content:', error);
        // 降级方案
        setEndMessage(
          won 
            ? '好吧，这次就原谅你了~下次不许再这样了哦！' 
            : '我们还是冷静一下吧，我需要时间考虑我们的关系。'
        );
      }
    };

    generateEndContent();
  }, [won, gender, voiceType, messages, affection, step, gameState.scenario]);

  // 播放/暂停语音
  const toggleAudio = () => {
    if (!audioUri) return;

    if (!audioRef.current) {
      audioRef.current = new Audio(audioUri);
      audioRef.current.onended = () => setIsPlaying(false);
    }

    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  return (
    <div className={`min-h-screen flex items-center justify-center p-4 ${
      won 
        ? 'bg-gradient-to-br from-pink-100 via-purple-50 to-blue-100' 
        : 'bg-gradient-to-br from-gray-100 via-gray-50 to-gray-100'
    }`}>
      {/* 撒花/心碎动画 */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {won ? (
          // 撒花动画
          Array.from({ length: 20 }).map((_, i) => (
            <div
              key={i}
              className="absolute animate-bounce"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${1 + Math.random()}s`,
              }}
            >
              <span className="text-3xl">
                {['🎉', '💕', '💖', '💗', '💝', '🎊'][Math.floor(Math.random() * 6)]}
              </span>
            </div>
          ))
        ) : (
          // 心碎动画
          Array.from({ length: 15 }).map((_, i) => (
            <div
              key={i}
              className="absolute animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 2}s`,
                animationDuration: `${1.5 + Math.random()}s`,
              }}
            >
              <span className="text-3xl opacity-40">
                {['💔', '😢', '😭', '😿'][Math.floor(Math.random() * 4)]}
              </span>
            </div>
          ))
        )}
      </div>

      <Card className={`w-full max-w-lg shadow-2xl border-0 relative ${
        won ? 'bg-white/95' : 'bg-gray-50/95'
      }`}>
        <CardContent className="p-8 text-center space-y-6">
          {/* 图标 */}
          <div className="flex justify-center">
            {won ? (
              <div className="relative">
                <PartyPopper className="w-20 h-20 text-pink-500 animate-bounce" />
                <Heart className="w-8 h-8 text-red-500 absolute -top-2 -right-2 animate-pulse" fill="#ef4444" />
              </div>
            ) : (
              <HeartCrack className="w-20 h-20 text-gray-400 animate-pulse" />
            )}
          </div>

          {/* 标题 */}
          <div>
            <h2 className={`text-3xl font-bold mb-2 ${
              won 
                ? 'bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent' 
                : 'text-gray-600'
            }`}>
              {won ? '🎉 通关成功！' : '💔 通关失败'}
            </h2>
            <p className="text-gray-500">
              {won ? '恭喜你成功把TA哄好了！' : 'TA还是很生气，再试一次吧！'}
            </p>
          </div>

          {/* 结束对话 */}
          <div className={`rounded-lg p-4 ${
            won ? 'bg-pink-50' : 'bg-gray-100'
          }`}>
            <p className="text-gray-700 whitespace-pre-wrap">
              {endMessage || (won ? '💕' : '💔')}
            </p>
          </div>

          {/* 语音播放按钮 */}
          {audioUri && (
            <Button
              variant="outline"
              onClick={toggleAudio}
              className={`${
                won 
                  ? 'border-pink-300 text-pink-500 hover:bg-pink-50' 
                  : 'border-gray-300 text-gray-500 hover:bg-gray-50'
              }`}
            >
              {isPlaying ? '🔊 暂停语音' : '🔇 播放语音'}
            </Button>
          )}

          {/* 分享/重玩 */}
          <div className="space-y-3 pt-4">
            {won && (
              <p className="text-sm text-gray-500">
                🎊 分享给朋友试试？
              </p>
            )}
            
            <Button
              size="lg"
              className={`w-full font-bold ${
                won
                  ? 'bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white'
                  : 'bg-gray-600 hover:bg-gray-700 text-white'
              }`}
              onClick={resetGame}
            >
              <RefreshCw className="w-5 h-5 mr-2" />
              {won ? '再玩一次' : '再试一次'}
            </Button>

            {!won && (
              <p className="text-xs text-gray-400 mt-2">
                好感度: {affection} / 目标: 80+
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
