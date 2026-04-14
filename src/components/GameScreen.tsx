'use client';

import React, { useEffect, useRef, useState, useCallback } from 'react';
import { ImageIcon, Volume2, VolumeX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AffectionBar } from '@/components/AffectionBar';
import { LoadingAnimation } from '@/components/LoadingAnimation';
import { useGame } from '@/context/GameContext';
import { MAX_ROUNDS, VOICE_CONFIGS, getSpeakerByVoiceType } from '@/types/game';

export function GameScreen() {
  const { 
    gameState, 
    selectOption, 
    addPartnerMessage, 
    setLoading, 
    isLoading 
  } = useGame();
  
  const { 
    step, 
    affection, 
    gender, 
    scenario, 
    voiceType, 
    messages, 
    currentOptions 
  } = gameState;

  const [audioUri, setAudioUri] = useState<string | undefined>();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentAudioMessageId, setCurrentAudioMessageId] = useState<string | null>(null);
  const [sceneImageUrl, setSceneImageUrl] = useState<string | null>(null);
  const [isGeneratingSceneImage, setIsGeneratingSceneImage] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const isGeneratingRef = useRef(false);
  const lastGeneratedStep = useRef(0);
  const currentSceneImageKeyRef = useRef<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // 清理文本，去掉括号里的动作描述
  const cleanTextForSpeech = (text: string): string => {
    return text
      .replace(/（[^）]*）/g, '')  // 去掉中文括号
      .replace(/\([^)]*\)/g, '')   // 去掉英文括号
      .replace(/\[[^\]]*\]/g, '')  // 去掉中括号
      .replace(/[「」『』]/g, '')  // 去掉其他标点
      .trim();
  };

  // 生成对话
  const generateNextRound = useCallback(async () => {
    // 防止重复生成
    if (isGeneratingRef.current || isLoading) {
      return;
    }

    // 如果已经生成过这一轮，不再重复生成
    if (lastGeneratedStep.current >= step) {
      return;
    }

    isGeneratingRef.current = true;
    setLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          gender,
          scenario: scenario?.title,
          messages,
          affection,
          step,
          isGameOver: false,
          won: false,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate response');
      }

      const data = await response.json();
      
      addPartnerMessage(data.partnerMessage, data.options);
      lastGeneratedStep.current = step;
    } catch (error) {
      console.error('Error generating response:', error);
      // 降级方案：使用默认对话
      const defaultMessage = "哼，你怎么这么笨，连话都不会说了！";
      const defaultOptions = [
        { id: '1', content: '对不起，我错了', score: 10 },
        { id: '2', content: '我马上改', score: 15 },
        { id: '3', content: '别生气了嘛', score: 5 },
        { id: '4', content: '你管我', score: -20 },
        { id: '5', content: '我懒得理你', score: -15 },
        { id: '6', content: '能不能别这么作', score: -25 },
      ];
      addPartnerMessage(defaultMessage, defaultOptions);
      lastGeneratedStep.current = step;
    } finally {
      setLoading(false);
      isGeneratingRef.current = false;
    }
  }, [step, gender, scenario, messages, affection, isLoading, addPartnerMessage, setLoading]);

  // 生成语音
  useEffect(() => {
    const generateAudio = async () => {
      if (!voiceType || messages.length === 0) return;

      // 获取最后一条partner消息
      const lastPartnerMessage = [...messages].reverse().find(m => m.role === 'partner');
      if (!lastPartnerMessage) return;

      // 计算partner消息数量，用于生成唯一ID
      const partnerMessageCount = messages.filter(m => m.role === 'partner').length;
      const messageId = `${lastPartnerMessage.role}-${lastPartnerMessage.content}-${partnerMessageCount}`;

      // 如果是同一条消息，不重复生成
      if (currentAudioMessageId === messageId) {
        return;
      }

      // 清除旧语音
      setAudioUri(undefined);
      setCurrentAudioMessageId(messageId);

      try {
        const cleanText = cleanTextForSpeech(lastPartnerMessage.content);
        const speaker = getSpeakerByVoiceType(voiceType);

        const response = await fetch('/api/tts', {
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

        if (!response.ok) {
          throw new Error('Failed to generate audio');
        }

        const data = await response.json();
        setAudioUri(data.audioUri);
      } catch (error) {
        console.error('Error generating audio:', error);
      }
    };

    generateAudio();
  }, [messages, voiceType, currentAudioMessageId]);

  // 进入对话页后根据配置生成场景图
  useEffect(() => {
    const generateSceneImage = async () => {
      if (!gender || !scenario || !voiceType || step <= 0) {
        return;
      }

      const sceneImageKey = `${gender}-${scenario.id}-${voiceType}`;
      if (currentSceneImageKeyRef.current === sceneImageKey) {
        return;
      }

      currentSceneImageKeyRef.current = sceneImageKey;
      setSceneImageUrl(null);
      setIsGeneratingSceneImage(true);

      try {
        const response = await fetch('/api/scene-image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            gender,
            scenario,
            voiceType,
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to generate scene image');
        }

        const data = await response.json();
        setSceneImageUrl(data.imageUrl);
      } catch (error) {
        console.error('Error generating scene image:', error);
      } finally {
        setIsGeneratingSceneImage(false);
      }
    };

    generateSceneImage();
  }, [gender, scenario, step, voiceType]);

  // 在轮次变化时生成对话
  useEffect(() => {
    if (step > 0 && !gameState.gameOver && currentOptions.length === 0) {
      generateNextRound();
    }
  }, [step, currentOptions.length, gameState.gameOver, generateNextRound]);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // 处理选项选择
  const handleSelectOption = async (option: typeof currentOptions[0]) => {
    // 重置语音状态
    setAudioUri(undefined);
    setCurrentAudioMessageId(null);
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }

    selectOption(option);
  };

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

  const selectedVoice = VOICE_CONFIGS.find((voice) => voice.type === voiceType);

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-100 via-purple-50 to-blue-100 flex flex-col">
      {/* 顶部栏：好感度 + 轮次 */}
      <div className="bg-white/90 backdrop-blur-sm shadow-md p-4 space-y-3">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">
              第 {step} 轮 / 共 {MAX_ROUNDS} 轮
            </span>
            {audioUri && (
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleAudio}
                className="text-pink-500 hover:text-pink-600 hover:bg-pink-50"
              >
                {isPlaying ? (
                  <VolumeX className="w-5 h-5" />
                ) : (
                  <Volume2 className="w-5 h-5" />
                )}
              </Button>
            )}
          </div>
          <AffectionBar affection={affection} />
        </div>
      </div>

      {/* 对话区域 */}
      <div className="flex-1 overflow-y-auto p-4 pb-32">
        <div className="max-w-4xl mx-auto space-y-4">
          {(isGeneratingSceneImage || sceneImageUrl) && (
            <div className="overflow-hidden rounded-3xl border border-white/70 bg-white/70 shadow-xl backdrop-blur-sm">
              <div className="relative aspect-[16/7] w-full bg-gradient-to-br from-rose-100 via-orange-50 to-sky-100">
                {sceneImageUrl ? (
                  <img
                    src={sceneImageUrl}
                    alt={`${scenario?.title ?? '当前场景'}剧情配图`}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <div className="flex items-center gap-3 rounded-full bg-white/80 px-5 py-3 text-sm text-gray-600 shadow-md">
                      <ImageIcon className="h-4 w-4 text-pink-500" />
                      正在为这一轮生成专属剧情插图...
                    </div>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
                <div className="absolute inset-x-0 bottom-0 p-5 text-white">
                  <div className="mb-2 inline-flex items-center rounded-full bg-white/20 px-3 py-1 text-xs tracking-wide backdrop-blur-sm">
                    对话场景插图
                  </div>
                  <h2 className="text-2xl font-semibold">{scenario?.title}</h2>
                  <p className="mt-1 max-w-2xl text-sm text-white/90">
                    {scenario?.description}
                  </p>
                  <p className="mt-2 text-xs text-white/80">
                    {gender === 'female' ? '对方性别：女生' : '对方性别：男生'}
                    {' · '}
                    {selectedVoice ? `语音：${selectedVoice.label}` : '语音已选择'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {messages.map((message, index) => (
            <div
              key={index}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {message.role === 'partner' && (
                <div className="w-10 h-10 rounded-full bg-pink-500 flex items-center justify-center text-white font-semibold mr-3 flex-shrink-0">
                  TA
                </div>
              )}
              <div
                className={`max-w-[70%] px-4 py-3 shadow-md ${
                  message.role === 'user'
                    ? 'bg-blue-500 text-white rounded-2xl rounded-br-md'
                    : 'bg-white text-gray-800 rounded-2xl rounded-bl-md'
                }`}
              >
                <p className="whitespace-pre-wrap">{message.content}</p>
              </div>
              {message.role === 'user' && (
                <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center text-white font-semibold ml-3 flex-shrink-0">
                  我
                </div>
              )}
            </div>
          ))}
          
          {/* 加载动画 */}
          {isLoading && <LoadingAnimation gender={gender} />}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* 选项区域（固定在底部） */}
      {!isLoading && currentOptions.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-t border-gray-200 p-4 shadow-lg">
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {currentOptions.map((option) => (
                <Button
                  key={option.id}
                  variant="outline"
                  className="h-auto py-3 px-4 justify-start text-left hover:border-pink-300 hover:bg-pink-50 transition-all whitespace-pre-wrap"
                  onClick={() => handleSelectOption(option)}
                >
                  {option.content}
                </Button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
