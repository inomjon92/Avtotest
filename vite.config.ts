import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'Avtotest — B toifa',
        short_name: 'Avtotest',
        description: "B toifa haydovchilik guvohnomasi uchun nazariy imtihonga tayyorlanish",
        lang: 'uz',
        theme_color: '#1d4ed8',
        background_color: '#0f172a',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: 'icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: 'icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      },
      workbox: { globPatterns: ['**/*.{js,css,html,svg,png,woff2}'], navigateFallback: '/index.html', navigateFallbackDenylist: [/^\/api\//] },
    }),
  ],
  // Lokal ishlab chiqishda /api so'rovlari `npm run dev:api` serveriga yo'naltiriladi
  server: { proxy: { '/api': 'http://localhost:3001' } },
  preview: { proxy: { '/api': 'http://localhost:3001' } },
  test: { environment: 'node' },
} as any);
