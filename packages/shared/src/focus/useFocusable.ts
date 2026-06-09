import {useCallback, useEffect, useMemo, useRef} from 'react';
import type {MutableRefObject} from 'react';
import {findNodeHandle} from 'react-native';
import {useFocusManager} from './FocusProvider';
import type {FocusableOptions} from './types';

declare const document: any;

function focusRef(ref: MutableRefObject<any>) {
  const target = ref.current;
  if (!target) {
    return;
  }
  if (typeof target.focus === 'function') {
    if (
      typeof document !== 'undefined' &&
      document.activeElement === target
    ) {
      return;
    }
    target.focus();
    return;
  }

  const node = findNodeHandle(target) as any;
  if (node && typeof node.focus === 'function') {
    node.focus();
  }
}

export function useFocusable(id: string, options: FocusableOptions) {
  const ref = useRef<any>(null);
  const {focusedId, register, setFocus} = useFocusManager();
  const isFocused = focusedId === id;
  const {row, col, zone, preferred, onFocus} = options;

  useEffect(() => {
    return register({
      id,
      row,
      col,
      zone,
      focus: () => focusRef(ref),
    });
  }, [id, col, row, zone, register]);

  useEffect(() => {
    if (!preferred) {
      return;
    }
    const timer = setTimeout(() => setFocus(id), 0);
    return () => clearTimeout(timer);
  }, [id, preferred, setFocus]);

  const handleFocus = useCallback(() => {
    setFocus(id);
    onFocus?.(id);
  }, [id, onFocus, setFocus]);

  return useMemo(
    () => ({
      ref,
      isFocused,
      focusableProps: {
        onFocus: handleFocus,
      },
    }),
    [handleFocus, isFocused],
  );
}
