# ₹ UPI QR — Instant Payment QR Generator

> A free, privacy-first web app to generate UPI payment QR codes instantly — no backend, no data stored, runs 100% in your browser.

![UPI QR Generator](https://img.shields.io/badge/UPI-QR%20Generator-f5761a?style=flat-square&logo=data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PHRleHQgeT0iMTgiIGZvbnQtc2l6ZT0iMTYiPuKCuTwvdGV4dD48L3N2Zz4=)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=flat-square&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=flat-square&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=flat-square&logo=javascript&logoColor=black)
![License: MIT](https://img.shields.io/badge/License-MIT-green?style=flat-square)

---

## ✨ Features

| Feature | Details |
|---|---|
| ⚡ **Live QR Preview** | QR code updates as you type (debounced, toggleable) |
| ✅ **Input Validation** | Checks UPI ID format, amount range, required fields |
| 💾 **Download PNG** | Exports a branded, high-DPI QR card with name & amount |
| 🔗 **Copy UPI ID** | One-click copy to clipboard with visual feedback |
| 📤 **Share** | Web Share API on mobile; clipboard fallback on desktop |
| 🌙 **Dark Mode** | Full dark theme, persisted to `localStorage` |
| 📱 **Responsive** | Mobile-first design, works on all screen sizes |
| 🔒 **Private** | Zero server calls — everything runs locally |

---

> **Note:** The Web Share API and Clipboard API require a secure context (`https://` or `localhost`). Always test on a local server rather than opening the file directly.

---

## 🌐 Deploy on GitHub Pages

1. **Create a GitHub repository** and push all files:

```bash
git init
git add index.html style.css script.js README.md
git commit -m "Initial commit: UPI QR Generator"
git remote add origin https://github.com/YOUR_USERNAME/upi-qr.git
git push -u origin main
```

2. **Enable GitHub Pages:**
   - Go to your repository → **Settings** → **Pages**
   - Under **Source**, select `Deploy from a branch`
   - Choose `main` branch and `/ (root)` folder
   - Click **Save**

3. **Your app will be live at:**

```
https://YOUR_USERNAME.github.io/upi-qr/
```

> GitHub Pages typically takes 1–2 minutes to deploy after the first push.

---

## 📁 Project Structure

```
upi-qr/
├── index.html      # App markup — nav, form, QR output, about section
├── style.css       # Design system — tokens, layout, nav, animations
├── script.js       # All logic — QR gen, validation, share, dark mode, nav
└── README.md       # This file
```

No build tools, no `node_modules`, no config files. Pure HTML + CSS + JS.

---

## ⚙️ How It Works

### UPI URL Format

The app generates a standard UPI deep-link URL:

```
upi://pay?pa=<UPI_ID>&pn=<NAME>&am=<AMOUNT>&cu=INR
```

| Parameter | Description |
|---|---|
| `pa` | Payee Address (UPI ID, e.g. `name@okaxis`) |
| `pn` | Payee Name |
| `am` | Amount in INR (optional — omit to let payer choose) |
| `cu` | Currency (always `INR`) |

This URL is encoded into a QR code using [QRCode.js](https://github.com/davidshimjs/qrcodejs).

### QR Code Library

Uses **QRCode.js** loaded via CDN:

```html
<script src="https://cdnjs.cloudflare.com/ajax/libs/qrcodejs/1.0.0/qrcode.min.js"></script>
```

QRCode.js renders to a `<canvas>` element. The canvas is used for both display and PNG download.

### Download PNG

On download, a secondary off-screen canvas composes:
- Gradient accent bar
- QR image (from the rendered canvas)
- Payee name, UPI ID, amount
- Footer note
- Bottom accent bar

Output is a `2×` HiDPI PNG for crisp printing.

---

## 📱 Supported UPI Apps

The generated QR code works with all UPI-enabled apps in India:

- **PhonePe**
- **Google Pay (GPay)**
- **Paytm**
- **BHIM**
- **Amazon Pay**
- **Mobikwik**
- Any other NPCI-certified UPI app

---

## 🗺️ Navigation

The app includes a top navigation bar with:

| Link | Action |
|---|---|
| **Home** | Scrolls to the top of the page |
| **About App** | Scrolls to the feature & how-to section |
| **More ▾** | Hover/tap dropdown with: How to Use, Supported UPI Apps, GitHub |

On mobile, the nav collapses into a hamburger menu.

---

## 🎨 Design System

| Token | Value |
|---|---|
| Primary font | DM Serif Display (headings) + DM Sans (body) |
| Accent | Saffron `#f5761a` |
| Brand | Deep Indigo `#3d2b8e` |
| Background | Warm off-white `#f5f3ef` |
| Dark bg | `#0f0d14` |
| Border radius | 20px (card), 12px (panels), 8px (inputs) |

---

## 🔒 Privacy

- No analytics, no trackers, no cookies.
- No data is sent to any server — ever.
- QR generation happens entirely in your browser using JavaScript.
- The UPI ID and amount you enter never leave your device.

---

## 🛠️ Browser Support

| Browser | Support |
|---|---|
| Chrome / Edge 90+ | ✅ Full |
| Firefox 90+ | ✅ Full (Share API unavailable — clipboard fallback used) |
| Safari 15+ | ✅ Full |
| Mobile Chrome | ✅ Full (including Web Share API) |
| Mobile Safari | ✅ Full |

---

## 📄 License

MIT License — free to use, modify, and distribute.

---

## 🙏 Acknowledgements

- [QRCode.js](https://github.com/davidshimjs/qrcodejs) — QR code generation library
- [Google Fonts](https://fonts.google.com) — DM Serif Display & DM Sans
- [NPCI](https://www.npci.org.in) — UPI protocol specification

---

_Made with ❤️ for India's UPI ecosystem_
