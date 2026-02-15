import { useEffect, useMemo, useRef, type MutableRefObject } from 'react';
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

  const viewport = useMemo(() => {
    const portrait = window.innerHeight >= window.innerWidth;
    return portrait
      ? { width: 540, height: 960, portrait: true }
      : { width: 960, height: 540, portrait: false };
  }, []);

  useEffect(() => {
    if (!hostRef.current) return;

    const config: Phaser.Types.Core.GameConfig = {
      type: Phaser.AUTO,
      parent: hostRef.current,
      width: viewport.width,
      height: viewport.height,
      backgroundColor: '#1d1f27',
      physics: {
        default: 'arcade',
        arcade: { gravity: { x: 0, y: 1200 }, debug: false }
      },
      scene: [new MainScene(onScoreChange, controlsRef, viewport)],
      scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH }
    };

    const game = new Phaser.Game(config);
    return () => game.destroy(true);
  }, [onScoreChange, controlsRef, viewport]);

  return <div ref={hostRef} style={{ width: '100%', height: '100%' }} />;
}
