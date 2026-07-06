const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');
const path = require('path');

const sharedDir = path.resolve(__dirname, '../shared');
const mobileNodeModules = path.resolve(__dirname, 'node_modules');

const config = {
  watchFolders: [sharedDir],
  resolver: {
    extraNodeModules: new Proxy(
      { '@elengi/shared': sharedDir },
      {
        get: (target, name) => {
          if (name in target) return target[name];
          // Tout ce qui n'est pas trouvé dans shared/ → cherche dans mobile/node_modules
          return path.join(mobileNodeModules, name);
        },
      },
    ),
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
