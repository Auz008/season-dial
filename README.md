# Season Dial

A contemplative miniature meadow suspended among the stars. A golden wheat hand sweeps through the seasons while two little cats play on its surface.

## Experience

- Real-time, rotatable 3D scene with 115,000 wind-animated grass blades.
- Spring, summer, autumn and winter, revealed by a radial sweep.
- Procedural ivory and black cats with walking, head and tail animation.
- Spring cherry petals, fresh summer leaves, red-orange autumn maple leaves, and a fuller winter fall of fine round snow grains.
- Sparse, small, translucent falling particles follow the seasonal regions of the dial and tumble gently as they descend. The meadow and the cats remain the focus.
- A restrained living sky: softly twinkling stars, rare shooting stars, very slow nebula movement, and faint star formations that reveal and dissolve.
- A small central tree: spring blossoms, lush summer greens and white dandelions, autumn apples, and a snow-tipped Christmas crown with warm lights in winter.
- A white pearl border, softly luminous cats, occasional staggered jumps (once every 20 seconds per cat), and a delicate wheat hand.
- A distraction-free wallpaper mode and an iPad gift pack: 40-second H.264 films plus four MacBook Air stills and eight iPad Pro stills, plus landscape and portrait films.
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

- `scene.js`: 3D geometry, grass shaders, glowing cats and occasional jump animation.
- `tree.js`: the seasonal tree, apples, Christmas ornaments and warm lights.
- `meadow.js`: spring wildflowers and summer dandelion seed heads.
- `wallpaper.js`: wallpaper presentation and image export; a loopback-only development switch is used for deterministic film capture.
- `gift/`: the rendered film, twelve device-sized wallpaper images and gift instructions.
- `manifest.webmanifest`: standalone Home Screen presentation.
- `effects.js`: GPU-instanced seasonal weather, animated stars, meteors and star formations.
- `assets/`: generated particle textures, original high-resolution versions in `assets/source/`, and their complete prompts in `assets/PROMPTS.md`.
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

## iPad wallpaper compatibility

The web scene can animate continuously in Safari or as a Home Screen web app. The exported PNG files work as still wallpapers. The MP4 is not a Live Photo and cannot be installed directly as an endlessly animated system wallpaper. Apple's supported Live Photo Lock Screen effect plays when the device wakes; support depends on the device, iPadOS, and a compatible Live Photo. See [Apple's iPad Lock Screen guide](https://support.apple.com/en-ie/guide/ipad/ipad782d4de8/27/ipados/27). The requested approximate devices are interpreted as a 13.6-inch MacBook Air (2560 x 1664) and an 11-inch iPad Pro in the M4/M5 display format (2420 x 1668). Native-size PNGs are provided; films use matching proportions at HD resolution.
