import React, {useCallback} from 'react';
import {StyleSheet, Text, ImageBackground, View} from 'react-native';
import {Tile} from '../components/Tile';
import {tiles} from '../data/tiles';
import {ApiDemo} from '../components/ApiDemo';
import {IconReactNativeAnimated} from '../components/IconReactNativeAnimated/IconReactNativeAnimated';
import {Header} from '../components/Header/Header';
import {usePal} from '../pal';
import {backgroundImage} from '../assets/images';
import {FocusProvider, useFocusManager} from '../focus';

import {scaleFontSize, scaleWidth, scaleHeight} from '../utils/scaling';

const HomeScreenContent = () => {
  const {system} = usePal();
  const {focusedId} = useFocusManager();
  const focusedTileId = focusedId ?? 'home';

  const focusedTile = tiles.find(t => t.id === focusedTileId);

  const handleTileFocus = useCallback((_tileId: string) => {}, []);

  // No-op: blur doesn't reset state, avoiding the blur/focus race condition
  // that caused a 1-frame Header flash on Android TV.
  const handleTileBlur = useCallback(() => {}, []);

  // Handle tile press (D-pad select / OK button)
  const handleTilePress = useCallback(async (tileId: string) => {
    if (tileId === 'home') {
      try {
        const volume = await system.getSystemVolume();
        system.showToast(`System Volume: ${volume}%`);
      } catch (e) {
        system.showToast('Failed to get volume');
      }
    }
  }, [system]);

  const renderFocusedContent = () => {
    if (focusedTileId === 'home') {
      return <Header />;
    }

    return (
      <>
        <Text style={styles.focusedTitle}>{focusedTile?.label}</Text>
        {focusedTileId === 'api-demo' && <ApiDemo />}
        {focusedTileId === 'animation' && (
          <View style={styles.animationWrapper}>
            <IconReactNativeAnimated />
          </View>
        )}
        {focusedTileId !== 'api-demo' && focusedTileId !== 'animation' && (
          <Text style={styles.focusedDescription}>
            {focusedTile?.description}
          </Text>
        )}
      </>
    );
  };

  return (
    <ImageBackground
      source={backgroundImage}
      style={styles.background}>
      <View style={styles.headerArea}>{renderFocusedContent()}</View>
      <View style={styles.tileRowContent}>
        {tiles.map((tile, index) => (
          <Tile
            key={tile.id}
            id={tile.id}
            label={tile.label}
            icon={tile.icon}
            onFocus={handleTileFocus}
            onBlur={handleTileBlur}
            onPress={handleTilePress}
            testID={`tile-${tile.id}`}
            accessibilityLabel={tile.accessibilityLabel}
            hasTVPreferredFocus={tile.id === 'home'}
            focusRow={0}
            focusCol={index}
            focusZone="home-tiles"
          />
        ))}
      </View>
    </ImageBackground>
  );
};

export const HomeScreen = () => (
  <FocusProvider initialFocusId="home">
    <HomeScreenContent />
  </FocusProvider>
);


const styles = StyleSheet.create({
  background: {
    flex: 1,
    padding: scaleWidth(160),
  },
  headerArea: {
    flex: 3,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  focusedTitle: {
    color: '#FFFFFF',
    fontSize: scaleFontSize(150),
    lineHeight: scaleFontSize(140),
    fontWeight: 'bold',
    width: scaleWidth(700),
  },
  focusedDescription: {
    color: '#FFFFFF',
    fontSize: scaleFontSize(60),
    lineHeight: scaleFontSize(80),
    flex: 1,
  },
  tileRowContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  animationWrapper: {
    flex: 1,
    alignItems: 'flex-end',
    justifyContent: 'center',
  },
});
