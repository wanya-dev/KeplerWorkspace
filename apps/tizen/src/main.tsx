import React from 'react';
import ReactDOM from 'react-dom/client';
// Import PAL directly from its subpath. The shared barrel (index.ts) also
// re-exports React Native screens whose modules call Metro-style require() at
// import time, which throws "require is not defined" in the browser/Vite ESM
// environment and blanks the app.
import {PalProvider} from '@workspace/shared/src/pal';
import {HomeScreen} from '@workspace/shared/src/screens/HomeScreen';
import {tizenPalServices} from './pal';

// Register Tizen TV remote control keys
function registerTizenKeys() {
  try {
    const tizen = (window as any).tizen;
    if (tizen?.tvinputdevice) {
      const keys = [
        'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
        'Enter', 'Return',
      ];
      keys.forEach(key => {
        try {
          tizen.tvinputdevice.registerKey(key);
        } catch (e) {
          // Key may already be registered
        }
      });
    }
  } catch (e) {
    console.log('[Tizen] Not running on Tizen, skipping key registration');
  }
}

const App = () => (
  <PalProvider services={tizenPalServices}>
    <HomeScreen />
  </PalProvider>
);

// Initialize
registerTizenKeys();

// Mount using standard React DOM
const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<App />);
