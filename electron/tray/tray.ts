import { Tray, Menu, BrowserWindow, nativeImage, app } from 'electron'

let tray: Tray | null = null

// ────────────────────────────────────────────────────────────────────────────
// Tray icon — 256×256 RGBA PNG, white checklist marks on transparent background.
// Transparent bg means the icon blends into both light and dark taskbars.
// Resized to 16×16 at runtime by nativeImage (Electron best practice).
// ────────────────────────────────────────────────────────────────────────────
const TRAY_ICON_B64 =
  'iVBORw0KGgoAAAANSUhEUgAAAQAAAAEACAYAAABccqhmAAADUUlEQVR4nO3dQU4EQQwDQP7/6ea2' +
  'UmARWuHNJEzVCyzZ6Wt/fAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA' +
  'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAE3' +
  'OOefqDECD84KrswIhrxy+hwD+kb8cv0cAFkscv0cAFkoev0cAFnnH8XsEYIF3Hn/yEejIyVyJ' +
  'DfHElvI6cjJXYkN8sanAzqzMk1k8xaYCO7MyT2bxFJsK7MzKPJnFU2wqsDMr82QWT7GpwM6s' +
  'zJNZPA/bSrwiL3Pkls/DpgI7szJPZvEUmwrszMo8mcVTbCqwMyvzZBZPsanAzqzMk1k8xaYC' +
  'O7MyT2bxfLOlvI6czJXYEE9sKa8jJ3MlNsQPFAc35/jh5hw/3Jzjh5tz/ICfgYDKsQMAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAADA78455+oMQIPzgquzAiGvHL6HAP6Rvxy/RwAWSxy/' +
  'RwAWSh6/RwAWecfxewRggXcef/IR6MjJXIkN8cSW8jpyMldiQ3yxqcDOrMyTWTzFpgI7szJP' +
  'ZvEUmwrszMo8mcVTbCqwMyvzZBZPsanAzqzMk1k8D9tKvCIvc+SWz8OmAjuzMk9m8RSbCuzM' +
  'yjyZxVNsKrAzK/NkFk+xqcDOrMyTWTzFpgI7szJPZvF8s6W8jpzMldgQT2wpryMncyU2xA8U' +
  'Bzfn+OHmHD/cnOOHm3P8gJ+BgMqxAwAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAMDvzjnn' +
  '6gxAg/OCq7MCIa8cvocA/pG/HL9HABZLHL9HABZKHr9HABZ5x/F7BGCBdx5/8hHoyMlciQ3x' +
  'xJbyOnIyV2JDfLGpwM6szJNZPMWmAjuzMk9m8RSbCuzMyjyZxVNsKrAzK/NkFk+xqcDOrMyT' +
  'WTwP20q8Ii9z5JbPw6YCO7MyT2bxFJsK7MzKPJnFU2wqsDMr82QWT7GpwM6szJNZPMWmAjuz' +
  'MidmcXyzpbyOnMyV2BBPbCmvIydzJTbEDxQHN+f44eYcP9yc44ebc/yAn4GAyrEDAAAAAAAA' +
  'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAC8yCWyyTC8qmLasAAAAAElFTkSuQmCC'

const TRAY_ICON = nativeImage.createFromDataURL('data:image/png;base64,' + TRAY_ICON_B64)
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
