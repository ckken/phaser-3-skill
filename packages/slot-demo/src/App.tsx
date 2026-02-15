import { useEffect, useRef, useState, useCallback } from 'react';
import { SlotGameView } from './SlotGameView';

const BET_OPTIONS = [10, 50, 100];

export function App() {
  const [balance, setBalance] = useState(1000);
  const [displayBalance, setDisplayBalance] = useState(1000);
  const [bet, setBet] = useState(20);
  const [lastWin, setLastWin] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [autoLeft, setAutoLeft] = useState(0);
  const [autoTotal, setAutoTotal] = useState(0);

  const spinRef = useRef<() => boolean>(() => false);
  const balanceAnimRef = useRef<number | null>(null);

  // Phase 3: 余额数字滚动动画
  useEffect(() => {
    if (balanceAnimRef.current) cancelAnimationFrame(balanceAnimRef.current);

    const start = displayBalance;
    const end = balance;
    const duration = 600;
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
    }, 300);

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
      {/* Phase 4: 顶部 HUD */}
      <div style={styles.topHud}>
        <div style={styles.hudCard}>
          <span style={styles.hudLabel}>余额</span>
          <span style={styles.hudValue}>{displayBalance.toLocaleString()}</span>
        </div>
        <div style={styles.hudCard}>
          <span style={styles.hudLabel}>下注</span>
          <span style={styles.hudValue}>{bet}</span>
        </div>
        <div style={{ ...styles.hudCard, ...(lastWin > 0 ? styles.hudCardWin : {}) }}>
          <span style={styles.hudLabel}>中奖</span>
          <span style={{ ...styles.hudValue, color: lastWin > 0 ? '#ffd700' : '#fff' }}>
            {lastWin > 0 ? `+${lastWin}` : '0'}
          </span>
        </div>
      </div>

      {/* 状态栏 */}
      <div style={styles.statusBar}>
        <span style={{ color: spinning ? '#6ef2ff' : '#8a9ab0' }}>
          {spinning ? '🎰 旋转中...' : '⏸ 待机'}
        </span>
        {autoLeft > 0 && (
          <span style={styles.autoStatus}>
            自动: {autoLeft}/{autoTotal}
          </span>
        )}
      </div>

      <SlotGameView
        onBalanceChange={setBalance}
        onWin={setLastWin}
        onSpinningChange={setSpinning}
        getBet={() => bet}
        registerSpin={(fn) => { spinRef.current = fn; }}
      />

      {/* Phase 3: 下注快捷选择 */}
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

      {/* Phase 3: Auto 进度条 */}
      {autoLeft > 0 && (
        <div style={styles.autoProgressContainer}>
          <div style={{ ...styles.autoProgressBar, width: `${autoProgress}%` }} />
        </div>
      )}

      {/* 底部控制栏 */}
      <div style={styles.bottomControls}>
        <button
          disabled={spinning}
          onClick={() => setBet((b) => Math.max(10, b - 10))}
          style={{ ...styles.controlBtn, ...(spinning ? styles.btnDisabled : {}) }}
        >
          -
        </button>

        <button
          disabled={spinning}
          onClick={handleSpin}
          style={{
            ...styles.spinBtn,
            ...(spinning ? styles.spinBtnSpinning : {})
          }}
        >
          {spinning ? (
            <span style={styles.spinnerIcon}>⟳</span>
          ) : (
            '开始'
          )}
        </button>

        <button
          disabled={spinning}
          onClick={() => setBet((b) => Math.min(100, b + 10))}
          style={{ ...styles.controlBtn, ...(spinning ? styles.btnDisabled : {}) }}
        >
          +
        </button>

        {autoLeft > 0 ? (
          <button onClick={handleStopAuto} style={styles.stopBtn}>
            停止
          </button>
        ) : (
          <button
            disabled={spinning}
            onClick={() => handleAuto(10)}
            style={{ ...styles.autoBtn, ...(spinning ? styles.btnDisabled : {}) }}
          >
            自动×10
          </button>
        )}
      </div>

      <div style={styles.version}>v0.4.2-no-flicker</div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    position: 'relative',
    width: '100%',
    height: '100%',
    fontFamily: "'SF Pro Display', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
  },
  topHud: {
    position: 'fixed',
    top: 8,
    left: 8,
    right: 8,
    zIndex: 10,
    display: 'flex',
    justifyContent: 'space-between',
    gap: 8,
  },
  hudCard: {
    flex: 1,
    background: 'linear-gradient(135deg, rgba(30,35,50,0.95) 0%, rgba(20,25,40,0.95) 100%)',
    borderRadius: 10,
    padding: '8px 12px',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    border: '1px solid rgba(110,242,255,0.2)',
    boxShadow: '0 4px 12px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.05)',
  },
  hudCardWin: {
    border: '1px solid rgba(255,215,0,0.5)',
    boxShadow: '0 4px 12px rgba(255,215,0,0.2), inset 0 1px 0 rgba(255,255,255,0.05)',
  },
  hudLabel: {
    fontSize: 10,
    color: '#8a9ab0',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  hudValue: {
    fontSize: 18,
    fontWeight: 700,
    color: '#fff',
    marginTop: 2,
  },
  statusBar: {
    position: 'fixed',
    top: 72,
    left: 12,
    right: 12,
    zIndex: 10,
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: 12,
  },
  autoStatus: {
    color: '#6ef2ff',
    fontWeight: 600,
  },
  betSelector: {
    position: 'fixed',
    bottom: 100,
    left: 0,
    right: 0,
    zIndex: 10,
    display: 'flex',
    justifyContent: 'center',
    gap: 8,
  },
  betBtn: {
    padding: '6px 16px',
    fontSize: 13,
    fontWeight: 600,
    color: '#c8d2e8',
    background: 'linear-gradient(180deg, rgba(40,45,60,0.9) 0%, rgba(30,35,50,0.9) 100%)',
    border: '1px solid rgba(110,242,255,0.15)',
    borderRadius: 6,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
  },
  betBtnActive: {
    color: '#fff',
    background: 'linear-gradient(180deg, rgba(110,242,255,0.3) 0%, rgba(80,200,220,0.2) 100%)',
    border: '1px solid rgba(110,242,255,0.5)',
    boxShadow: '0 0 12px rgba(110,242,255,0.3)',
  },
  betBtnMax: {
    color: '#ffd700',
    border: '1px solid rgba(255,215,0,0.3)',
  },
  autoProgressContainer: {
    position: 'fixed',
    bottom: 92,
    left: 20,
    right: 20,
    height: 3,
    background: 'rgba(255,255,255,0.1)',
    borderRadius: 2,
    zIndex: 10,
    overflow: 'hidden',
  },
  autoProgressBar: {
    height: '100%',
    background: 'linear-gradient(90deg, #6ef2ff, #4ecdc4)',
    borderRadius: 2,
    transition: 'width 0.3s ease',
  },
  bottomControls: {
    position: 'fixed',
    left: 0,
    right: 0,
    bottom: 28,
    zIndex: 10,
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  controlBtn: {
    width: 44,
    height: 44,
    fontSize: 20,
    fontWeight: 700,
    color: '#c8d2e8',
    background: 'linear-gradient(180deg, rgba(50,55,70,0.95) 0%, rgba(35,40,55,0.95) 100%)',
    border: '1px solid rgba(110,242,255,0.2)',
    borderRadius: 10,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
  },
  spinBtn: {
    width: 80,
    height: 80,
    fontSize: 18,
    fontWeight: 700,
    color: '#fff',
    background: 'linear-gradient(180deg, #ff6b6b 0%, #ee5a5a 50%, #d94848 100%)',
    border: '2px solid rgba(255,255,255,0.2)',
    borderRadius: '50%',
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    boxShadow: '0 6px 20px rgba(255,107,107,0.4), inset 0 2px 0 rgba(255,255,255,0.2)',
  },
  spinBtnSpinning: {
    background: 'linear-gradient(180deg, #666 0%, #555 50%, #444 100%)',
    boxShadow: '0 4px 12px rgba(0,0,0,0.3)',
    cursor: 'not-allowed',
  },
  spinnerIcon: {
    display: 'inline-block',
    animation: 'spin 1s linear infinite',
    fontSize: 28,
  },
  autoBtn: {
    padding: '12px 16px',
    fontSize: 13,
    fontWeight: 600,
    color: '#6ef2ff',
    background: 'linear-gradient(180deg, rgba(50,55,70,0.95) 0%, rgba(35,40,55,0.95) 100%)',
    border: '1px solid rgba(110,242,255,0.3)',
    borderRadius: 10,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
  },
  stopBtn: {
    padding: '12px 16px',
    fontSize: 13,
    fontWeight: 600,
    color: '#ff6b6b',
    background: 'linear-gradient(180deg, rgba(80,40,40,0.95) 0%, rgba(60,30,30,0.95) 100%)',
    border: '1px solid rgba(255,107,107,0.4)',
    borderRadius: 10,
    cursor: 'pointer',
    transition: 'all 0.15s ease',
    boxShadow: '0 4px 8px rgba(0,0,0,0.3)',
  },
  btnDisabled: {
    opacity: 0.5,
    cursor: 'not-allowed',
  },
  version: {
    position: 'fixed',
    right: 10,
    bottom: 4,
    zIndex: 10,
    color: 'rgba(255,255,255,0.4)',
    fontSize: 10,
  },
};

// 添加 CSS 动画
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;
document.head.appendChild(styleSheet);
