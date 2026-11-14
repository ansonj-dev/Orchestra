import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/',
    name: 'Orchestra — Agent Utility Marketplace',
    short_name: 'Orchestra',
    description: 'Discover, connect, and coordinate autonomous agents.',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    display_override: ['standalone', 'minimal-ui'],
    orientation: 'any',
    background_color: '#f4f0e6',
    theme_color: '#f4f0e6',
    categories: ['productivity', 'developer', 'utilities'],
    icons: [
      { src: '/icons/orchestra.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
      { src: '/icons/orchestra-maskable.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
    ],
  };
}
