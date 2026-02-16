import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { SlotScene } from './scenes/SlotScene';

export function SlotGameView({
  onBalanceChange,
  onWin,
  onSpinningChange,
  getBet,
  registerSpin
}: {
  onBalanceChange: (v: number) => void;
  onWin: (v: number) => void;
  onSpinningChange: (v: boolean) => void;
  getBet: () => number;
  registerSpin: (fn: () => boolean) => void;
}) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hostRef.current) return;

    const scene = new SlotScene(onBalanceChange, onWin, onSpinningChange, getBet, registerSpin);
    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: hostRef.current,
      width: 540,
      height: 960,
      backgroundColor: '#1a0a0a',
      scene: [scene],
      scale: { 
        mode: Phaser.Scale.FIT, 
        autoCenter: Phaser.Scale.CENTER_BOTH 
      },
      render: {
        antialias: true,
        pixelArt: false,
      }
    });

    return () => game.destroy(true);
  }, [getBet, onBalanceChange, onWin, onSpinningChange, registerSpin]);

  return <div ref={hostRef} style={{ width: '100%', height: '100%' }} />;
}
