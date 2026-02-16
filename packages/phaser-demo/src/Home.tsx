import { useState } from 'react';

const BASE_PATH = '/phaser-3-skill';

export function Home() {
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  const games = [
    {
      id: 'phaser',
      title: '🎮 Phaser Demo',
      subtitle: 'Platformer Adventure',
      description: '经典平台跳跃游戏，收集金币，躲避障碍！',
      path: `${BASE_PATH}/#game`,
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      icon: '🏃',
    },
    {
      id: 'slot',
      title: '🎰 Slot Demo',
      subtitle: 'TORO SLOTS',
      description: '斗牛主题老虎机，体验西班牙风情！',
      path: `${BASE_PATH}/slot/`,
      gradient: 'linear-gradient(135deg, #c41e3a 0%, #8b0000 100%)',
      icon: '🐂',
    },
  ];

  const handleNavigate = (path: string) => {
    if (path.includes('#game')) {
      // 同页面内跳转到游戏
      window.location.hash = 'game';
      window.location.reload();
    } else {
      window.location.href = path;
    }
  };

  return (
    <div style={styles.container}>
      {/* 背景装饰 */}
      <div style={styles.bgPattern} />
      
      {/* 头部 */}
      <header style={styles.header}>
        <h1 style={styles.title}>
          <span style={styles.titleIcon}>🎮</span>
          Phaser 3 Skill
        </h1>
        <p style={styles.subtitle}>选择一个游戏开始体验</p>
      </header>

      {/* 游戏卡片 */}
      <div style={styles.cardGrid}>
        {games.map((game) => (
          <button
            key={game.id}
            onClick={() => handleNavigate(game.path)}
            onMouseEnter={() => setHoveredCard(game.id)}
            onMouseLeave={() => setHoveredCard(null)}
            style={{
              ...styles.card,
              background: game.gradient,
              transform: hoveredCard === game.id ? 'translateY(-8px) scale(1.02)' : 'translateY(0) scale(1)',
              boxShadow: hoveredCard === game.id 
                ? '0 20px 40px rgba(0,0,0,0.4)' 
                : '0 10px 30px rgba(0,0,0,0.3)',
            }}
          >
            <div style={styles.cardIcon}>{game.icon}</div>
            <h2 style={styles.cardTitle}>{game.title}</h2>
            <p style={styles.cardSubtitle}>{game.subtitle}</p>
            <p style={styles.cardDesc}>{game.description}</p>
            <div style={styles.playBtn}>
              ▶ 开始游戏
            </div>
          </button>
        ))}
      </div>

      {/* 底部 */}
      <footer style={styles.footer}>
        <p>Built with Phaser 3 + React + Vite</p>
      </footer>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    background: 'linear-gradient(180deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    padding: '40px 20px',
    fontFamily: "'Inter', 'Segoe UI', system-ui, sans-serif",
    position: 'relative',
    overflow: 'hidden',
  },
  bgPattern: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundImage: `radial-gradient(circle at 20% 50%, rgba(102, 126, 234, 0.1) 0%, transparent 50%),
                      radial-gradient(circle at 80% 50%, rgba(196, 30, 58, 0.1) 0%, transparent 50%)`,
    pointerEvents: 'none',
  },
  header: {
    textAlign: 'center',
    marginBottom: 50,
    zIndex: 1,
  },
  title: {
    fontSize: 'clamp(28px, 6vw, 48px)',
    fontWeight: 800,
    color: '#fff',
    margin: 0,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    textShadow: '0 4px 20px rgba(0,0,0,0.3)',
  },
  titleIcon: {
    fontSize: 'clamp(32px, 7vw, 56px)',
  },
  subtitle: {
    fontSize: 'clamp(14px, 3vw, 18px)',
    color: 'rgba(255,255,255,0.7)',
    marginTop: 12,
  },
  cardGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
    gap: 30,
    maxWidth: 700,
    width: '100%',
    zIndex: 1,
  },
  card: {
    border: 'none',
    borderRadius: 20,
    padding: '30px 24px',
    cursor: 'pointer',
    transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center',
    position: 'relative',
    overflow: 'hidden',
    // 防止点击闪动
    WebkitTapHighlightColor: 'transparent',
    outline: 'none',
  },
  cardIcon: {
    fontSize: 64,
    marginBottom: 16,
    filter: 'drop-shadow(0 4px 8px rgba(0,0,0,0.3))',
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: 700,
    color: '#fff',
    margin: '0 0 6px 0',
    textShadow: '0 2px 8px rgba(0,0,0,0.3)',
  },
  cardSubtitle: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.85)',
    margin: '0 0 12px 0',
    fontWeight: 500,
  },
  cardDesc: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.7)',
    margin: '0 0 20px 0',
    lineHeight: 1.5,
  },
  playBtn: {
    background: 'rgba(255,255,255,0.2)',
    backdropFilter: 'blur(10px)',
    padding: '10px 24px',
    borderRadius: 30,
    color: '#fff',
    fontWeight: 600,
    fontSize: 14,
    border: '1px solid rgba(255,255,255,0.3)',
  },
  footer: {
    marginTop: 'auto',
    paddingTop: 40,
    color: 'rgba(255,255,255,0.4)',
    fontSize: 12,
    zIndex: 1,
  },
};

// 添加全局样式
const styleSheet = document.createElement('style');
styleSheet.textContent = `
  * {
    -webkit-tap-highlight-color: transparent;
    box-sizing: border-box;
  }
  
  body {
    margin: 0;
    padding: 0;
  }
  
  @media (max-width: 600px) {
    .card-grid {
      grid-template-columns: 1fr;
    }
  }
`;
document.head.appendChild(styleSheet);
