const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Reduce the number of files Metro watches to avoid EMFILE errors
config.resolver.blockList = [
  /node_modules\/.git/,
  /node_modules\/.cache/,
  /node_modules\/.*\/(test|__tests__|tests|docs|examples|\.github)\/.*/,
];

config.watchFolders = [__dirname];

module.exports = config;
