import { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Hacker's Unity Platform",
    short_name: "Hacker's Unity",
    description:
      "India's Fastest Growing Community uniting developers, innovators, and creators through premier hackathons and events.",
    start_url: '/',
    display: 'standalone',
    background_color: '#0a0d14',
    theme_color: '#0099e6',
    icons: [
      {
        src: '/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
      {
        src: '/logo.png',
        sizes: '500x500',
        type: 'image/png',
      },
    ],
  };
}
