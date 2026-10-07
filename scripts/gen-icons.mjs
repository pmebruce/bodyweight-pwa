// Renders the app icon SVG into the PNG sizes needed for PWA + iOS.
import sharp from 'sharp'
import { writeFileSync, mkdirSync } from 'node:fs'

const figure = (scale = 1) => `
  <g transform="translate(256 262) scale(${scale}) translate(-256 -262)" fill="none" stroke="#fff" stroke-linecap="round" stroke-linejoin="round">
    <circle cx="256" cy="128" r="40" fill="#fff" stroke="none"/>
    <path d="M256 186 L256 300" stroke-width="40"/>
    <path d="M256 200 L190 150 L150 96" stroke-width="32"/>
    <path d="M256 200 L322 150 L362 96" stroke-width="32"/>
    <path d="M256 300 L196 350 L176 424" stroke-width="34"/>
    <path d="M256 300 L316 350 L336 424" stroke-width="34"/>
  </g>`

const bg = (rounded) => `
  <defs>
    <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0" stop-color="#ff7a3d"/>
      <stop offset="1" stop-color="#ff2e7e"/>
    </linearGradient>
    <radialGradient id="glow" cx="0.3" cy="0.2" r="0.8">
      <stop offset="0" stop-color="#fff" stop-opacity="0.35"/>
      <stop offset="1" stop-color="#fff" stop-opacity="0"/>
    </radialGradient>
  </defs>
  <rect width="512" height="512" rx="${rounded ? 112 : 0}" fill="url(#g)"/>
  <rect width="512" height="512" rx="${rounded ? 112 : 0}" fill="url(#glow)"/>`

const svg = (rounded, scale) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">${bg(rounded)}${figure(scale)}</svg>`

mkdirSync('public', { recursive: true })
writeFileSync('public/favicon.svg', svg(true, 1))
const out = [
  ['public/pwa-192.png', 192, svg(false, 0.92)],
  ['public/pwa-512.png', 512, svg(false, 0.92)],
  ['public/pwa-maskable-512.png', 512, svg(false, 0.72)],
  ['public/apple-touch-icon.png', 180, svg(false, 0.86)],
  ['public/favicon-32.png', 32, svg(true, 1)],
]
for (const [file, size, s] of out) {
  await sharp(Buffer.from(s), { density: 300 }).resize(size, size).png().toFile(file)
  console.log('wrote', file)
}
