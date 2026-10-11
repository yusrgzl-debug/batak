import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './ui/App';
import { CardSheet } from './ui/CardSheet';
import './ui/styles.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    {import.meta.env.DEV && location.hash === '#kartlar' ? <CardSheet /> : <App />}
  </StrictMode>,
);
