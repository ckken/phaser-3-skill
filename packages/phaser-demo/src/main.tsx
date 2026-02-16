import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { Home } from './Home';

// 检查是否在首页
const isHome = window.location.pathname === '/phaser-3-skill/' || 
               window.location.pathname === '/phaser-3-skill' ||
               window.location.hash === '#home';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    {isHome ? <Home /> : <App />}
  </React.StrictMode>
);
