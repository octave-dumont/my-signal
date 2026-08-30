import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'my-signal',
    short_name: 'my-signal',
    description: 'Signal-to-noise ratio of the day',
    start_url: '/',
    display: 'standalone',
    background_color: '#0E1512',
    theme_color: '#0E1512',
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }
}
