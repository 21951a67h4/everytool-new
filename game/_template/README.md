# Game Page Template Usage

This template ensures all game pages match the site's theme and UX:
- Left-side back button
- Dynamic year footer
- Light/Dark theme support (reads `et-theme` from localStorage)

## Create a new game page
1. Duplicate this folder to `game/<your-game-name>/`.
2. In the new folder:
   - Edit `index.html` title and `.game-title` text
   - Put your game UI/canvas inside `.game-stage`
   - Extend `styles.css`/`script.js` if needed
3. Link to `game/<your-game-name>/index.html` from the hub.

## Files
- `index.html` — markup, back button, footer
- `styles.css` — theme-aligned styles + dark mode
- `script.js` — back button behavior, dynamic year, theme adoption

Note: Back button falls back to `../index.html` when no referrer.
