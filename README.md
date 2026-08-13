# After Rain

An immersive day-and-night p5.js experience presented inside a photographic frame.

Rain transforms into a rainbow landscape by day and a luminous moonlit field by night. The experience includes ambient sound, synchronized scene transitions, responsive framing, and an optional full-frame video export helper.

## Open the experience

Open [`projects/day-night-square-immersive/index.html`](projects/day-night-square-immersive/index.html).

For reliable audio and iframe behavior, serve the repository locally:

```bash
python3 -m http.server 8000
```

Then visit:

```text
http://localhost:8000/projects/day-night-square-immersive/
```

## Included files

The repository contains only the immersive HTML page and the assets it needs:

- day and night background images
- rain and breeze audio
- framed day and night p5.js animations
- p5.js runtime and the shared video-export helper
