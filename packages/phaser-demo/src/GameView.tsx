import { useEffect, useRef, type MutableRefObject } from 'react';
import Phaser from 'phaser';
import { MainScene } from './scenes/MainScene';

export type ControlState = {
  left: boolean;
  right: boolean;
  jump: boolean;
};

export function GameView({
  onScoreChange,
  controlsRef
}: {
  onScoreChange: (score: number) => void;
  controlsRef: MutableRefObject<ControlState>;
}) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hostRef.current) return;

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: hostRef.current,
      width: 960,
      height: 540,
      backgroundColor: '#1d1f27',
      physics: {
        default: 'arcade',
        arcade: { gravity: { x: 0, y: 800 }, debug: false }
      },
      scene: [new MainScene(onScoreChange, controlsRef)],
      scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH }
    };

    const game = new Phaser.Game(config);
    return () => game.destroy(true);
  }, [onScoreChange, controlsRef]);

  return <div ref={hostRef} style={{ width: '100%', height: '100%' }} />;
}
