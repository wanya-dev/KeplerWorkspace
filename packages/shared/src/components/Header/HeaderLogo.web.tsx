import React from 'react';
import {Image, ImageStyle} from 'react-native';
import webLogo from '../../assets/web.png';

export interface HeaderLogoProps {
  style?: ImageStyle;
}

export const HeaderLogo = ({style}: HeaderLogoProps) => {
  return (
    <Image
      source={webLogo as any}
      style={[style, {tintColor: '#FFFFFF'}]}
      resizeMode="contain"
    />
  );
};
