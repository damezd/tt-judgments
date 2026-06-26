import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import CardRenderPage from './components/CardRenderPage';

// Fonts (self-hosted via fontsource)
import '@fontsource/dm-serif-display/400.css';
import '@fontsource/dm-serif-display/400-italic.css';
import '@fontsource/inter/400.css';
import '@fontsource/inter/500.css';
import '@fontsource/inter/600.css';
import '@fontsource/inter/700.css';
import '@fontsource/inter/800.css';
import '@fontsource/jetbrains-mono/500.css';
import '@fontsource/jetbrains-mono/600.css';

import './index.css';

const isCard = new URLSearchParams(window.location.search).has('card');

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {isCard ? <CardRenderPage /> : <App />}
  </React.StrictMode>
);
