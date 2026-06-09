import React from 'react';
import {
  StyleProp,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from 'react-native';
import {scaleFontSize, scaleWidth} from '../../utils/scaling';

export interface HeaderLogoProps {
  style?: StyleProp<ViewStyle>;
}

export const HeaderLogo = ({style}: HeaderLogoProps) => {
  return (
    <View style={[style, styles.container]}>
      <View style={styles.screen}>
        <Text style={styles.label}>WEB</Text>
        <View style={styles.stand} />
      </View>
      <Text style={styles.platform}>TIZEN TV</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  screen: {
    width: '72%',
    height: '58%',
    borderWidth: scaleWidth(8),
    borderColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: {
    color: '#FFFFFF',
    fontSize: scaleFontSize(72),
    fontWeight: 'bold',
  },
  stand: {
    position: 'absolute',
    bottom: scaleWidth(-42),
    width: '38%',
    height: scaleWidth(8),
    backgroundColor: '#FFFFFF',
  },
  platform: {
    color: '#62D9FF',
    fontSize: scaleFontSize(30),
    fontWeight: 'bold',
    marginTop: scaleWidth(48),
  },
});
