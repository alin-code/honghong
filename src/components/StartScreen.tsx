'use client';

import React from 'react';
import { Heart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useGame } from '@/context/GameContext';
import { SCENARIOS, getVoicesByGender } from '@/types/game';
import { StarParticles } from './StarParticles';

export function StartScreen() {
  const { gameState, setGender, setScenario, setVoiceType, startGame } = useGame();
  const { gender, scenario, voiceType } = gameState;

  const availableVoices = gender ? getVoicesByGender(gender) : [];

  const handleStartGame = () => {
    if (gender && scenario && voiceType) {
      startGame();
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-50 to-blue-100 flex items-center justify-center p-4 relative overflow-hidden">
      <StarParticles />
      <Card className="w-full max-w-2xl shadow-2xl border-0 bg-white/90 backdrop-blur-sm relative z-10">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center">
            <Heart className="w-16 h-16 text-pink-500 animate-pulse heart-float" fill="#ec4899" />
          </div>
          <CardTitle className="text-4xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 bg-clip-text text-transparent">
            哄哄模拟器
          </CardTitle>
          <CardDescription className="text-lg text-gray-600">
            AI扮演生气的对象，在10轮内把对方哄好吧！
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-8">
          {/* 性别选择 */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-gray-700">选择对方性别</label>
            <div className="grid grid-cols-2 gap-3">
              <Button
                variant={gender === 'female' ? 'default' : 'outline'}
                className={`h-16 text-lg transition-all ${
                  gender === 'female' 
                    ? 'bg-pink-500 hover:bg-pink-600 text-white shadow-lg' 
                    : 'hover:border-pink-300'
                }`}
                onClick={() => {
                  setGender('female');
                  // 重置语音选择
                  if (voiceType) {
                    const femaleVoices = getVoicesByGender('female');
                    setVoiceType(femaleVoices[0].type);
                  }
                }}
              >
                <span className="text-2xl mr-2">👩</span>
                女生
              </Button>
              <Button
                variant={gender === 'male' ? 'default' : 'outline'}
                className={`h-16 text-lg transition-all ${
                  gender === 'male' 
                    ? 'bg-blue-500 hover:bg-blue-600 text-white shadow-lg' 
                    : 'hover:border-blue-300'
                }`}
                onClick={() => {
                  setGender('male');
                  // 重置语音选择
                  if (voiceType) {
                    const maleVoices = getVoicesByGender('male');
                    setVoiceType(maleVoices[0].type);
                  }
                }}
              >
                <span className="text-2xl mr-2">👨</span>
                男生
              </Button>
            </div>
          </div>

          {/* 场景选择 */}
          <div className="space-y-3">
            <label className="text-sm font-semibold text-gray-700">选择场景</label>
            <div className="grid gap-3">
              {SCENARIOS.map((s) => (
                <Button
                  key={s.id}
                  variant={scenario?.id === s.id ? 'default' : 'outline'}
                  className={`h-auto py-4 justify-start text-left transition-all ${
                    scenario?.id === s.id 
                      ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg' 
                      : 'hover:border-pink-300'
                  }`}
                  onClick={() => setScenario(s)}
                >
                  <div>
                    <div className="font-semibold text-base">{s.title}</div>
                    <div className={`text-sm mt-1 ${scenario?.id === s.id ? 'text-white/90' : 'text-gray-500'}`}>
                      {s.description}
                    </div>
                  </div>
                </Button>
              ))}
            </div>
          </div>

          {/* 语音选择 */}
          {gender && (
            <div className="space-y-3">
              <label className="text-sm font-semibold text-gray-700">选择语音类型</label>
              <div className="grid grid-cols-3 gap-3">
                {availableVoices.map((voice) => (
                  <Button
                    key={voice.type}
                    variant={voiceType === voice.type ? 'default' : 'outline'}
                    className={`h-14 text-base transition-all ${
                      voiceType === voice.type 
                        ? 'bg-gradient-to-r from-pink-500 to-purple-500 text-white shadow-lg' 
                        : 'hover:border-pink-300'
                    }`}
                    onClick={() => setVoiceType(voice.type)}
                  >
                    {voice.label}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* 开始按钮 */}
          <Button
            size="lg"
            className="w-full h-16 text-xl font-bold bg-gradient-to-r from-pink-500 to-purple-500 hover:from-pink-600 hover:to-purple-600 text-white shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={!gender || !scenario || !voiceType}
            onClick={handleStartGame}
          >
            <Heart className="w-6 h-6 mr-2" fill="white" />
            开始游戏
          </Button>

          {/* 游戏说明 */}
          <div className="text-center text-sm text-gray-500 space-y-1">
            <p>初始好感度: 20</p>
            <p>目标好感度: 80+ 即可通关</p>
            <p>好感度降到 -50 就失败啦</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
