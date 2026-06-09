import React from 'react';
import ReactDOM from 'react-dom/client';
import {HomeScreen, PalProvider} from '@workspace/shared/src/web';
import {tizenPalServices} from './pal';

// Register Tizen TV remote control keys
function registerTizenKeys() {
  try {
    const tizen = (window as any).tizen;
    if (tizen?.tvinputdevice) {
      const keys = [
        'ArrowUp',
        'ArrowDown',
        'ArrowLeft',
        'ArrowRight',
        'Enter',
        'Return',
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
(window as any).__KEPLER_APP_BOOTED__ = true;
