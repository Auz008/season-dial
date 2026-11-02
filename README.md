# Season Dial

A contemplative miniature meadow suspended among the stars. A golden wheat hand sweeps through the seasons while two little cats play on its surface.

## Experience

- Real-time, rotatable 3D scene with 155,000 wind-animated grass blades.
- Spring, summer, autumn and winter, revealed by a radial sweep.
- Procedural ivory and black cats with walking, head and tail animation.
- Spring cherry petals, fresh summer leaves, red-orange autumn maple leaves, and winter crystal snowflakes with fine snow dust.
- Sparse, small, translucent falling particles follow the seasonal regions of the dial and tumble gently as they descend. The meadow and the cats remain the focus.
- A restrained living sky: softly twinkling stars, rare shooting stars, very slow nebula movement, and faint star formations that reveal and dissolve.
- A brass-trimmed hub and a delicate wheat hand.
- Quiet controls that disappear after a few seconds of inactivity.
- A separate **Artwork** view displays the generated reference image exactly. **Live 3D** returns to the interactive reconstruction. The artwork is a still image; it is not presented as a real-time render.

Drag to orbit, scroll to zoom. Space pauses playback; keys 1–4 select seasons; H hides controls. Move the pointer or tap to reveal controls. On narrow screens, some secondary controls are omitted.

## Run locally

Use Python 3 and a modern browser:

```sh
python3 start.py
```

The browser opens automatically. Press Ctrl+C in the terminal to stop the server. Alternatively:

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

Then open `http://127.0.0.1:8000/`. Use an HTTP server rather than opening index.html directly because browser ES modules require it. The Three.js library is bundled; no npm installation, API key or external CDN is needed to run the project.

## Deployment

This repository includes a GitHub Actions workflow for GitHub Pages. In repository Settings → Pages, select **GitHub Actions** as the source. Pushes to `main` publish the static project. The live site uses only bundled static assets.

## Files

- `scene.js`: 3D geometry, grass shaders, cats and animation.
- `effects.js`: GPU-instanced seasonal weather, animated stars, meteors and star formations.
- `assets/`: four optimized transparent particle textures, original high-resolution versions in `assets/source/`, and their complete prompts in `assets/PROMPTS.md`.
- `interface.js`: viewing modes and quiet interface behavior.
- `index.html`: English-only accessible controls.
- `starfield.png`: original generated deep-space texture; `starfield-bg.jpg` is its optimized runtime version.
- `reference-render.png`: generated artwork used as a visual target and in Artwork mode.
- `image-prompt.txt`: prompt used with the built-in ImageGen tool.
- `start.py`: loopback-only local development server.
- `vendor/`: Three.js r170 and its MIT license.

## Provenance and limits

Independently reconstructed from a supplied short video. A matching original GitHub project has not been verified. No original Blender file or original cat asset was available. Live 3D approximates the supplied scene; geometry, fur, snow, lighting and animation differ from the generated artwork. Artwork mode preserves that image without claiming it is interactive 3D.

The reference image is generated artwork. Three.js retains its upstream MIT license. Project source code is available under the MIT license in `LICENSE`.
