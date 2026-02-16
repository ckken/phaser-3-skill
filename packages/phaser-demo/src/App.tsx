import { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'wouter';
import { GameView, type ControlState } from './GameView';

const VERSION = 'v0.5.0';

function touchHandlers(setter: (v: boolean) => void) {
  return {
    onPointerDown: () => setter(true),
    onPointerUp: () => setter(false),
    onPointerCancel: () => setter(false),
    onPointerLeave: () => setter(false)
  };
}

export function App() {
  const [score, setScore] = useState(0);
  const [seed, setSeed] = useState(1);

  const [left, setLeft] = useState(false);
  const [right, setRight] = useState(false);
  const [jump, setJump] = useState(false);

  const controls: ControlState = useMemo(() => ({ left, right, jump }), [left, right, jump]);
  const controlsRef = useRef<ControlState>(controls);
  controlsRef.current = controls;

  useEffect(() => {
    const prevent = (e: Event) => e.preventDefault();
    document.addEventListener('gesturestart', prevent as EventListener, { passive: false });
    document.addEventListener('gesturechange', prevent as EventListener, { passive: false });
    document.addEventListener('gestureend', prevent as EventListener, { passive: false });

    const touchMove = (e: TouchEvent) => {
      if (e.touches.length > 1) e.preventDefault();
    };
    document.addEventListener('touchmove', touchMove, { passive: false });

    return () => {
      document.removeEventListener('gesturestart', prevent as EventListener);
      document.removeEventListener('gesturechange', prevent as EventListener);
      document.removeEventListener('gestureend', prevent as EventListener);
      document.removeEventListener('touchmove', touchMove);
    };
  }, []);

  return (
    <>
      <div
        style={{
          position: 'fixed',
          top: 10,
          left: 12,
          zIndex: 20,
          color: '#fff',
          fontFamily: 'Inter, system-ui, sans-serif',
          display: 'flex',
          gap: 10,
          alignItems: 'center'
        }}
      >
        <Link
          href="/"
          style={{ border: 0, borderRadius: 8, padding: '6px 10px', fontWeight: 600, cursor: 'pointer', background: 'rgba(255,255,255,0.9)', textDecoration: 'none', color: '#000' }}
        >
          ← 首页
        </Link>
        <div style={{ fontWeight: 700 }}>Score: {score}</div>
        <button
          onClick={() => setSeed((v) => v + 1)}
          style={{ border: 0, borderRadius: 8, padding: '6px 10px', fontWeight: 600, cursor: 'pointer', background: 'rgba(255,255,255,0.9)' }}
        >
          Restart
        </button>
      </div>

      <div
        style={{
          position: 'fixed',
          right: 10,
          bottom: 8,
          zIndex: 20,
          color: 'rgba(255,255,255,0.7)',
          fontSize: 12,
          fontFamily: 'ui-monospace, SFMono-Regular, Menlo, monospace'
        }}
      >
        {VERSION}
      </div>

      <GameView key={seed} onScoreChange={setScore} controlsRef={controlsRef} />

      {/* Mobile controls */}
      <div
        style={{
          position: 'fixed',
          left: 10,
          right: 10,
          bottom: 16,
          zIndex: 30,
          display: 'flex',
          justifyContent: 'space-between',
          pointerEvents: 'none'
        }}
      >
        <div style={{ display: 'flex', gap: 10, pointerEvents: 'auto' }}>
          <button
            aria-label="left"
            {...touchHandlers(setLeft)}
            style={{ width: 58, height: 58, borderRadius: 999, border: '1px solid rgba(255,255,255,0.35)', background: 'rgba(0,0,0,0.35)', color: '#fff', fontSize: 18 }}
          >
            ◀
          </button>
          <button
            aria-label="right"
            {...touchHandlers(setRight)}
            style={{ width: 58, height: 58, borderRadius: 999, border: '1px solid rgba(255,255,255,0.35)', background: 'rgba(0,0,0,0.35)', color: '#fff', fontSize: 18 }}
          >
            ▶
          </button>
        </div>

        <button
          aria-label="jump"
          {...touchHandlers(setJump)}
          style={{ width: 64, height: 64, borderRadius: 999, border: '1px solid rgba(255,255,255,0.35)', background: 'rgba(0,0,0,0.35)', color: '#fff', fontSize: 16, pointerEvents: 'auto' }}
        >
          JUMP
        </button>
      </div>
    </>
  );
}
