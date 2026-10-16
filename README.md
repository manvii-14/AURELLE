# Aurelle — Matter, in motion

A self-contained interactive sensory canvas prototype built with HTML, CSS, JavaScript, and Canvas 2D. It runs without npm or a build step.

## Run locally

From this folder in PowerShell:

```powershell
py -m http.server 8000
```

Open http://localhost:8000 in Chrome or Edge. Internet access helps load Space Grotesk and DM Mono from Google Fonts.

## Interactions

- Explore Fire, Water, Earth, and Air environments and switch Pearl / Midnight themes.
- Open Physics and choose Repel, Attract, Vortex, or Grab interaction modes.
- Drag the glowing core to move it; it has inertia and influences nearby particles. In Grab mode, click a nearby particle to pull it directly.
- Click the field for a shockwave; use Burst for a stronger impulse.
- Drop up to five gravity wells to pull particles into a local orbit.
- Tune gravity, viscosity (damping), particle count, elasticity, force radius, and turbulence. These change the live simulation.
- Choose Orb, Orbit, Infinite Surface, and Fragments visual forms; use mood presets for combinations of environment and physics.
- Load a local audio file for frequency-reactive visuals; capture a PNG, randomize, freeze, reset, or enter fullscreen.

## Implementation notes

The particle field is a custom 2D force simulation: particles respond to cursor force modes, the draggable core, gravity wells, turbulence, damping, and elastic boundary collisions. This is an expressive art simulation rather than a physically exact scientific solver, and the forms use different visual treatments. Local audio is analysed with the Web Audio API. Spotify recording synchronization is not included.

## Visual direction

Aurelle uses Space Grotesk for display/interface typography and DM Mono for technical labels, with a per-element palette, atmospheric lighting, and a restrained glass-like control panel. The design references the broad language of immersive creative-tech websites without copying any one site.
