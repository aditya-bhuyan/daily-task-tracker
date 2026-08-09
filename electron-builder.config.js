/**
 * electron-builder configuration — plain JS (CommonJS) to avoid the
 * config-file-ts cache bug on Windows CI runners (electron-builder v24
 * constructs an invalid path from the absolute source path when caching
 * compiled .ts configs on Windows).
 *
 * Author: Aditya Pratap Bhuyan  https://linkedin.com/in/adityabhuyan
 */

/** @type {import('electron-builder').Configuration} */
const config = {
  appId: 'com.taskflow.app',
  productName: 'TaskFlow',
  copyright: 'Copyright © 2025 Aditya Pratap Bhuyan',

  directories: {
    buildResources: 'resources',
    output: 'dist',
  },

  files: ['out/**/*'],

  extraResources: [
    {
      from: 'node_modules/better-sqlite3/build/Release',
      to: 'better-sqlite3/build/Release',
      filter: ['*.node'],
    },
  ],

  // ── Windows ────────────────────────────────────────────────────────────────
  win: {
    target: [{ target: 'nsis', arch: ['x64'] }],
    icon: 'resources/icon.ico',
  },

  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    createDesktopShortcut: true,
    createStartMenuShortcut: true,
  },

  // ── macOS ──────────────────────────────────────────────────────────────────
  mac: {
    target: [{ target: 'dmg', arch: ['x64', 'arm64'] }],
    icon: 'resources/icon.icns',
    category: 'public.app-category.productivity',
  },

  // ── Linux ──────────────────────────────────────────────────────────────────
  // `maintainer` is required by FpmTarget when building .deb packages.
  linux: {
    target: [
      { target: 'AppImage', arch: ['x64'] },
      { target: 'deb',      arch: ['x64'] },
    ],
    icon: 'resources/icon.png',
    category: 'Utility',
    maintainer: 'Aditya Pratap Bhuyan <adityabhuyan@example.com>',
  },

  publish: null,
}

module.exports = config
