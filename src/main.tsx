import '@fontsource-variable/inter';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import { enableMocking } from './mocks/enableMocking';

const container = document.getElementById('root');
if (!container) {
  throw new Error('Root element #root not found');
}

void enableMocking().then(() => {
  createRoot(container).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
});
