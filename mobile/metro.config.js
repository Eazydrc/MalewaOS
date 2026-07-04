const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const path = require('path');

const sharedDir = path.resolve(__dirname, '../shared');

const config = {
  watchFolders: [sharedDir],
  resolver: {
    extraNodeModules: {
      '@elengi/shared': sharedDir,
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
