import sharp from 'sharp'

const INK = { r: 23, g: 23, b: 26 }
const SIZE = 512

// Bullseye above the mark: focus and hard work.
const symbol = Buffer.from(
  `<svg xmlns="http://www.w3.org/2000/svg" width="96" height="96" viewBox="0 0 104 104">
    <circle cx="52" cy="52" r="42" fill="none" stroke="rgb(${INK.r},${INK.g},${INK.b})" stroke-width="9"/>
    <circle cx="52" cy="52" r="14" fill="rgb(${INK.r},${INK.g},${INK.b})"/>
  </svg>`
)

// The real Galahad mark, recolored to ink through its alpha channel.
const markSrc = await sharp('assets/galahad-mark.png').trim().resize({ width: 288 }).toBuffer()
const mark = await sharp({ create: { width: 288, height: 288, channels: 4, background: { ...INK, alpha: 1 } } })
  .png()
  .composite([{ input: markSrc, blend: 'dest-in' }])
  .toBuffer()
const markMeta = await sharp(mark).metadata()

const layers = [
  { input: symbol, left: Math.round((SIZE - 96) / 2), top: 64 },
  { input: mark, left: Math.round((SIZE - 288) / 2), top: 176 },
]
console.log('mark', markMeta.width, markMeta.height)

const onWhite = { create: { width: SIZE, height: SIZE, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } } }
const onClear = { create: { width: SIZE, height: SIZE, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } }

await sharp(onWhite).composite(layers).png().toFile('public/icon-512.png')
await sharp('public/icon-512.png').resize(192, 192).png().toFile('public/icon-192.png')
await sharp('public/icon-512.png').resize(180, 180).png().toFile('app/apple-icon.png')
await sharp(onClear).composite(layers).png().toFile('public/logo.png')

const LIGHT = { r: 244, g: 244, b: 245 }
const symbolDark = Buffer.from(symbol.toString().replaceAll(`rgb(${INK.r},${INK.g},${INK.b})`, `rgb(${LIGHT.r},${LIGHT.g},${LIGHT.b})`))
const markDark = await sharp({ create: { width: 288, height: 288, channels: 4, background: { ...LIGHT, alpha: 1 } } })
  .png()
  .composite([{ input: markSrc, blend: 'dest-in' }])
  .toBuffer()
await sharp(onClear)
  .composite([
    { input: symbolDark, left: Math.round((SIZE - 96) / 2), top: 64 },
    { input: markDark, left: Math.round((SIZE - 288) / 2), top: 176 },
  ])
  .png()
  .toFile('public/logo-dark.png')
console.log('icons rendered')
