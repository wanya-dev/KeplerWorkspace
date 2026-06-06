import React, {createContext, useContext} from 'react';
import type {PlatformServices} from './interfaces';

const PalContext = createContext<PlatformServices | null>(null);

/**
 * Wraps the app root to inject platform-specific service implementations.
 * Each app (Vega, Google TV) provides its own PlatformServices instance.
 */
export const PalProvider: React.FC<{
  services: PlatformServices;
  children: React.ReactNode;
}> = ({services, children}) => (
  <PalContext.Provider value={services}>{children}</PalContext.Provider>
);

/**
 * Access platform services from any component in the shared layer.
 * Throws if used outside a PalProvider — fail-fast, never return null.
 */
export function usePal(): PlatformServices {
  const services = useContext(PalContext);
  if (!services) {
    throw new Error(
      'usePal() called outside PalProvider. ' +
        'Wrap your App root with <PalProvider services={...}>.',
    );
  }
  return services;
}
