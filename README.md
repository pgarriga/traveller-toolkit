# Traveller UWP Decoder

[![Version](https://img.shields.io/badge/Version-1.7.1-blue?style=flat-square)](https://github.com/pgarriga/traveller-uwp-decoder)
[![React](https://img.shields.io/badge/React-19.2-61DAFB?style=flat-square&logo=react&logoColor=white)](https://react.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-6.0-3178C6?style=flat-square&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Vite](https://img.shields.io/badge/Vite-7.3-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev/)
[![Tesseract.js](https://img.shields.io/badge/Tesseract.js-7.0-4285F4?style=flat-square&logo=google&logoColor=white)](https://tesseract.projectnaptha.com/)
[![License](https://img.shields.io/badge/License-MIT-green?style=flat-square)](LICENSE)

A modern web application for decoding **Universal World Profile (UWP)** codes from the **Mongoose Traveller** tabletop RPG. Scan UWP codes from images or enter them manually to get detailed planetary information.

> **Note:** This is an unofficial fan-made tool designed to speed up gameplay and let you focus on what really matters — the fun of your sessions. For accurate and complete information, always refer to the official Mongoose Traveller rulebooks.

## Features

- **OCR Scanner** - Scan UWP codes directly from images using your camera or photo library
- **Auto-detection** - Automatically detects planet names from scanned images
- **Comprehensive Decoding** - Full breakdown of all UWP components:
  - Starport class, facilities, and services
  - Planet size, diameter, and gravity
  - Atmosphere type, pressure, and required equipment
  - Hydrographics coverage
  - Population scale
  - Government type and common contraband
  - Law level with weapon and armor restrictions
  - Tech level with era equivalents
  - Travel zone warnings (Green/Amber/Red)
- **Recent Planets** - Automatically saves decoded planets for quick access
- **Bilingual Support** - Full Spanish and English translations with auto-detection
- **Mobile Responsive** - Optimized for both desktop and mobile devices
- **Offline Ready** - Works entirely in the browser, no server required

## Screenshots

| Scan Page | Planet Details | Recent Planets |
|:---------:|:--------------:|:--------------:|
| Enter or scan UWP codes | Full planetary breakdown | Quick access history |

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/pgarriga/traveller-uwp-decoder.git

# Navigate to project directory
cd traveller-uwp-decoder

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
npm run preview
```

## Usage

### Manual Entry

1. Enter the planet name (optional)
2. Select the travel zone (Green/Amber/Red)
3. Type the UWP code (e.g., `A788899-C`)
4. Click **Decode** to view planetary details

### OCR Scanning

1. Click the **Scan** button
2. Select an image containing a UWP code
3. The app will automatically extract the UWP and planet name
4. Review the decoded planetary information

### UWP Format

A UWP code consists of 8 characters in the format: `XNNNNNN-N`

| Position | Meaning | Values |
|:--------:|---------|--------|
| 1 | Starport | A-E, X |
| 2 | Size | 0-F (hex) |
| 3 | Atmosphere | 0-F (hex) |
| 4 | Hydrographics | 0-A |
| 5 | Population | 0-C (hex) |
| 6 | Government | 0-F (hex) |
| 7 | Law Level | 0-J (hex) |
| 8 | Tech Level | 0-F+ (hex) |

**Example:** `A788899-C` = Class A Starport, Medium size, Standard atmosphere, 80% water, Billions of inhabitants, Civil Service Bureaucracy, High law, Average Stellar tech

## Tech Stack

| Technology | Purpose |
|------------|---------|
| [React 19](https://react.dev/) | UI Framework |
| [TypeScript 5](https://www.typescriptlang.org/) | Type Safety |
| [Vite 7](https://vitejs.dev/) | Build Tool & Dev Server |
| [Tesseract.js 7](https://tesseract.projectnaptha.com/) | OCR Engine |

## Internationalization

The app automatically detects your browser language:

- **Spanish**: For browsers set to `es`, `ca`, `gl`, or `eu`
- **English**: For all other languages

All UI elements, labels, and game data are fully translated.

## Project Structure

```
src/
├── components/     # Reusable UI components
│   ├── icons/      # SVG icon components
│   └── ui/         # Button, Section, Row, Badge
├── constants/      # Colors, zones, game rules
├── hooks/          # Custom React hooks
├── i18n/           # Translations and game data
├── types/          # TypeScript type definitions
├── utils/          # Helper functions
├── views/          # Page components
├── App.tsx         # Main application component
├── index.css       # Global styles
└── main.tsx        # Entry point
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'feat: add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- **Mongoose Publishing** for the Traveller RPG system
- **Tesseract.js** team for the excellent OCR library
- The Traveller community for inspiration

---

<p align="center">
  Made with <a href="https://claude.ai/claude-code">Claude Code</a>
</p>
