import {Dimensions} from 'react-native';

const {width} = Dimensions.get('window');

// The base design width is 1920 (Vega OS).
// On Android TV, the logical width is usually 960dp (for 1080p).
// This function scales the pixel values proportionally to fit the screen.
export const px = (value: number) => {
  return value * (width / 1920);
};
