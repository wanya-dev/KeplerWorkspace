export type FocusDirection = 'up' | 'down' | 'left' | 'right';

export interface FocusPosition {
  row: number;
  col: number;
}

export interface FocusRegistration extends FocusPosition {
  id: string;
  zone?: string;
  focus?: () => void;
}

export interface FocusableOptions extends FocusPosition {
  zone?: string;
  preferred?: boolean;
  onFocus?: (id: string) => void;
}
