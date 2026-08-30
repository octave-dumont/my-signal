import sharp from 'sharp'

const INK = { r: 23, g: 23, b: 26 }
const SIZE = 512

// The real Galahad mark, recolored to ink through its alpha channel.
const markSrc = await sharp('assets/galahad-mark.png').trim().resize({ width: 340 }).toBuffer()
const mark = await sharp({ create: { width: 340, height: 340, channels: 4, background: { ...INK, alpha: 1 } } })
  .png()
  .composite([{ input: markSrc, blend: 'dest-in' }])
  .toBuffer()
const markMeta = await sharp(mark).metadata()

const layers = [{ input: mark, left: Math.round((SIZE - 340) / 2), top: Math.round((SIZE - 300) / 2) }]
console.log('mark', markMeta.width, markMeta.height)

const onWhite = { create: { width: SIZE, height: SIZE, channels: 4, background: { r: 255, g: 255, b: 255, alpha: 1 } } }
const onClear = { create: { width: SIZE, height: SIZE, channels: 4, background: { r: 0, g: 0, b: 0, alpha: 0 } } }

await sharp(onWhite).composite(layers).png().toFile('public/icon-512.png')
await sharp('public/icon-512.png').resize(192, 192).png().toFile('public/icon-192.png')
await sharp('public/icon-512.png').resize(180, 180).png().toFile('app/apple-icon.png')
await sharp(onClear).composite(layers).png().toFile('public/logo.png')

const LIGHT = { r: 244, g: 244, b: 245 }
const markDark = await sharp({ create: { width: 340, height: 340, channels: 4, background: { ...LIGHT, alpha: 1 } } })
  .png()
  .composite([{ input: markSrc, blend: 'dest-in' }])
  .toBuffer()
await sharp(onClear)
  .composite([{ input: markDark, left: Math.round((SIZE - 340) / 2), top: Math.round((SIZE - 300) / 2) }])
  .png()
  .toFile('public/logo-dark.png')
console.log('icons rendered')
