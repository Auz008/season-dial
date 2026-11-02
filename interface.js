// The artwork and the real-time scene are explicitly separate viewing modes.
const controls = document.querySelector('footer');
const artwork = document.querySelector('#artwork');
const mode = document.querySelector('#mode');
let idleTimer;
function wake() {
  document.body.classList.remove('idle');
  clearTimeout(idleTimer);
  idleTimer = setTimeout(() => {
    if (!controls.matches(':focus-within') && !document.querySelector('dialog[open]')) {
      document.body.classList.add('idle');
    }
  }, 3200);
}
for (const name of ['pointermove', 'pointerdown', 'keydown', 'touchstart']) {
  document.addEventListener(name, wake, {passive: true});
}
function setArtMode(enabled) {
  document.body.classList.toggle('art-mode', enabled);
  mode.textContent = enabled ? 'Live 3D' : 'Artwork';
  mode.setAttribute('aria-label', enabled ? 'Switch to live 3D' : 'Switch to artwork');
  mode.setAttribute('aria-pressed', String(enabled));
  history.replaceState(null, '', enabled ? '#artwork' : '#live');
  wake();
}
mode.onclick = () => setArtMode(!document.body.classList.contains('art-mode'));
if (location.hash === '#artwork') setArtMode(true);
document.querySelector('#reference').onclick = () => document.querySelector('#reference-dialog').showModal();
document.querySelector('#close-reference').onclick = () => { document.querySelector('#reference-dialog').close(); wake(); };
document.querySelector('#full').onclick = () => {
  if (document.fullscreenElement) document.exitFullscreen();
  else document.documentElement.requestFullscreen?.();
};
artwork.onerror = () => { document.querySelector('#error').textContent = 'The artwork could not load. Please refresh the page.'; };
wake();
