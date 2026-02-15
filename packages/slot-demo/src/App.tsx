import { useRef, useState } from 'react';
import { SlotGameView } from './SlotGameView';

export function App() {
  const [balance, setBalance] = useState(1000);
  const [bet, setBet] = useState(20);
  const [lastWin, setLastWin] = useState(0);
  const spinRef = useRef<() => void>(() => {});

  return (
    <>
      <div style={{ position: 'fixed', top: 12, left: 12, right: 12, zIndex: 10, color: '#fff', fontFamily: 'system-ui' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
          <b>Balance: {balance}</b>
          <span>Bet: {bet}</span>
          <span>Win: {lastWin}</span>
        </div>
      </div>

      <SlotGameView
        onBalanceChange={setBalance}
        onWin={setLastWin}
        getBet={() => bet}
        registerSpin={(fn) => {
          spinRef.current = fn;
        }}
      />

      <div style={{ position: 'fixed', left: 0, right: 0, bottom: 20, zIndex: 10, display: 'flex', justifyContent: 'center', gap: 10 }}>
        <button onClick={() => setBet((b) => Math.max(10, b - 10))}>- Bet</button>
        <button style={{ padding: '10px 20px', fontWeight: 700 }} onClick={() => spinRef.current()}>SPIN</button>
        <button onClick={() => setBet((b) => Math.min(100, b + 10))}>+ Bet</button>
      </div>

      <div style={{ position: 'fixed', right: 10, bottom: 8, zIndex: 10, color: 'rgba(255,255,255,0.6)', fontSize: 12 }}>v0.1.0-slot-mvp</div>
    </>
  );
}
