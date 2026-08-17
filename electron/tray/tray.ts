import { Tray, Menu, BrowserWindow, nativeImage, app } from 'electron'

let tray: Tray | null = null

// ────────────────────────────────────────────────────────────────────────────
// Tray icon — 32×32 RGBA PNG, IBM blue (#3b82d4) rounded-rect background with
// white checklist marks. Visible on both light and dark taskbars.
// Electron/OS scales to tray size (16px Windows/Linux, 22px macOS retina).
// ────────────────────────────────────────────────────────────────────────────
const TRAY_ICON_B64 = 'iVBORw0KGgoAAAANSUhEUgAAACAAAAAgCAYAAABzenr0AAAAZmlEQVR42mNgGEzAuunKf3rgAbUcqyPobTmGI0YdMOoAUjWSC4aPA5AdMaBRMCBpgFqW43UALguoaTlBB6BbRG3LCUYBLcDQcgCh9DBaF4w6YDQbDnhtOJoIRx0w5HtHg69zOlAAACuDlzAhRM7AAAAAAElFTkSuQmCC'

const TRAY_ICON = nativeImage.createFromDataURL('data:image/png;base64,' + TRAY_ICON_B64)

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
