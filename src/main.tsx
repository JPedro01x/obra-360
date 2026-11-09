import React from 'react';
import ReactDOM from 'react-dom/client';
import { ErrorBoundary } from './components/ErrorBoundary.tsx';
import './index.css';
import { DEMO_MODE } from './services/http';
import { Workspace } from './components/Workspace';
const DemoApp = React.lazy(() => import('./App').then((m) => ({ default: m.App })));

// Update only existing registrations so older installations retire their cache.
if ('serviceWorker' in navigator) {
  navigator.serviceWorker
    .getRegistrations()
    .then((registrations) => {
      for (const registration of registrations) {
        const script = registration.active?.scriptURL;
        if (
          script &&
          new URL(script).origin === location.origin &&
          new URL(script).pathname === '/service-worker.js'
        ) {
          registration.update().catch(() => {});
        }
      }
    })
    .catch(() => {});
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ErrorBoundary>
      {DEMO_MODE ? (
        <>
          <div
            role="status"
            className="bg-amber-100 px-4 py-2 text-center text-sm font-semibold text-amber-950"
          >
            Ambiente de demonstração — dados fictícios e operações simuladas.
          </div>
          <React.Suspense fallback={<p>Carregando demonstração…</p>}>
            <DemoApp />
          </React.Suspense>
        </>
      ) : (
        <Workspace />
      )}
    </ErrorBoundary>
  </React.StrictMode>,
);
