module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    // Reanimated 4.x : le plugin a été déplacé vers react-native-worklets.
    // Doit rester en DERNIÈRE position de la liste des plugins.
    plugins: ["react-native-worklets/plugin"],
  };
};
