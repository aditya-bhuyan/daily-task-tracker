import { Tray, Menu, BrowserWindow, nativeImage, app } from 'electron'

let tray: Tray | null = null

// ────────────────────────────────────────────────────────────────────────────
// App icon — 256×256 rounded-rect, IBM blue (#3b82d4) background with white
// checklist marks. Same image used for notifications and tray.
// Embedded as base64 so it works in both dev and packaged builds without
// any file-path resolution.
// ────────────────────────────────────────────────────────────────────────────
const APP_ICON_B64 =
  'iVBORw0KGgoAAAANSUhEUgAAAQAAAAEACAIAAADTED8xAAAFJUlEQVR4nO3cXU4jSRCFUfY1u5s1' +
  '9lYQEi+MWowYmoFyVTnTkVH3hM6zVTb3Ew/8PD2/vJb46+9f8KFqh0+GzspaBlD+qXFJqwdQ/g' +
  'ERYrkAyj8RAi0RQPmnQLiyAMrfOXx4dADlbxi+eFAA5e8TNswNoPztwU2zAih/Y7DT+ADK3xIc' +
  'MjKA8jcDJ4wJoPxtwGn3BlD+BuBO5wMof3QY4kwA5Q8NAwmAaMcCKH9cGG5vAOUPCpMIgGi3Ayh' +
  '/RJhKAETbCqD84eABBEC07wMofyx4GAEQTQBE+xpA+QPBgwmAaAIgmgCI9l8A5Y8CJQRANAEQTQ' +
  'BEEwDRBEA0ARBNAET7HUD5Q0AhARBNAEQTANEEQDQBEE0ARBMA0QRANAEQTQBEEwDRBEA0ARBN' +
  'AEQTANEEQDQBEE0ARBMA0QRANAEQTQBEEwDRBEA0ARBNAEQTANEEQLSuAby9vZU/AxfQKYC3n6/' +
  '82WiqRwAb05cB92gQwM71a4ATVg/g0Po1wFFLB3Bi/RrgkNAATr+y23/l++kdwNRPf9CX2G1d+Y' +
  'QEIIDKKiQAAVRe+YQEIIDKKydQ4wBmfwGGvL7bvvIVNQ7Ad4ALXPmEBCCAyiufkAAEUHnlExKA' +
  'ACqvfEK9A/CT4O5Xvh8BwA1LB+C3QZlt9QD8PQBTNQjAX4QxT48A3pk+w3UK4DOjZ4iuAcAQ' +
  'AiCaAIgmAKIJgGgCIJoAiCYAogmAaAIgmgCIJgCiCYBoAiCaAIgmAKIJgGgCIJoAiCYAogmA' +
  'aAIgmgCIJgCiCYBoXQPwn+EYolMA/jcow/UIwH+HZpIGAexcvwY4YfUADq1fAxy1dAAn1q8B' +
  'DgkN4PQru/1Xvp/eAUz99Ad9id3WlU9IAAKovPIJCUAAlVc+IQEIoPLKJ9Q4gNlfgCGv77av' +
  'fEWNA/Ad4AJXPiEBCKDyyiekAAFUXvmEBCCAyiufUO8A/CS4+5XvRwBww9IB+G1QZls9AH8P' +
  'wFQNAvAXYczTI4B3ps9wnQL4zOgZomsAMIQAiCYAogmAaAIgmgCIJgCiCYBoAiCaAIgmAKIJ' +
  'gGgCIJoAiCYAogmAaAIgmgCIJgCiCYBoAiCaAIgmAKIJgGgCIJoAiCYAonUNwH+GY4hOAfjf' +
  'oAzXIwD/HZpJGgSwc/0a4ITVAzi0fg1w1NIBnFi/BjgkNIDTr+z2X/l+egcw9dMf9CV2W1c+' +
  'IQEIoPLKJyQAAVRe+YQEIIDKKydQ4wBmfwGGvL7bvvIVNQ7Ad4ALXPmEBCCAyiufkAAEUHnl' +
  'ExKAACqvfEK9A/CT4O5Xvh8BwA1LB+C3QZlt9QD8PQBTNQjAX4QxT48A3pk+w3UK4DOjZ4iu' +
  'AcAQAiCaAIgmAKIJgGgCIJoAiCYAogmAaAIgmgCIJgCiCYBoAiCaAIgmAKIJgGgCIJoAiCYA' +
  'ogmAaAIgmgCIJgCiCYBoAiCaAIgmAKIJgGhPzy+v5Q8BJZ5fXgVALgEQTQBEEwDRBEA0ARBN' +
  'AET7NwANEOh9+QIglACIJgCi/RGABojyMXsBkEgARPsmAA0Q4vPmBUCcHwPQAJf3ZfACIMuN' +
  'ADTAhf1/7QIgyK4ANMAlfTv17wPQABfz084FQITDAWiAy9gY+VYAGuACthd+IwAN0Nqe8+0A' +
  'NECT+7a9KwAN0M6eYe8NQAMs7OheDwcgA9Z0bsknA9AASzk94/MByIAV3DngewOQAVWGTHdM' +
  'ADLgkQaOdmQASmCqGVudEoAYGGX2PqcHIAz2qNrhP0+LL3RCy7EEAAAAAElFTkSuQmCC'

const TRAY_ICON = nativeImage.createFromDataURL('data:image/png;base64,' + APP_ICON_B64)
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
