# Notifications & System Tray

> **Created and maintained by [Aditya Pratap Bhuyan](https://linkedin.com/in/adityabhuyan)**

---

## Desktop Notifications (Electron)

TaskFlow uses `node-cron` in the Electron main process. Notifications fire automatically while the app is running — even when minimised to tray.

### Notification timing

| Task configuration | Notification fires |
|---|---|
| Due Time set (e.g. `09:30`) | At exactly `09:30` |
| No Due Time set | At `09:00 AM` (default) |

### What a notification looks like

```
┌─────────────────────────────────────────┐
│  TaskFlow                                │
│  📋 Morning standup                      │
│  💼 Office / Professional  ·  ⏰ 09:00   │
│                                          │
│  [Snooze 5 min] [Snooze 10 min] [Snooze 30 min]   [Dismiss] │
└─────────────────────────────────────────┘
```

- **Sender name:** "TaskFlow"
- **Title:** `📋 Task name`
- **Body:** Category icon + name · due time

### Clicking a notification

Opens and focuses the TaskFlow window, navigated to Today view.

### Snooze from notification (Windows 10/11)

Expand the notification in the Action Center to see action buttons:
- **Snooze 5 min** — re-fires in 5 minutes
- **Snooze 10 min** — re-fires in 10 minutes
- **Snooze 30 min** — re-fires in 30 minutes

> macOS and Linux support for notification action buttons varies by OS version.

### Snooze from in-app

Every task card in Today view has a **💤 Snooze** button in the completion actions row. Click it → popover with 5 min / 10 min / 30 min / 1 hour. Works on both desktop and browser.

---

## Notification Schedule by Recurrence Type

| Recurrence | Cron fired |
|---|---|
| Daily (every 1 day) | Every day at due time |
| Weekly (Mon, Wed, Fri) | Mon, Wed, Fri at due time |
| Monthly (1st) | 1st of each month at due time |
| Yearly (Jan 1) | January 1st at due time |
| Custom cron | Exactly as the expression specifies |

---

## Browser Notifications (localhost:5173)

Uses the **Web Notifications API** — works in Chrome, Edge, and Firefox.

### Setup

1. Open the app in Chrome/Edge
2. A blue banner appears bottom-right: **"🔔 Allow notifications → Enable"**
3. Click **Enable** → browser permission prompt → click **Allow**

### How it works

- Polls every **30 seconds**
- Checks if any active task's `due_time` matches the current HH:MM
- If matched and not already fired: triggers a Web Notification
- `tag` ensures same-task notifications replace rather than stack

### Browser limitations

| Limitation | Notes |
|---|---|
| Tab must be open | Notifications only fire while the tab is visible |
| Data is in-memory | Tasks are lost on page refresh |
| No tray | System tray not available in browser |
| No notification action buttons | Snooze is in-app only |

---

## System Tray

The tray icon appears when TaskFlow launches on desktop.

### Behaviour table

| Action | Result |
|---|---|
| Click tray icon | Show and focus the app window |
| Close window (✕) | Window hides; app keeps running in tray |
| Right-click tray icon | Context menu |
| Context → Show TaskFlow | Focuses window |
| Context → Today's Tasks | Focuses window, navigates to Today view |
| Context → Quit | Fully exits the app |

### Tray tooltip

Updated automatically when Today view loads:
- `TaskFlow — 5 tasks remaining today`
- `TaskFlow — All done today! ✅`

---

## Notification Troubleshooting

### Windows
- **Settings → System → Notifications → TaskFlow** — ensure it is **On**
- Disable **Focus Assist** / **Do Not Disturb** if notifications are suppressed
- In development mode the app may appear as "Electron" in notification settings — this is normal

### macOS
- **System Settings → Notifications → TaskFlow** — set to Alerts or Banners
- Allow notifications when prompted on first run

### Linux
```bash
# Install libnotify
sudo apt-get install -y libnotify-bin       # Ubuntu/Debian
sudo dnf install -y libnotify               # Fedora

# Minimal WMs (i3, sway) need a notification daemon
sudo apt-get install -y dunst
dunst &

# GNOME tray icon not showing
sudo apt-get install -y gnome-shell-extension-appindicator
```
