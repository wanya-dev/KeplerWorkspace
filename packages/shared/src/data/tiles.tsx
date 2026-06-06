import React from 'react';
import {ImageSourcePropType, StyleSheet, Text} from 'react-native';
import {
  homeIcon,
  apiDemoIcon,
  debugIcon,
  animationIcon,
} from '../assets/images';

export interface TileData {
  id: string;
  label: string;
  accessibilityLabel: string;
  description: string | React.ReactNode;
  icon: ImageSourcePropType;
}

const descStyles = StyleSheet.create({
  underline: {
    textDecorationLine: 'underline',
  },
  bold: {
    fontWeight: 'bold',
  },
});

export const tiles: TileData[] = [
  {
    id: 'home',
    label: 'Home',
    accessibilityLabel: 'Home',
    description:
      'Welcome to Vega. Select one of the options below to start your journey.',
    icon: homeIcon,
  },
  {
    id: 'api-demo',
    label: 'API\nDemo',
    accessibilityLabel: 'API Demo',
    description: 'Press select to fetch a random joke from the API.',
    icon: apiDemoIcon,
  },
  {
    id: 'debug',
    label: 'Test &\nDebug',
    accessibilityLabel: 'Test and Debug',
    description:
      "Press 'd' in the Metro terminal for the developer menu, or debug via Chrome Dev Tools in Vega Studio.",
    icon: debugIcon,
  },
  {
    id: 'animation',
    label: 'Animated\nDemo',
    accessibilityLabel: 'Animated Demo',
    description: 'A Lottie animation demo powered by React Native.',
    icon: animationIcon,
  },
];
