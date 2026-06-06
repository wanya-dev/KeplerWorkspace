import type {ImageSourcePropType} from 'react-native';

// Native (Metro) asset references. Metro turns require('./x.png') into an
// asset module id consumed by <Image source={...}> / <ImageBackground>.
// The web counterpart (images.web.ts) imports the same files as URL strings.

export const homeIcon: ImageSourcePropType = require('./home.png');
export const apiDemoIcon: ImageSourcePropType = require('./get-started.png');
export const debugIcon: ImageSourcePropType = require('./debug.png');
export const animationIcon: ImageSourcePropType = require('./learn-more.png');
export const backgroundImage: ImageSourcePropType = require('./background.png');
