import { useEffect, useRef, useState } from 'react';
import { SlotGameView } from './SlotGameView';

export function App() {
  const [balance, setBalance] = useState(1000);
  const [bet, setBet] = useState(20);
  const [lastWin, setLastWin] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [autoLeft, setAutoLeft] = useState(0);

  const spinRef = useRef<() => boolean>(() => false);

  useEffect(() => {
    if (autoLeft <= 0) return;
    if (spinning) return;

    const ok = spinRef.current();
    if (ok) {
      setAutoLeft((v) => Math.max(0, v - 1));
    } else {
      setAutoLeft(0);
    }
  }, [autoLeft, spinning]);

  return (
    <>
      <div style={{ position: 'fixed', top: 12, left: 12, right: 12, zIndex: 10, color: '#fff', fontFamily: 'system-ui' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
          <b>余额: {balance}</b>
          <span>下注: {bet}</span>
          <span>本轮中奖: {lastWin}</span>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, opacity: 0.85, marginTop: 4 }}>
          <span>{spinning ? '旋转中...' : '待机'}</span>
          <span>自动: {autoLeft}</span>
        </div>
      </div>

      <SlotGameView
        onBalanceChange={setBalance}
        onWin={setLastWin}
        onSpinningChange={setSpinning}
        getBet={() => bet}
        registerSpin={(fn) => {
          spinRef.current = fn;
        }}
      />

      <div style={{ position: 'fixed', left: 0, right: 0, bottom: 20, zIndex: 10, display: 'flex', justifyContent: 'center', gap: 10 }}>
        <button disabled={spinning} onClick={() => setBet((b) => Math.max(10, b - 10))}>-下注</button>
        <button disabled={spinning} style={{ padding: '10px 20px', fontWeight: 700 }} onClick={() => spinRef.current()}>开始旋转</button>
        <button disabled={spinning} onClick={() => setBet((b) => Math.min(100, b + 10))}>+下注</button>
        <button disabled={spinning} onClick={() => setAutoLeft(10)}>自动x10</button>
      </div>

      <div style={{ position: 'fixed', right: 10, bottom: 8, zIndex: 10, color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>v0.3.0-product-polish</div>
    </>
  );
}
