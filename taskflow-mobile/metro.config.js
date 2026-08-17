// Metro bundler config — monorepo workspace resolution
// Author: Aditya Pratap Bhuyan

const { getDefaultConfig } = require('expo/metro-config')
const path = require('path')

const projectRoot = __dirname
const workspaceRoot = path.resolve(projectRoot, '..')

const config = getDefaultConfig(projectRoot)

// ── Monorepo: watch workspace root so Metro can resolve @taskflow/shared ──────
// Merges with (rather than replaces) Expo's default watchFolders
config.watchFolders = [
  ...( config.watchFolders ?? [] ),
  workspaceRoot,
]

// ── Monorepo: resolve modules from both projectRoot and workspaceRoot ─────────
config.resolver.nodeModulesPaths = [
  path.resolve(projectRoot, 'node_modules'),
  path.resolve(workspaceRoot, 'node_modules'),
]

module.exports = config
