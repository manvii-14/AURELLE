# Aurelle

Sculpt fire, water, earth and air with sound. A Three.js particle simulation with liquid / metal / flame / storm surface shaders, a Matter Lab (9 physics sliders), force modes (attract, repel, vortex, grab), gravity wells, element presets, Pearl / Midnight / Ember themes, generated sound and local-audio reactivity.

## Files
- `index.html` markup
- `style.css` interface styles and themes
- `app.js` simulation, shaders, audio, UI
- Three.js r128 loads from cdnjs, so an internet connection is needed.

## Run locally
```
python -m http.server 8000
```
Open http://localhost:8000 in Chrome or Edge. (Opening index.html directly also works.)

## Deploy on GitHub Pages
1. Create a repo and upload these four files to the root.
2. Settings > Pages > Deploy from branch > `main` / root.

## Controls
Drag to push matter, hold then release to charge an impact, scroll to zoom, Shift+drag to rotate, P switches theme, Esc closes panels. In Grab mode, drag to carry the whole form.

## Notes
- Spotify is not integrated. Audio reactivity uses generated sound or a local file.
- Element fusion and the saved gallery are not implemented.
