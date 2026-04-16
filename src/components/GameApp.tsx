'use client';

import { GameProvider, useGame } from '@/context/GameContext';
import { StartScreen } from '@/components/StartScreen';
import { GameScreen } from '@/components/GameScreen';
import { GameOverScreen } from '@/components/GameOverScreen';

function GameContent() {
  const { gameState } = useGame();
  const { step, gameOver } = gameState;

  if (step === 0) {
    return <StartScreen />;
  }

  if (gameOver) {
    return <GameOverScreen />;
  }

  return <GameScreen />;
}

export function GameApp() {
  return (
    <GameProvider>
      <GameContent />
    </GameProvider>
  );
}
