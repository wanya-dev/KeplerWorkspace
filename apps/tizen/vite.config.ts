import {defineConfig} from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import type {Plugin} from 'vite';

// Tizen apps load over file:// (opaque origin). ES module scripts
// (`type="module"`) are always fetched with CORS semantics and fail to load
// under file://, producing a blank screen. Rewrite the injected script tag to
// a classic deferred script so it executes on the device.
function tizenClassicScript(): Plugin {
  return {
    name: 'tizen-classic-script',
    transformIndexHtml(html: string) {
      return html
        .replace(
          /<!-- tizen-studio-fallback:start -->[\s\S]*?<!-- tizen-studio-fallback:end -->/g,
          '',
        )
        .replace(
          /<script type="module"\s+crossorigin\s+src=/g,
          '<script defer src=',
        );
    },
  };
}

// Vite emits `new URL("file.png", import.meta.url).href` for static asset
// references.  `import.meta` is only available inside ES module scripts, but
// tizenClassicScript() converts the entry to a classic `<script defer>` so the
// bundle runs outside module scope.  Any use of `import.meta` in a classic
// script causes a **SyntaxError** that prevents the entire bundle from parsing,
// resulting in a black screen on the Tizen emulator / device.
//
// This plugin rewrites those patterns in the final rendered chunks to plain
// relative path strings (e.g. `"./assets/background.png"`), which work
// correctly under the `file://` protocol.
function tizenFixImportMeta(): Plugin {
  return {
    name: 'tizen-fix-import-meta',
    enforce: 'post',
    generateBundle(_options, bundle) {
      for (const [fileName, chunk] of Object.entries(bundle)) {
        if (chunk.type !== 'chunk') continue;
        // Match patterns like:
        //   ""+new URL("background.png",import.meta.url).href
        //   "" + new URL("file.png", import.meta.url).href
        const pattern =
          /""\s*\+\s*new\s+URL\(\s*"([^"]+)"\s*,\s*import\.meta\.url\s*\)\.href/g;
        if (!pattern.test(chunk.code)) continue;
        pattern.lastIndex = 0;
        chunk.code = chunk.code.replace(
          pattern,
          (_match: string, assetName: string) => {
            // Assets land in ./assets/ relative to index.html
            return `"./assets/${assetName}"`;
          },
        );
      }
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    tizenClassicScript(),
    tizenFixImportMeta(),
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
    // Keep the bundle conservative for older Tizen WebKit engines.
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
