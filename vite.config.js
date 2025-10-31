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
    // To fix the "unexpected token 'export'" error, ensure scripts are treated as modules.
    // However, the primary fix is updating the HTML files to use `<script type="module">`.
    // We also need to make sure the output paths are clean.
    assetsInlineLimit: 0, // Ensure assets are not inlined as data URLs
    emptyOutDir: true // Clean the output directory before build
  },
  define: {
    global: 'globalThis',
  }
})
