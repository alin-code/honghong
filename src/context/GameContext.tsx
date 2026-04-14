'use client';

import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import {
  GameState,
  Gender,
  Scenario,
  VoiceType,
  Option,
  Message,
  INITIAL_AFFECTION,
  MAX_AFFECTION,
  MIN_AFFECTION,
  WIN_AFFECTION,
  MAX_ROUNDS,
} from '@/types/game';

interface GameContextType {
  gameState: GameState;
  setGender: (gender: Gender) => void;
  setScenario: (scenario: Scenario) => void;
  setVoiceType: (voiceType: VoiceType) => void;
  startGame: () => void;
  selectOption: (option: Option) => void;
  resetGame: () => void;
  addPartnerMessage: (content: string, options: Option[]) => void;
  setLoading: (loading: boolean) => void;
  isLoading: boolean;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

const initialGameState: GameState = {
  step: 0,
  affection: INITIAL_AFFECTION,
  gender: null,
  scenario: null,
  voiceType: null,
  messages: [],
  currentOptions: [],
  gameOver: false,
  won: false,
};

export function GameProvider({ children }: { children: ReactNode }) {
  const [gameState, setGameState] = useState<GameState>(initialGameState);
  const [isLoading, setIsLoading] = useState(false);

  const setGender = useCallback((gender: Gender) => {
    setGameState(prev => ({ ...prev, gender }));
  }, []);

  const setScenario = useCallback((scenario: Scenario) => {
    setGameState(prev => ({ ...prev, scenario }));
  }, []);

  const setVoiceType = useCallback((voiceType: VoiceType) => {
    setGameState(prev => ({ ...prev, voiceType }));
  }, []);

  const setLoading = useCallback((loading: boolean) => {
    setIsLoading(loading);
  }, []);

  const startGame = useCallback(() => {
    setGameState(prev => {
      // 使用函数式更新，从 prev 读取最新值
      const gender = prev.gender;
      const scenario = prev.scenario;
      const voiceType = prev.voiceType;

      if (!gender || !scenario || !voiceType) {
        console.error('Missing game config:', { gender, scenario, voiceType });
        return prev;
      }

      return {
        ...prev,
        step: 1,
        messages: [],
        currentOptions: [],
        gameOver: false,
        won: false,
        affection: INITIAL_AFFECTION,
      };
    });
  }, []);

  const selectOption = useCallback((option: Option) => {
    setGameState(prev => {
      // 计算新的好感度
      let newAffection = prev.affection + option.score;
      newAffection = Math.max(MIN_AFFECTION, Math.min(MAX_AFFECTION, newAffection));

      // 添加用户消息
      const userMessage: Message = {
        role: 'user',
        content: option.content,
      };

      const newMessages = [...prev.messages, userMessage];
      const newStep = prev.step + 1;

      // 检查游戏是否结束
      let gameOver = false;
      let won = false;

      if (newAffection <= MIN_AFFECTION) {
        // 好感度太低，失败
        gameOver = true;
        won = false;
      } else if (newAffection >= WIN_AFFECTION) {
        // 好感度达标，胜利
        gameOver = true;
        won = true;
      } else if (newStep > MAX_ROUNDS) {
        // 10轮用完，未达标，失败
        gameOver = true;
        won = false;
      }

      return {
        ...prev,
        affection: newAffection,
        messages: newMessages,
        step: newStep,
        // 用户作答后先清空当前选项，下一轮由生成逻辑重新填充
        currentOptions: [],
        gameOver,
        won,
      };
    });
  }, []);

  const addPartnerMessage = useCallback((content: string, options: Option[]) => {
    setGameState(prev => {
      const partnerMessage: Message = {
        role: 'partner',
        content,
      };

      return {
        ...prev,
        messages: [...prev.messages, partnerMessage],
        currentOptions: options,
      };
    });
  }, []);

  const resetGame = useCallback(() => {
    setGameState(initialGameState);
    setIsLoading(false);
  }, []);

  return (
    <GameContext.Provider
      value={{
        gameState,
        setGender,
        setScenario,
        setVoiceType,
        startGame,
        selectOption,
        resetGame,
        addPartnerMessage,
        setLoading,
        isLoading,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}
