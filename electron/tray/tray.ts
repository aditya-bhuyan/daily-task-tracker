import { Tray, Menu, BrowserWindow, nativeImage, app } from 'electron'

let tray: Tray | null = null

// ────────────────────────────────────────────────────────────────────────────
// Minimal 16x16 blue square as a PNG data URL
// Generated via base64 encoding a hand-crafted minimal PNG
// ────────────────────────────────────────────────────────────────────────────
const TRAY_ICON_DATA_URL =
  'data:image/png;base64,' +
  'iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABHNCSVQICAgIfAhkiAAAAAlwSFlz' +
  'AAALEgAACxIB0t1+/AAAABx0RVh0U29mdHdhcmUAQWRvYmUgRmlyZXdvcmtzIENTNXG14zYAAAAW' +
  'SURBVDiNY2AYBaNgFIwCKgIAAQQAAf8B+gEAAAAASUVORK5CYII='

function buildContextMenu(mainWindow: BrowserWindow): Electron.Menu {
  return Menu.buildFromTemplate([
    {
      label: 'Show TaskFlow',
      click: () => {
        mainWindow.show()
        mainWindow.focus()
      },
    },
    {
      label: "Today's Tasks",
      click: () => {
        mainWindow.show()
        mainWindow.focus()
        mainWindow.webContents.send('navigate', 'today')
      },
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => {
        app.quit()
      },
    },
  ])
}

export function createTray(mainWindow: BrowserWindow): void {
  const icon = nativeImage.createFromDataURL(TRAY_ICON_DATA_URL)
  tray = new Tray(icon)

  tray.setToolTip('TaskFlow')
  tray.setContextMenu(buildContextMenu(mainWindow))

  tray.on('click', () => {
    if (mainWindow.isVisible()) {
      mainWindow.focus()
    } else {
      mainWindow.show()
      mainWindow.focus()
    }
  })
}

export function updateTrayTooltip(incompleteCount: number): void {
  if (!tray) return
  _incompleteCount = incompleteCount
  const label =
    incompleteCount === 0
      ? 'TaskFlow — All done today! ✅'
      : `TaskFlow — ${incompleteCount} task${incompleteCount !== 1 ? 's' : ''} remaining today`
  tray.setToolTip(label)
}

export function destroyTray(): void {
  if (tray) {
    tray.destroy()
    tray = null
  }
}
