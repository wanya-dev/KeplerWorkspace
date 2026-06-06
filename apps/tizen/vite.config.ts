import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// Tizen apps load over file:// (opaque origin). ES module scripts
// (`type="module"`) are always fetched with CORS semantics and fail to load
// under file://, producing a blank screen. Rewrite the injected script tag to
// a classic deferred script so it executes on the device.
function tizenClassicScript() {
  return {
    name: 'tizen-classic-script',
    transformIndexHtml(html: string) {
      return html.replace(
        /<script type="module"\s+crossorigin\s+src=/g,
        '<script defer src=',
      );
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    tizenClassicScript(),
  ],
  resolve: {
    alias: {
      // Map react-native imports to react-native-web (absolute path)
      'react-native': path.resolve(__dirname, 'node_modules/react-native-web'),
      // Resolve shared package
      '@workspace/shared': path.resolve(__dirname, '../../packages/shared'),
    },
    extensions: ['.web.tsx', '.web.ts', '.web.js', '.tsx', '.ts', '.js'],
  },
  // Allow importing from outside root (shared package)
  server: {
    port: 3000,
    fs: {
      allow: [path.resolve(__dirname, '../..')],
    },
  },
  // Tizen uses file:// protocol, so assets must use relative paths
  base: './',
  build: {
    outDir: 'dist',
    // Tizen WebKit may not support latest JS features
    target: 'es2015',
    commonjsOptions: {
      // Allow CJS modules from shared package
      include: [/packages\/shared/, /node_modules/],
    },
    rollupOptions: {
      output: {
        entryFileNames: 'assets/[name].js',
        chunkFileNames: 'assets/[name].js',
        assetFileNames: 'assets/[name].[ext]',
      },
    },
  },
});
