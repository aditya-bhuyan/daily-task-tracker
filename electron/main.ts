import { app, BrowserWindow, ipcMain, shell, globalShortcut } from 'electron'
import { join } from 'path'
import { is } from '@electron-toolkit/utils'
import { initDatabase } from './db/database'
import { registerHandlers } from './ipc/handlers'
import { createTray, destroyTray } from './tray/tray'
import { startNotificationScheduler, stopScheduler } from './scheduler/notificationScheduler'

let mainWindow: BrowserWindow | null = null
let forceQuit = false

function createWindow(): void {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false,
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow?.show()
  })

  // Minimize to tray instead of closing
  mainWindow.on('close', (event) => {
    if (!forceQuit) {
      event.preventDefault()
      mainWindow?.hide()
    }
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished initialization.
app.whenReady().then(() => {
  // Set app user model id — this is the name shown in Windows notifications
  // Using the product name directly makes it show "TaskFlow" instead of the app ID
  app.setAppUserModelId('TaskFlow')

  // Initialize SQLite database and run migrations
  initDatabase()

  createWindow()

  // Register all IPC handlers (requires mainWindow for rescheduleAll calls)
  registerHandlers(ipcMain, mainWindow!)

  // System tray + notification scheduler (after window creation)
  if (mainWindow) {
    createTray(mainWindow)
    startNotificationScheduler(mainWindow)
  }

  // Feature 8: Global hotkey — Ctrl+Shift+Space opens quick-add window
  globalShortcut.register('CommandOrControl+Shift+Space', () => {
    if (!mainWindow) return
    if (!mainWindow.isVisible()) {
      mainWindow.show()
      mainWindow.focus()
    } else if (!mainWindow.isFocused()) {
      mainWindow.focus()
    }
    // Signal the renderer to open the quick-add task modal
    mainWindow.webContents.send('quick-add-task')
  })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    } else {
      mainWindow?.show()
    }
  })
})

app.on('before-quit', () => {
  forceQuit = true
  globalShortcut.unregisterAll()
  stopScheduler()
  destroyTray()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
