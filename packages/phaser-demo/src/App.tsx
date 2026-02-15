import { useMemo, useState } from 'react';
import { GameView } from './GameView';

export function App() {
  const [score, setScore] = useState(0);
  const [seed, setSeed] = useState(1);

  const hud = useMemo(
    () => (
      <div style={{ position: 'fixed', top: 12, left: 12, zIndex: 10, color: '#fff', fontFamily: 'system-ui' }}>
        <div>Score: {score}</div>
        <button onClick={() => setSeed((v) => v + 1)} style={{ marginTop: 8 }}>Restart</button>
      </div>
    ),
    [score]
  );

  return (
    <>
      {hud}
      <GameView key={seed} onScoreChange={setScore} />
    </>
  );
}
