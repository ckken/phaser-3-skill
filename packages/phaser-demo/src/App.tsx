import { useMemo, useState } from 'react';
import { GameView } from './GameView';

const cardStyle: React.CSSProperties = {
  background: 'rgba(0,0,0,0.55)',
  border: '1px solid rgba(255,255,255,0.15)',
  borderRadius: 10,
  padding: '10px 12px',
  marginBottom: 10,
  backdropFilter: 'blur(4px)'
};

export function App() {
  const [score, setScore] = useState(0);
  const [seed, setSeed] = useState(1);

  const hud = useMemo(
    () => (
      <div
        style={{
          position: 'fixed',
          top: 12,
          left: 12,
          zIndex: 10,
          color: '#fff',
          fontFamily: 'Inter, system-ui, -apple-system, Segoe UI, sans-serif',
          width: 360,
          maxWidth: 'calc(100vw - 24px)'
        }}
      >
        <div style={cardStyle}>
          <div style={{ fontSize: 18, fontWeight: 700 }}>Phaser Demo · Phase 2</div>
          <div style={{ fontSize: 13, opacity: 0.9, marginTop: 4 }}>
            React + Phaser 集成完成，下面是当前阶段成果展示。
          </div>
        </div>

        <div style={cardStyle}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 6 }}>✅ 阶段二成果</div>
          <ul style={{ margin: 0, paddingLeft: 18, lineHeight: 1.5, fontSize: 13 }}>
            <li>React 容器挂载 Phaser 游戏</li>
            <li>HUD 实时显示分数（Score）</li>
            <li>Restart 按钮可一键重开场景</li>
            <li>拾取 Coin 计分并随机刷新位置</li>
          </ul>
        </div>

        <div style={cardStyle}>
          <div style={{ fontSize: 14, fontWeight: 600 }}>实时状态</div>
          <div style={{ marginTop: 6, fontSize: 14 }}>Score: <b>{score}</b></div>
          <button
            onClick={() => setSeed((v) => v + 1)}
            style={{
              marginTop: 8,
              border: 0,
              borderRadius: 8,
              padding: '8px 12px',
              fontWeight: 600,
              cursor: 'pointer'
            }}
          >
            Restart
          </button>
        </div>
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
