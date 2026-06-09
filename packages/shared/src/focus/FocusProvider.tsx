import React, {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useRef,
  useState,
} from 'react';
import type {FocusDirection, FocusRegistration} from './types';

declare const window: any;

interface FocusContextValue {
  focusedId: string | null;
  register: (item: FocusRegistration) => () => void;
  setFocus: (id: string) => void;
  moveFocus: (direction: FocusDirection) => void;
}

const FocusContext = createContext<FocusContextValue | null>(null);

function isBrowserRuntime(): boolean {
  return typeof window !== 'undefined';
}

function getKeyDirection(
  key: string | undefined,
  keyCode: number | undefined,
): FocusDirection | null {
  if (keyCode === 37) return 'left';
  if (keyCode === 38) return 'up';
  if (keyCode === 39) return 'right';
  if (keyCode === 40) return 'down';

  switch (key) {
    case 'ArrowUp':
    case 'Up':
      return 'up';
    case 'ArrowDown':
    case 'Down':
      return 'down';
    case 'ArrowLeft':
    case 'Left':
      return 'left';
    case 'ArrowRight':
    case 'Right':
      return 'right';
    default:
      return null;
  }
}

function pickNext(
  current: FocusRegistration,
  items: FocusRegistration[],
  direction: FocusDirection,
): FocusRegistration | null {
  const sameZoneItems = items.filter(item => item.zone === current.zone);
  const candidates = sameZoneItems.filter(item => {
    if (item.id === current.id) {
      return false;
    }
    if (direction === 'left') {
      return item.row === current.row && item.col < current.col;
    }
    if (direction === 'right') {
      return item.row === current.row && item.col > current.col;
    }
    if (direction === 'up') {
      return item.row < current.row;
    }
    return item.row > current.row;
  });

  if (!candidates.length) {
    return null;
  }

  return candidates.sort((a, b) => {
    const aPrimary =
      direction === 'left' || direction === 'right'
        ? Math.abs(a.col - current.col)
        : Math.abs(a.row - current.row);
    const bPrimary =
      direction === 'left' || direction === 'right'
        ? Math.abs(b.col - current.col)
        : Math.abs(b.row - current.row);
    const aCross =
      direction === 'left' || direction === 'right'
        ? Math.abs(a.row - current.row)
        : Math.abs(a.col - current.col);
    const bCross =
      direction === 'left' || direction === 'right'
        ? Math.abs(b.row - current.row)
        : Math.abs(b.col - current.col);

    return aPrimary - bPrimary || aCross - bCross;
  })[0];
}

export const FocusProvider: React.FC<{
  initialFocusId?: string;
  children: React.ReactNode;
}> = ({initialFocusId = null, children}) => {
  const itemsRef = useRef<Map<string, FocusRegistration>>(new Map());
  const [focusedId, setFocusedId] = useState<string | null>(initialFocusId);

  const setFocus = useCallback((id: string) => {
    const item = itemsRef.current.get(id);
    if (!item) {
      return;
    }
    setFocusedId(id);
    item.focus?.();
  }, []);

  const moveFocus = useCallback(
    (direction: FocusDirection) => {
      const items = Array.from(itemsRef.current.values());
      const current =
        (focusedId && itemsRef.current.get(focusedId)) ?? items[0] ?? null;
      if (!current) {
        return;
      }
      const next = pickNext(current, items, direction);
      if (next) {
        setFocus(next.id);
      }
    },
    [focusedId, setFocus],
  );

  const register = useCallback((item: FocusRegistration) => {
    itemsRef.current.set(item.id, item);
    return () => {
      itemsRef.current.delete(item.id);
    };
  }, []);

  React.useEffect(() => {
    if (!isBrowserRuntime()) {
      return;
    }

    const target = window;
    const handleKeyDown = (event: any) => {
      const direction = getKeyDirection(event.key, event.keyCode || event.which);
      if (!direction) {
        return;
      }
      event.preventDefault();
      event.stopPropagation();
      moveFocus(direction);
    };

    target.addEventListener('keydown', handleKeyDown, true);
    return () => target.removeEventListener('keydown', handleKeyDown, true);
  }, [moveFocus]);

  const value = useMemo(
    () => ({
      focusedId,
      register,
      setFocus,
      moveFocus,
    }),
    [focusedId, register, setFocus, moveFocus],
  );

  return (
    <FocusContext.Provider value={value}>{children}</FocusContext.Provider>
  );
};

export function useFocusManager(): FocusContextValue {
  const context = useContext(FocusContext);
  if (!context) {
    throw new Error('useFocusManager() must be used inside FocusProvider.');
  }
  return context;
}
