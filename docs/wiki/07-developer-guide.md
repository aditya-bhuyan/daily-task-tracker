# Developer Guide

> **Created and maintained by [Aditya Pratap Bhuyan](https://linkedin.com/in/adityabhuyan)**

Architecture, project structure, build system, and contribution guide for TaskFlow.

---

## Architecture

```
┌────────────────────────────────────────────────────────┐
│                    Electron Shell                       │
│                                                        │
│  ┌──────────────────────────────────────────────────┐  │
│  │     React + TypeScript Renderer                   │  │
│  │     (Vite, Tailwind CSS, shadcn/ui)               │  │
│  └─────────────────────┬────────────────────────────┘  │
│                        │  contextBridge (IPC)           │
│  ┌─────────────────────▼────────────────────────────┐  │
│  │          Electron Main Process                    │  │
│  │  ┌────────────┐  ┌────────────┐  ┌───────────┐   │  │
│  │  │ SQLite DAL │  │ node-cron  │  │   Tray    │   │  │
│  │  │ (sync)     │  │ Scheduler  │  │           │   │  │
│  │  └────────────┘  └────────────┘  └───────────┘   │  │
│  └──────────────────────────────────────────────────┘  │
└────────────────────────────────────────────────────────┘
```

### Key design decisions

| Decision | Rationale |
|---|---|
| **Synchronous SQLite** (`better-sqlite3`) | No async/await chains in main process; simpler, faster code |
| **IPC envelope pattern** | Every handler returns `{ success, data }` or `{ success, error }`; preload `invoke()` unwraps |
| **Pure recurrence engine** | `recurrenceEngine.ts` has zero Electron/DB imports — fully unit-testable |
| **Browser mock API** | `mockApi.ts` provides full in-memory `window.taskApi` injected synchronously before React mounts |
| **Minimize-to-tray** | `close` event is intercepted; true quit only via `app.quit()` from tray menu |

---

## Project Structure

```
daily-task-tracker/
│
├── electron/                       Main process (Node.js + Electron)
│   ├── main.ts                     Entry: window, DB init, tray, scheduler
│   ├── preload.ts                  contextBridge → window.taskApi
│   ├── db/
│   │   ├── database.ts             DB singleton, WAL pragma, migrations, seeding
│   │   ├── migrations.ts           Versioned migration runner
│   │   ├── schema.ts               DDL strings + default category seed data
│   │   ├── types.ts                TypeScript interfaces
│   │   ├── tasks.ts                CRUD + JOIN queries → TaskWithDetails
│   │   ├── categories.ts           Category CRUD
│   │   ├── recurrences.ts          Recurrence CRUD
│   │   └── completions.ts          Completion log: upsert, markComplete, getStreak
│   ├── ipc/
│   │   ├── channels.ts             All IPC channel name constants
│   │   └── handlers.ts             ipcMain.handle() registrations
│   ├── scheduler/
│   │   ├── recurrenceEngine.ts     isDueOn() + getOccurrencesInRange() — pure
│   │   └── notificationScheduler.ts  node-cron jobs, snooze, fireNotification()
│   └── tray/
│       └── tray.ts                 createTray, updateTrayTooltip, destroyTray
│
├── src/                            Renderer (React + TypeScript)
│   ├── main.tsx                    Entry: mounts React, injects mock API in browser
│   ├── App.tsx                     Root: view switching, modals, browser notif bootstrap
│   ├── index.css                   Tailwind + CSS variable theme
│   ├── components/
│   │   ├── ui/                     shadcn/ui primitives
│   │   ├── Layout.tsx              Two-column: Sidebar + main
│   │   ├── Sidebar.tsx             Nav, categories, theme toggle
│   │   ├── TaskCard.tsx            Task display, ⋯ menu, completion actions
│   │   ├── TaskList.tsx            List container, skeleton, empty state
│   │   ├── TaskForm.tsx            Full create/edit form incl. recurrence sub-form
│   │   ├── TaskModal.tsx           Dialog wrapper around TaskForm
│   │   ├── CompletionActions.tsx   Done/Tomorrow/PickDay/Skip/Snooze
│   │   └── FilterBar.tsx           Search + filter chips
│   ├── pages/
│   │   ├── TodayView.tsx
│   │   ├── AllTasksView.tsx
│   │   ├── CategoryView.tsx
│   │   └── CalendarView.tsx
│   ├── context/AppContext.tsx      Global state (view, categories, refreshTrigger)
│   ├── hooks/useTheme.ts           Dark/light mode
│   ├── lib/
│   │   ├── utils.ts                cn() utility
│   │   ├── mockApi.ts              In-memory window.taskApi for browser mode
│   │   └── browserNotifications.ts Web Notifications scheduler
│   └── types/
│       ├── api.d.ts                window.taskApi declarations
│       └── index.ts                Re-exports for renderer
│
├── docs/wiki/                      This documentation
├── INSTALL.md                      Platform installation guide
├── README.md
├── electron.vite.config.ts
├── electron-builder.config.ts
├── tailwind.config.js
└── package.json
```

---

## Tech Stack

| Layer | Technology | Version |
|---|---|---|
| Desktop shell | Electron | 28 |
| Frontend | React | 18 |
| Language | TypeScript | 5 |
| Build tool | electron-vite | 2 |
| UI components | shadcn/ui + Radix UI | latest |
| Styling | Tailwind CSS | 3 |
| Database | SQLite via better-sqlite3 | 9 |
| Cron scheduling | node-cron | 3 |
| Packaging | electron-builder | 24 |

---

## IPC Channel Reference

All constants: [`electron/ipc/channels.ts`](../../electron/ipc/channels.ts)

| Namespace | Channel | Description |
|---|---|---|
| tasks | `tasks:getAll` | All tasks with optional filters |
| tasks | `tasks:getById` | Single task by ID |
| tasks | `tasks:getToday` | Today's tasks (uses isDueOn) |
| tasks | `tasks:getByDate` | Tasks for a specific ISO date |
| tasks | `tasks:create` | Create task + optional inline recurrence |
| tasks | `tasks:update` | Update task |
| tasks | `tasks:delete` | Hard delete |
| tasks | `tasks:archive` | Set status = archived |
| tasks | `tasks:getOccurrencesForMonth` | Calendar month task counts |
| categories | `categories:getAll/create/update/delete/reorder` | Category CRUD |
| completions | `completions:markComplete` | Log a completion |
| completions | `completions:markDeferred` | Log a deferral |
| completions | `completions:markSkipped` | Log a skip |
| completions | `completions:getForDate` | Completions for a date |
| completions | `completions:getHistory` | History for a task |
| completions | `completions:getStreak` | Consecutive streak count |
| completions | `completions:deleteForDate` | Undo a completion |
| app | `app:getVersion` | App version |
| app | `app:openDataFolder` | Open userData in file manager |
| app | `app:updateTrayCount` | Update tray tooltip |
| app | `app:snoozeTask` | Schedule snooze re-notification |

---

## Development Commands

```bash
npm run dev           # Start with hot reload
npm run build         # Production build (no installer)
npm run dist          # Build + package current platform
npm run dist:win      # Windows .exe
npm run dist:mac      # macOS .dmg
npm run dist:linux    # Linux .AppImage + .deb

npx tsc --noEmit      # Type-check only
npx eslint src electron --ext .ts,.tsx   # Lint
```

---

## Adding a New IPC Channel

1. Add channel name to `electron/ipc/channels.ts`
2. Add `ipcMain.handle(...)` in `electron/ipc/handlers.ts`
3. Expose via `contextBridge` in `electron/preload.ts`
4. Declare in `src/types/api.d.ts`
5. Add stub in `src/lib/mockApi.ts` for browser mode

## Adding a New DB Column

1. Add column to DDL in `electron/db/schema.ts`
2. Add a new numbered migration in `electron/db/migrations.ts`
3. Update `electron/db/types.ts` + `src/types/api.d.ts`
4. Update affected DAL functions

---

## Known Limitations

| Limitation | Notes |
|---|---|
| Browser data is in-memory | By design — browser mode is UI preview only |
| No cloud sync | By design — offline-first, single-user |
| No multi-device | SQLite is local; no sync mechanism |
| Native module rebuild | `electron-rebuild` required after `npm install` on new machine |
| Cross-platform builds | Must build on target OS; use CI for multi-platform |
| Notification action buttons | Work on Windows 10/11; macOS/Linux support varies |
