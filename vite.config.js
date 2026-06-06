import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vitejs.dev/config/
export default defineConfig({
  build: {
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: undefined,
      },
    },
  },
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon-192.png', 'icon-512.png', 'vite.svg'],
      manifest: {
        name: 'Verifikimi',
        short_name: 'Verifikimi',
        description: 'Verifikim moshe',
        theme_color: '#0a0010',
        background_color: '#0a0010',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        scope: '/',
        ios: {
          appleMobileWebAppCapable: 'yes',
          appleMobileWebAppStatusBarStyle: 'black-translucent',
        },
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: '/icon-192.png',
            sizes: '180x180',
            type: 'image/png',
            purpose: 'any maskable',
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: { cacheName: 'google-fonts-cache' },
          },
        ],
      },
      // Also serve SW in dev so it works when testing "Add to Home Screen"
      devOptions: {
        enabled: true,
        type: 'module',
      },
    }),
  ],
})