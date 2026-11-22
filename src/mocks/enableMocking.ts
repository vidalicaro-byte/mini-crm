/**
 * Starts the mock API in the browser. Loaded lazily so the mock code is a separate chunk,
 * and skipped entirely when VITE_ENABLE_MOCKS=false (real backend).
 */
export async function enableMocking() {
  if (import.meta.env.VITE_ENABLE_MOCKS === 'false') return;

  const { worker } = await import('./browser');
  await worker.start({
    onUnhandledFrame: 'bypass',
    quiet: true,
    serviceWorker: { url: `${import.meta.env.BASE_URL}mockServiceWorker.js` },
  });
}
