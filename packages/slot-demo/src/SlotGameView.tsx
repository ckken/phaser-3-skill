import { useEffect, useRef } from 'react';
import Phaser from 'phaser';
import { SlotScene } from './scenes/SlotScene';

export function SlotGameView({
  onBalanceChange,
  onWin,
  getBet,
  registerSpin
}: {
  onBalanceChange: (v: number) => void;
  onWin: (v: number) => void;
  getBet: () => number;
  registerSpin: (fn: () => void) => void;
}) {
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!hostRef.current) return;

    const scene = new SlotScene(onBalanceChange, onWin, getBet, registerSpin);
    const game = new Phaser.Game({
      type: Phaser.AUTO,
      parent: hostRef.current,
      width: 540,
      height: 960,
      backgroundColor: '#131724',
      scene: [scene],
      scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH }
    });

    return () => game.destroy(true);
  }, [getBet, onBalanceChange, onWin, registerSpin]);

  return <div ref={hostRef} style={{ width: '100%', height: '100%' }} />;
}
