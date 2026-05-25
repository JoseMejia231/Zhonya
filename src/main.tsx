import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import {FinanceProvider} from './context/FinanceContext';
import './index.css';

window.addEventListener('error', (event) => {
  document.body.innerHTML = `<div style="padding: 20px; color: red; font-family: monospace; z-index: 9999; position: fixed; inset: 0; background: white; overflow: auto;">
    <h2>App Crashed!</h2>
    <pre>${event.error?.stack || event.message}</pre>
  </div>`;
});

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <FinanceProvider>
      <App />
    </FinanceProvider>
  </StrictMode>,
);

if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .catch((err) => console.error('Fallo al registrar el Service Worker:', err));
  });
}
