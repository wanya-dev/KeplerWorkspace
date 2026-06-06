import React from 'react';
import {HomeScreen, PalProvider} from '@workspace/shared';
import {androidPalServices} from './pal';

export const App = () => (
  <PalProvider services={androidPalServices}>
    <HomeScreen />
  </PalProvider>
);
