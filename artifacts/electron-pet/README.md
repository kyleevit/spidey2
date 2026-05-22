# Spidey — Virtual Tarantula Desktop Pet (Electron)

A mischievous tarantula that lives on your desktop. Neglect her and she'll start eating your screen.

## Features

- Frameless, always-on-top floating window
- System tray icon — double-click to show/hide
- Pin/unpin always-on-top behavior
- Hunger, happiness, health, cleanliness stats that decay in real-time
- Screen-eating web overlay when hunger drops below 30%
- Shop: buy food, accessories, medicines with in-game coins
- Premium pets: Emperor Scorpion, Dragon Spider, Golden Tarantula
- All data stored locally in SQLite (no internet required)

## Running Locally

### Prerequisites
- Node.js 18+
- pnpm (`npm install -g pnpm`)

### Install & Run (Development)

```bash
cd artifacts/electron-pet
pnpm install
pnpm dev
```

### Build for Distribution

```bash
# Build for your current platform
pnpm package

# Platform-specific
pnpm package:mac    # macOS (.dmg + .zip)
pnpm package:win    # Windows (.exe installer + portable)
pnpm package:linux  # Linux (AppImage + .deb)
```

Outputs go to the `release/` directory.

## Window Behavior

- The window starts in the **bottom-right corner** of your screen
- The **pin button** (top-left of titlebar) toggles always-on-top
- The **X button** hides to tray (does NOT quit the app)
- **Double-click the tray icon** to show/hide the window
- **Right-click the tray icon** for the full menu including Quit

## Data Storage

Your pet's data is stored locally at:
- **macOS**: `~/Library/Application Support/spidey-pet/spidey.db`
- **Windows**: `%APPDATA%\spidey-pet\spidey.db`
- **Linux**: `~/.config/spidey-pet/spidey.db`

## Pet Care Guide

| Stat | Decays | Effect when low |
|------|--------|-----------------|
| Hunger | -2/min | Below 30%: starts eating screen. Below 10%: health drops |
| Happiness | -1/min | Below 30%: mood worsens |
| Cleanliness | -1/min | Below 30%: mood worsens |
| Health | -2/min (when starving) | Reaches 0: pet dies |

### Reviving a Dead Pet
- Costs **150 coins** (or free with Premium)
- Premium also gives free revives, 75 daily coins, and access to legendary pets
