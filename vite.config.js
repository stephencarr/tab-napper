import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { viteStaticCopy } from 'vite-plugin-static-copy'

export default defineConfig({
  plugins: [
    react(),
    viteStaticCopy({
      targets: [
        {
          src: 'manifest.json',
          dest: '.'
        },
        {
          src: 'background.js',
          dest: '.'
        },
        {
          src: 'icons',
          dest: '.'
        }
      ]
    })
  ],
  base: './',
  build: {
    outDir: 'dist',
    rollupOptions: {
      input: {
        triage_hub: 'triage_hub.html',
        note: 'note.html'
      },
      output: {
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/chunks/[name].[hash].js',
        assetFileNames: 'assets/[name].[ext]'
      }
    },
    assetsInlineLimit: 0,
    emptyOutDir: true
  },
  define: {
    global: 'globalThis',
  }
})
