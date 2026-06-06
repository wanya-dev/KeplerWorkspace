import type {ImageSourcePropType} from 'react-native';

// Web (Vite) asset references. Vite turns `import x from './x.png'` into a URL
// string, which react-native-web's <Image>/<ImageBackground> accept directly.
// Mirrors images.native.ts so consuming components share one import path.

import homePng from './home.png';
import apiDemoPng from './get-started.png';
import debugPng from './debug.png';
import animationPng from './learn-more.png';
import backgroundPng from './background.png';

export const homeIcon = homePng as unknown as ImageSourcePropType;
export const apiDemoIcon = apiDemoPng as unknown as ImageSourcePropType;
export const debugIcon = debugPng as unknown as ImageSourcePropType;
export const animationIcon = animationPng as unknown as ImageSourcePropType;
export const backgroundImage = backgroundPng as unknown as ImageSourcePropType;
