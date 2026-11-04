// Wallpaper presentation and local frame export. The static hosted site never
// accepts uploads: its gift downloads are ordinary, self-contained media files.
export function installWallpaper(api) {
  const dialog = document.querySelector('#gift-dialog');
  document.querySelector('#gift').onclick = () => dialog.showModal();
  document.querySelector('#gift-close').onclick = () => dialog.close();
  document.querySelector('#wallpaper-view').onclick = async () => {
    dialog.close();
    document.body.classList.add('wallpaper');
    try { await document.documentElement.requestFullscreen?.(); } catch {}
  };
  if (new URLSearchParams(location.search).has('wallpaper')) document.body.classList.add('wallpaper');
  addEventListener('keydown', event => { if (event.key === 'Escape') document.body.classList.remove('wallpaper'); });
  document.querySelector('canvas').addEventListener('dblclick', () => document.body.classList.toggle('wallpaper'));
  document.querySelector('#save-image').onclick = async () => {
    const portrait = innerHeight > innerWidth;
    const width = portrait ? 1536 : 2048, height = portrait ? 2048 : 1536;
    const button = document.querySelector('#save-image');
    button.disabled = true;
    try {
      await api.prepareCapture(width, height);
      api.renderAt(0, api.cycle);
      const blob = await new Promise(resolve => api.renderer.domElement.toBlob(resolve, 'image/png'));
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `season-dial-${width}x${height}.png`;
      link.click();
      setTimeout(() => URL.revokeObjectURL(link.href), 10000);
    } finally { api.endCapture(); button.disabled = false; }
  };
  if (['127.0.0.1', 'localhost'].includes(location.hostname) && new URLSearchParams(location.search).has('render')) {
    const render = document.createElement('button');
    render.id = 'render-film';
    render.textContent = 'Render gift film';
    Object.assign(render.style, { position: 'fixed', top: '16px', left: '16px', zIndex: 30, color: '#eee', background: '#102020dc', borderRadius: '12px' });
    document.body.append(render);
    const stills = document.createElement('button');
    stills.id = 'render-stills';
    stills.textContent = 'Render wallpaper images';
    Object.assign(stills.style, { position: 'fixed', top: '60px', left: '16px', zIndex: 30, color: '#eee', background: '#102020dc', borderRadius: '12px' });
    document.body.append(stills);
    stills.onclick = async () => {
      stills.disabled = true;
      try {
        for (const [orientation, width, height] of [['desktop',2560,1664],['landscape',2420,1668],['portrait',1668,2420]]) {
          await api.prepareCapture(width,height);
          for (const [season,index] of [['spring',0],['summer',1],['autumn',2],['winter',3]]) {
            stills.textContent = `Rendering ${orientation} ${season}`;
            api.renderAt(0,index+1);
            const blob=await new Promise(resolve=>api.renderer.domElement.toBlob(resolve,'image/png'));
            const response=await fetch(`/capture/still/${orientation}-${season}.png`,{method:'POST',body:blob});
            if(!response.ok)throw new Error('Image could not be saved');
          }
        }
        stills.textContent='Wallpaper images ready';
      } catch(error) {stills.textContent=`Export failed: ${error.message}`;}
      finally {api.endCapture();stills.disabled=false;}
    };
    render.onclick = async () => {
      render.disabled = true;
      try {
        for(const [profile,width,height] of [['desktop',1920,1248],['ipad-portrait',1248,1812]]) {
          await api.prepareCapture(width,height);
          for (let frame = 0; frame < 1152; frame++) {
            const time = frame / 24;
            api.renderAt(time, 4 + time / 12);
            const blob = await new Promise(resolve => api.renderer.domElement.toBlob(resolve, 'image/jpeg', .91));
            const response = await fetch(`/capture/frame/${profile}/${String(frame).padStart(4, '0')}.jpg`, { method: 'POST', body: blob });
            if (!response.ok) throw new Error(`Frame ${frame} could not be saved`);
            if (frame % 24 === 0) render.textContent = `Rendering ${profile}: ${Math.floor(frame / 24)} / 48 s`;
          }
        }
        render.textContent = 'Film frames ready';
        document.body.dataset.capture = 'complete';
      } catch (error) {
        render.textContent = `Export failed: ${error.message}`;
        document.body.dataset.capture = 'failed';
      } finally { api.endCapture(); render.disabled = false; }
    };
  }
}
