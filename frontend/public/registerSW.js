export function registerSW() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/service-worker.js')
        .then((reg) => console.log('Service Worker enregistre:', reg))
        .catch((err) => console.log('Service Worker erreur:', err));
    });
  }
}