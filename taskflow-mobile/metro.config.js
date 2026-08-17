// Metro bundler config for NativeWind v4 + monorepo workspace resolution
// Author: Aditya Pratap Bhuyan

const { getDefaultConfig } = require('expo/metro-config')
const { withNativeWind } = require('nativewind/metro')
const path = require('path')

const projectRoot = __dirname
const workspaceRoot = path.resolve(projectRoot, '..')

const config = getDefaultConfig(projectRoot)

// ── Monorepo: watch all workspace packages ────────────────────────────────────
config.watchFolders = [workspaceRoot]

// ── Monorepo: resolve modules from both projectRoot and workspaceRoot ─────────
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
]

// ── NativeWind v4 integration ─────────────────────────────────────────────────
module.exports = withNativeWind(config, {
  input: './src/global.css',
})
