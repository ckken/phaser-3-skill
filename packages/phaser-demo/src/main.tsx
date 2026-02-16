import React from 'react';
import ReactDOM from 'react-dom/client';
import { Router, Route, Switch } from 'wouter';
import { App } from './App';
import { Home } from './Home';

const BASE_PATH = '/phaser-3-skill';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Router base={BASE_PATH}>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/game" component={App} />
        {/* 其他路径 fallback 到首页 */}
        <Route component={Home} />
      </Switch>
    </Router>
  </React.StrictMode>
);
