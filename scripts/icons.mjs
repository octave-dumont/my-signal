import sharp from 'sharp'

const svg = 'public/logo.svg'
await sharp(svg).resize(192, 192).png().toFile('public/icon-192.png')
await sharp(svg).resize(512, 512).png().toFile('public/icon-512.png')
await sharp(svg).resize(180, 180).png().toFile('app/apple-icon.png')
console.log('icons rendered')
