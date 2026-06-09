// Metro config Expo.
// Désactive la résolution via "package exports" : sinon @supabase/realtime-js
// résout `ws` vers sa version Node (qui importe `stream`, absent en React
// Native) et le bundle échoue. Sans les exports, Metro utilise le champ
// "browser" de `ws` (stub compatible RN avec le WebSocket natif).
const { getDefaultConfig } = require("expo/metro-config");

const config = getDefaultConfig(__dirname);
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
