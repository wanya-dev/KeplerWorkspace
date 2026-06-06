import React, {useRef, useEffect} from 'react';
import {StyleSheet, Animated, View} from 'react-native';
import {scaleWidth, scaleHeight} from '../../utils/scaling';

/**
 * Simplified animated React Native logo using built-in Animated API.
 * Replaces LottieView to avoid native module dependency.
 */
export const IconReactNativeAnimated = () => {
  const spinAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.loop(
      Animated.parallel([
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 4000,
          useNativeDriver: true,
        }),
        Animated.sequence([
          Animated.timing(scaleAnim, {
            toValue: 1.1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(scaleAnim, {
            toValue: 0.8,
            duration: 2000,
            useNativeDriver: true,
          }),
        ]),
      ]),
    ).start();
  }, [spinAnim, scaleAnim]);

  const spin = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={styles.container}>
      <Animated.View
        style={[
          styles.reactLogo,
          {transform: [{rotate: spin}, {scale: scaleAnim}]},
        ]}>
        <View style={styles.nucleus} />
        <View style={[styles.orbit, styles.orbit1]} />
        <View style={[styles.orbit, styles.orbit2]} />
        <View style={[styles.orbit, styles.orbit3]} />
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: scaleWidth(400),
    height: scaleHeight(400),
    alignItems: 'center',
    justifyContent: 'center',
  },
  reactLogo: {
    width: scaleWidth(200),
    height: scaleHeight(200),
    alignItems: 'center',
    justifyContent: 'center',
  },
  nucleus: {
    width: scaleWidth(30),
    height: scaleWidth(30),
    borderRadius: scaleWidth(15),
    backgroundColor: '#61dafb',
    position: 'absolute',
  },
  orbit: {
    position: 'absolute',
    width: scaleWidth(180),
    height: scaleHeight(60),
    borderRadius: scaleWidth(90),
    borderWidth: 2,
    borderColor: '#61dafb',
  },
  orbit1: {
    transform: [{rotateZ: '0deg'}],
  },
  orbit2: {
    transform: [{rotateZ: '60deg'}],
  },
  orbit3: {
    transform: [{rotateZ: '120deg'}],
  },
});
