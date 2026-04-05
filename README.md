# WebTransformer Pro 🌌⚡

A Chrome/Firefox browser extension that transforms any website into a stunning, futuristic UI with **liquidmorphism**, **neon glow**, and **dark mode** themes.

![Version](https://img.shields.io/badge/version-1.0.0-purple)
![Manifest](https://img.shields.io/badge/manifest-v3-blue)
![License](https://img.shields.io/badge/license-MIT-cyan)

## ✨ Features

- **5 Themes**: Cyberpunk, Matrix, Ocean, Sunset, Neon
- **Liquidmorphism**: Animated floating blob gradients behind content
- **Glassmorphism**: Frosted glass cards with `backdrop-filter: blur()`
- **Neon Glow**: Buttons and links glow on hover
- **Touch Ripple**: Click any interactive element for a radial ripple effect
- **Particle Star Field**: Canvas-based twinkling particles with constellation lines
- **Gradient Headings**: Animated gradient text on hero headings
- **Custom Scrollbar**: Thin neon-colored scrollbar
- **Intensity Slider**: Light / Medium / Full effect strength
- **Site Whitelist**: Exclude specific domains
- **Works Everywhere**: YouTube, GitHub, LinkedIn, LeetCode, and more

## 🚀 Installation

### Chrome
1. Go to `chrome://extensions`
2. Enable **Developer mode** (top-right)
3. Click **Load unpacked**
4. Select this folder

### Firefox
1. Go to `about:debugging#/runtime/this-firefox`
2. Click **Load Temporary Add-on**
3. Select `manifest.json`

## 📁 Files

| File | Purpose |
|---|---|
| `manifest.json` | Manifest V3 config |
| `background.js` | Service worker, settings sync |
| `content.js` | DOM attributes, particles, ripple, blobs |
| `style.css` | Liquidmorphism theme (all 5 themes) |
| `popup.html` | Extension popup UI |
| `popup.js` | Theme picker, controls |
| `icons/` | Extension icons (16/32/48/128px) |

## 🎨 Themes

| Theme | Colors |
|---|---|
| 🌌 Cyberpunk | Purple + Blue + Cyan |
| 🔥 Matrix | Neon Green + Black |
| 🌊 Ocean | Blue + Teal |
| 🌅 Sunset | Orange + Pink + Gold |
| ⚡ Neon | Yellow + Purple |

## License

MIT
