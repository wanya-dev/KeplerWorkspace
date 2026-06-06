import React from 'react';
import {HomeScreen, PalProvider} from '@workspace/shared';
import {vegaPalServices} from './pal';

export const App = () => (
  <PalProvider services={vegaPalServices}>
    <HomeScreen />
  </PalProvider>
);
