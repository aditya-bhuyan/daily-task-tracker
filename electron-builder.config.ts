import type { Configuration } from 'electron-builder'

const config: Configuration = {
  appId: 'com.taskflow.app',
  productName: 'TaskFlow',
  copyright: 'Copyright © 2025',
  directories: {
    buildResources: 'resources',
    output: 'dist'
  },
  files: [
    'out/**/*'
  ],
  extraResources: [
    {
      from: 'node_modules/better-sqlite3/build/Release',
      to: 'better-sqlite3/build/Release',
      filter: ['*.node']
    }
  ],
  win: {
    target: [{ target: 'nsis', arch: ['x64'] }],
    icon: 'resources/icon.ico'
  },
  mac: {
    target: [{ target: 'dmg', arch: ['x64', 'arm64'] }],
    icon: 'resources/icon.icns',
    category: 'public.app-category.productivity'
  },
  linux: {
    target: [{ target: 'AppImage', arch: ['x64'] }, { target: 'deb', arch: ['x64'] }],
    icon: 'resources/icon.png',
    category: 'Utility'
  },
  nsis: {
    oneClick: false,
    allowToChangeInstallationDirectory: true,
    createDesktopShortcut: true,
    createStartMenuShortcut: true
  },
  publish: null
}

export default config
