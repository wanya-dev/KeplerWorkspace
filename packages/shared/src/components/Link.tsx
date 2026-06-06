import React, {useState} from 'react';
import {Image, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {px} from '../utils';

interface LinkProps {
  linkText: string;
  onPress: Function;
  testID?: string;
}

export const Link = ({linkText, onPress, testID}: LinkProps) => {
  const [focused, setFocused] = useState(false);

  return (
    <>
      <TouchableOpacity
        style={[styles.linkContainer, focused && styles.focusedContainer]}
        onPress={() => onPress()}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        testID={testID}>
        <View style={styles.linkTextContainer}>
          {focused ? (
            <Image source={require('../assets/focusedStar.png')} style={{width: px(23), height: px(23), resizeMode: 'contain'}} />
          ) : (
            <Image source={require('../assets/star.png')} style={{width: px(23), height: px(23), resizeMode: 'contain'}} />
          )}
          <Text style={styles.linkText}>{linkText}</Text>
        </View>
      </TouchableOpacity>
    </>
  );
};

const styles = StyleSheet.create({
  linkContainer: {
    width: px(420),
    paddingBottom: px(10),
    borderBottomWidth: px(5),
    borderBottomColor: 'transparent',
  },
  focusedContainer: {
    borderBottomWidth: px(5),
    borderBottomColor: '#ff9900',
  },
  linkTextContainer: {
    display: 'flex',
    alignItems: 'center',
    flexDirection: 'row',
    marginLeft: px(200),
    width: px(300),
  },
  linkText: {
    color: 'white',
    fontSize: px(45),
    marginLeft: px(30),
  },
});
