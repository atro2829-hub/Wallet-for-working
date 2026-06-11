const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

const { transformer } = config;
const defaultAssetExts = config.resolver.assetExts;
const defaultSourceExts = config.resolver.sourceExts;

config.resolver.assetExts = [
  ...defaultAssetExts.filter(ext => ext !== 'svg'),
];

config.resolver.sourceExts = [...defaultSourceExts, 'svg'];

config.transformer = {
  ...transformer,
  babelTransformerPath: require.resolve('react-native-svg-transformer'),
};

module.exports = config;
