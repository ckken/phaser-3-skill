import { useEffect, useRef, useState, useCallback } from 'react';
import { SlotGameView } from './SlotGameView';

const BET_OPTIONS = [10, 25, 50, 100];

export function App() {
  const [balance, setBalance] = useState(1000);
  const [displayBalance, setDisplayBalance] = useState(1000);
  const [bet, setBet] = useState(25);
  const [lastWin, setLastWin] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [autoLeft, setAutoLeft] = useState(0);
  const [autoTotal, setAutoTotal] = useState(0);

  const spinRef = useRef<() => boolean>(() => false);
  const balanceAnimRef = useRef<number | null>(null);

  // 余额数字滚动动画
  useEffect(() => {
    if (balanceAnimRef.current) cancelAnimationFrame(balanceAnimRef.current);

    const start = displayBalance;
    const end = balance;
    const duration = 500;
    const startTime = performance.now();

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplayBalance(Math.round(start + (end - start) * eased));

      if (progress < 1) {
        balanceAnimRef.current = requestAnimationFrame(animate);
      }
    };

    balanceAnimRef.current = requestAnimationFrame(animate);
    return () => {
      if (balanceAnimRef.current) cancelAnimationFrame(balanceAnimRef.current);
    };
  }, [balance]);

  // Auto spin 逻辑
  useEffect(() => {
    if (autoLeft <= 0) return;
    if (spinning) return;

    const timer = setTimeout(() => {
      const ok = spinRef.current();
      if (ok) {
        setAutoLeft((v) => Math.max(0, v - 1));
      } else {
        setAutoLeft(0);
        setAutoTotal(0);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [autoLeft, spinning]);

  const handleSpin = useCallback(() => {
    spinRef.current();
  }, []);

  const handleAuto = useCallback((count: number) => {
    setAutoLeft(count);
    setAutoTotal(count);
  }, []);

  const handleStopAuto = useCallback(() => {
    setAutoLeft(0);
    setAutoTotal(0);
  }, []);

  const handleBetSelect = useCallback((value: number) => {
    if (!spinning) setBet(value);
  }, [spinning]);

  const handleMaxBet = useCallback(() => {
    if (!spinning) setBet(Math.min(balance, 100));
  }, [spinning, balance]);

  const autoProgress = autoTotal > 0 ? ((autoTotal - autoLeft) / autoTotal) * 100 : 0;

  return (
    <div style={styles.container}>
      {/* 顶部信息栏 */}
      <div style={styles.topBar}>
        <div style={styles.infoCard}>
          <span style={styles.infoLabel}>CRÉDITO</span>
          <span style={styles.infoValue}>{displayBalance.toLocaleString()}</span>
        </div>
        <div style={styles.infoCard}>
          <span style={styles.infoLabel}>APUESTA</span>
          <span style={styles.infoValue}>{bet}</span>
        </div>
        <div style={{ ...styles.infoCard, ...(lastWin > 0 ? styles.infoCardWin : {}) }}>
          <span style={styles.infoLabel}>GANANCIA</span>
          <span style={{ ...styles.infoValue, color: lastWin > 0 ? '#ffd700' : '#fff' }}>
            {lastWin > 0 ? `+${lastWin}` : '0'}
          </span>
        </div>
      </div>

      {/* 状态指示 */}
      {spinning && (
        <div style={styles.spinningIndicator}>
          <span style={styles.spinningDot}>●</span> GIRANDO...
        </div>
      )}

      {/* 游戏视图 */}
      <SlotGameView
        onBalanceChange={setBalance}
        onWin={setLastWin}
        onSpinningChange={setSpinning}
        getBet={() => bet}
        registerSpin={(fn) => { spinRef.current = fn; }}
      />

      {/* 下注选择器 */}
      <div style={styles.betSelector}>
        {BET_OPTIONS.map((v) => (
          <button
            key={v}
            disabled={spinning}
            onClick={() => handleBetSelect(v)}
            style={{
              ...styles.betBtn,
              ...(bet === v ? styles.betBtnActive : {}),
              ...(spinning ? styles.btnDisabled : {})
            }}
          >
            {v}
          </button>
        ))}
        <button
          disabled={spinning}
          onClick={handleMaxBet}
          style={{
            ...styles.betBtn,
            ...styles.betBtnMax,
            ...(spinning ? styles.btnDisabled : {})
          }}
        >
          MAX
        </button>
      </div>

      {/* Auto 进度条 */}
      {autoLeft > 0 && (
        <div style={styles.autoProgressContainer}>
          <div style={{ ...styles.autoProgressBar, width: `${autoProgress}%` }} />
          <span style={styles.autoProgressText}>{autoLeft}/{autoTotal}</span>
        </div>
      )}

      {/* 底部控制栏 */}
      <div style={styles.bottomControls}>
        <button
          disabled={spinning}
          onClick={() => setBet((b) => Math.max(10, b - 5))}
          style={{ ...styles.sideBtn, ...(spinning ? styles.btnDisabled : {}) }}
        >
          −
        </button>

        <button
          disabled={spinning}
          onClick={handleSpin}
          style={{
            ...styles.spinBtn,
            ...(spinning ? styles.spinBtnDisabled : {})
          }}
        >
          {spinning ? '...' : '¡GIRAR!'}
        </button>

        <button
          disabled={spinning}
          onClick={() => setBet((b) => Math.min(100, b + 5))}
          style={{ ...styles.sideBtn, ...(spinning ? styles.btnDisabled : {}) }}
        >
          +
        </button>

        {autoLeft > 0 ? (
          <button onClick={handleStopAuto} style={styles.stopBtn}>
            PARAR
          </button>
        ) : (
          <button
            disabled={spinning}
            onClick={() => handleAuto(10)}
            style={{ ...styles.autoBtn, ...(spinning ? styles.btnDisabled : {}) }}
          >
            AUTO ×10
          </button>
        )}
      </div>

      <div style={styles.version}>TORO SLOTS v1.0</div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'relative',
    width: '100%',
    height: '100%',
    fontFamily: "'Georgia', 'Times New Roman', serif",
    background: 'linear-gradient(180deg, #1a0a0a 0%, #0d0505 100%)',
  },
  topBar: {
    position: 'fixed',
    top: 8,
    left: 8,
    right: 8,
    zIndex: 10,
    display: 'flex',
    justifyContent: 'space-between',
    gap: 6,
  },
  infoCard: {
    flex: 1,
    background: 'linear-gradient(180deg, #2d1515 0%, #1a0a0a 100%)',
    borderRadius: 8,
    padding: '6px 10px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    border: '2px solid #b8860b',
    boxShadow: '0 4px 12px rgba(0,0,0,0.5), inset 0 1px 0 rgba(255,215,0,0.1)',
  },
  infoCardWin: {
    border: '2px solid #ffd700',
    boxShadow: '0 4px 12px rgba(255,215,0,0.3), inset 0 1px 0 rgba(255,215,0,0.2)',
  },
  infoLabel: {
    fontSize: 9,
    color: '#b8860b',
    letterSpacing: 1,
    fontWeight: 'bold',
  },
  infoValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff8dc',
    marginTop: 2,
    textShadow: '0 2px 4px rgba(0,0,0,0.5)',
  },
  spinningIndicator: {
    position: 'fixed',
    top: 75,
    left: '50%',
    transform: 'translateX(-50%)',
    zIndex: 10,
    color: '#ffd700',
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  spinningDot: {
    display: 'inline-block',
    animation: 'pulse 0.5s ease-in-out infinite',
    color: '#c41e3a',
  },
  betSelector: {
    position: 'fixed',
    bottom: 110,
    left: 0,
    right: 0,
    zIndex: 10,
    display: 'flex',
    justifyContent: 'center',
    gap: 8,
  },
  betBtn: {
    padding: '8px 18px',
    fontSize: 14,
    fontWeight: 'bold',
    color: '#fff8dc',
    background: 'linear-gradient(180deg, #3d2020 0%, #2d1515 100%)',
    border: '2px solid #8b4513',
    borderRadius: 6,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    fontFamily: 'inherit',
  },
  betBtnActive: {
    color: '#ffd700',
    background: 'linear-gradient(180deg, #5d3030 0%, #4d2525 100%)',
    border: '2px solid #ffd700',
    boxShadow: '0 0 10px rgba(255,215,0,0.4)',
  },
  betBtnMax: {
    color: '#ffd700',
    border: '2px solid #cd7f32',
  },
  autoProgressContainer: {
    position: 'fixed',
    bottom: 100,
    left: 30,
    right: 30,
    height: 6,
    background: 'rgba(139,69,19,0.3)',
    borderRadius: 3,
    zIndex: 10,
    overflow: 'hidden',
  },
  autoProgressBar: {
    height: '100%',
    background: 'linear-gradient(90deg, #ffd700, #cd7f32)',
    borderRadius: 3,
    transition: 'width 0.3s ease',
  },
  autoProgressText: {
    position: 'absolute',
    right: 0,
    top: -16,
    fontSize: 10,
    color: '#b8860b',
  },
  bottomControls: {
    position: 'fixed',
    left: 0,
    right: 0,
    bottom: 30,
    zIndex: 10,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  sideBtn: {
    width: 48,
    height: 48,
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff8dc',
    background: 'linear-gradient(180deg, #3d2020 0%, #2d1515 100%)',
    border: '2px solid #8b4513',
    borderRadius: 8,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    boxShadow: '0 4px 8px rgba(0,0,0,0.4)',
    fontFamily: 'inherit',
  },
  spinBtn: {
    width: 100,
    height: 100,
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff8dc',
    background: 'linear-gradient(180deg, #c41e3a 0%, #8b0000 100%)',
    border: '4px solid #ffd700',
    borderRadius: '50%',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    boxShadow: '0 6px 20px rgba(196,30,58,0.5), inset 0 2px 0 rgba(255,255,255,0.2)',
    fontFamily: 'inherit',
    letterSpacing: 1,
  },
  spinBtnDisabled: {
    background: 'linear-gradient(180deg, #4d2525 0%, #3d1515 100%)',
    border: '4px solid #8b4513',
    boxShadow: '0 4px 12px rgba(0,0,0,0.4)',
    cursor: 'not-allowed',
  },
  autoBtn: {
    padding: '14px 18px',
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ffd700',
    background: 'linear-gradient(180deg, #3d2020 0%, #2d1515 100%)',
    border: '2px solid #b8860b',
    borderRadius: 8,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    boxShadow: '0 4px 8px rgba(0,0,0,0.4)',
    fontFamily: 'inherit',
    letterSpacing: 1,
  },
  stopBtn: {
    padding: '14px 18px',
    fontSize: 12,
    fontWeight: 'bold',
    color: '#ff6b6b',
    background: 'linear-gradient(180deg, #4d2020 0%, #3d1010 100%)',
    border: '2px solid #c41e3a',
    borderRadius: 8,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    boxShadow: '0 4px 8px rgba(0,0,0,0.4)',
    fontFamily: 'inherit',
    letterSpacing: 1,
  },
  btnDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  version: {
    position: 'fixed',
    right: 10,
    bottom: 6,
    zIndex: 10,
    color: 'rgba(184,134,11,0.5)',
    fontSize: 10,
    letterSpacing: 1,
  },
};

// CSS 动画
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.3; }
  }
`;
document.head.appendChild(styleSheet);
