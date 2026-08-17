import { Tray, Menu, BrowserWindow, nativeImage, app } from 'electron'

let tray: Tray | null = null

// ────────────────────────────────────────────────────────────────────────────
// Tray icon — 64×64 RGBA PNG, white checklist marks on fully transparent bg.
// Single unbroken base64 string (no line-split) to prevent IDAT corruption.
// Resized to 16×16 for Windows/Linux tray; macOS uses @2x slot (32px).
// ────────────────────────────────────────────────────────────────────────────
const TRAY_ICON_B64 = 'iVBORw0KGgoAAAANSUhEUgAAAEAAAABACAYAAACqaXHeAAAAZElEQVR42u3YsREAIQhFQfpvGhtAIwOU3QJuxpd4/ggAAChlYfThTxGyqeuH331YAAEEEOCbAONvAf8BAAAWIYuQRchzWAABBLAIWYQsQgAAFiGLkEXIc1gAAQSwCFmEAAB42AJKxqUu8UqAdAAAAABJRU5ErkJggg=='

const TRAY_ICON = nativeImage
  .createFromDataURL('data:image/png;base64,' + TRAY_ICON_B64)
  .resize({ width: 16, height: 16 })

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
  tray = new Tray(TRAY_ICON)

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
