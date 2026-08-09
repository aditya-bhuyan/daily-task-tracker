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
| **Global shortcut** | Registered via `globalShortcut.register()` in main; fires `quick-add-task` IPC event to renderer |
| **electronBridge** | Separate `contextBridge.exposeInMainWorld('electronBridge', …)` for renderer-bound messages |
| **Versioned DB migrations** | `migrations.ts` runner checks `db_version` table; migration v2 adds sub-tasks, tags, sort_order |

---

## Project Structure

```
daily-task-tracker/
│
├── electron/                       Main process (Node.js + Electron)
│   ├── main.ts                     Entry: window, DB init, tray, scheduler, global hotkey
│   ├── preload.ts                  contextBridge → window.taskApi + window.electronBridge
│   ├── db/
│   │   ├── database.ts             DB singleton, WAL pragma, migrations, seeding
│   │   ├── migrations.ts           Versioned migration runner (v1 initial, v2 subtasks/tags)
│   │   ├── schema.ts               DDL strings + default category seed data
│   │   ├── types.ts                TypeScript interfaces (Task, Category, Recurrence, etc.)
│   │   ├── tasks.ts                CRUD + JOIN queries → TaskWithDetails + reorderTasks()
│   │   ├── categories.ts           Category CRUD
│   │   ├── recurrences.ts          Recurrence CRUD
│   │   ├── completions.ts          Completion log: upsert, markComplete, getStreak
│   │   ├── subtasks.ts             Sub-task CRUD + reorder (NEW)
│   │   ├── tags.ts                 Tag CRUD + setTaskTags join management (NEW)
│   │   └── analytics.ts            getWeeklyStats, getHeatmapData, exportTasks/Completions (NEW)
│   ├── ipc/
│   │   ├── channels.ts             All IPC channel name constants (single source of truth)
│   │   └── handlers.ts             ipcMain.handle() registrations for all channels
│   ├── scheduler/
│   │   ├── recurrenceEngine.ts     isDueOn() + getOccurrencesInRange() — pure, no side effects
│   │   └── notificationScheduler.ts  node-cron jobs, snooze, fireNotification()
│   └── tray/
│       └── tray.ts                 createTray, updateTrayTooltip, destroyTray
│
├── src/                            Renderer (React + TypeScript)
│   ├── main.tsx                    Entry: mounts React, injects mock API in browser mode
│   ├── App.tsx                     Root: view switching, modals, global hotkey listener
│   ├── index.css                   Tailwind + CSS variable theme (light + dark)
│   ├── components/
│   │   ├── ui/                     shadcn/ui primitives (button, card, dialog, popover, etc.)
│   │   ├── Layout.tsx              Two-column: Sidebar + main content
│   │   ├── Sidebar.tsx             Nav items (Today/All/Calendar/Weekly/Heatmap/Export), categories, theme toggle
│   │   ├── TaskCard.tsx            Card: drag handle, title, 🍅 Pomodoro btn, ⋯ menu, tags, sub-task badge
│   │   ├── TaskList.tsx            List container with HTML5 drag-and-drop reorder logic
│   │   ├── TaskForm.tsx            Full create/edit form incl. recurrence sub-form + TagPicker
│   │   ├── TaskModal.tsx           Dialog wrapper around TaskForm
│   │   ├── CompletionActions.tsx   Done/Tomorrow/PickDay/Skip/Snooze
│   │   ├── FilterBar.tsx           Search (debounced) + Priority/Status/Schedule chips
│   │   ├── SubtaskList.tsx         Inline checklist: add/toggle/delete/drag-reorder (NEW)
│   │   ├── TagPicker.tsx           Multi-select tag picker with inline create + colour swatch (NEW)
│   │   └── PomodoroTimer.tsx       25/5/15 min SVG ring timer, audio beep, page-title countdown (NEW)
│   ├── pages/
│   │   ├── TodayView.tsx           getToday() + updateTrayCount (drag-and-drop enabled)
│   │   ├── AllTasksView.tsx        getAll() + FilterBar
│   │   ├── CategoryView.tsx        getAll({category_id}) + FilterBar
│   │   ├── CalendarView.tsx        Monthly CSS grid, density dots, day-click panel
│   │   ├── WeeklyReviewView.tsx    Stats: rate ring, mini-bars, streaks, week navigation (NEW)
│   │   ├── HeatmapView.tsx         53×7 SVG heatmap, dark/light colours, hover tooltip (NEW)
│   │   └── ExportView.tsx          CSV/JSON export: tasks + completions (NEW)
│   ├── context/AppContext.tsx      Global state: selectedView (incl. weekly/heatmap/export), categories
│   ├── hooks/useTheme.ts           Dark/light: system detect + localStorage persist
│   ├── lib/
│   │   ├── utils.ts                cn() utility
│   │   ├── mockApi.ts              Full in-memory window.taskApi (subtasks, tags, analytics, export)
│   │   └── browserNotifications.ts Web Notifications API: 30s poll, tag dedup, snooze
│   └── types/
│       ├── api.d.ts                window.taskApi TS declarations (all methods)
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

All constants live in [`electron/ipc/channels.ts`](../../electron/ipc/channels.ts).

### Tasks

| Channel | Args | Returns |
|---|---|---|
| `tasks:getAll` | `filters?` | `TaskWithDetails[]` |
| `tasks:getById` | `id` | `TaskWithDetails \| undefined` |
| `tasks:getToday` | — | `TaskWithDetails[]` |
| `tasks:getByDate` | `date` | `TaskWithDetails[]` |
| `tasks:create` | `CreateInput` | `TaskWithDetails` |
| `tasks:update` | `id, UpdateInput` | `TaskWithDetails \| undefined` |
| `tasks:delete` | `id` | `boolean` |
| `tasks:archive` | `id` | `boolean` |
| `tasks:reorder` | `ids[]` | `void` |
| `tasks:getOccurrencesForMonth` | `year, month` | `Record<string, number>` |

### Categories

| Channel | Args | Returns |
|---|---|---|
| `categories:getAll` | — | `Category[]` |
| `categories:create` | `data` | `Category` |
| `categories:update` | `id, data` | `Category \| undefined` |
| `categories:delete` | `id` | `boolean` |
| `categories:reorder` | `ids[]` | `void` |

### Completions

| Channel | Args | Returns |
|---|---|---|
| `completions:markComplete` | `task_id, date, notes?` | `TaskCompletion` |
| `completions:markDeferred` | `task_id, date, deferred_to` | `TaskCompletion` |
| `completions:markSkipped` | `task_id, date` | `TaskCompletion` |
| `completions:getForDate` | `date` | `TaskCompletion[]` |
| `completions:getHistory` | `task_id, limit?` | `TaskCompletion[]` |
| `completions:getStreak` | `task_id` | `number` |
| `completions:deleteForDate` | `task_id, date` | `boolean` |

### Sub-tasks

| Channel | Args | Returns |
|---|---|---|
| `subtasks:getForTask` | `task_id` | `Subtask[]` |
| `subtasks:create` | `task_id, title` | `Subtask` |
| `subtasks:update` | `id, data` | `Subtask \| undefined` |
| `subtasks:delete` | `id` | `boolean` |
| `subtasks:reorder` | `task_id, ids[]` | `void` |

### Tags

| Channel | Args | Returns |
|---|---|---|
| `tags:getAll` | — | `Tag[]` |
| `tags:create` | `name, color?` | `Tag` |
| `tags:update` | `id, data` | `Tag \| undefined` |
| `tags:delete` | `id` | `boolean` |
| `tags:setTaskTags` | `task_id, tag_ids[]` | `void` |
| `tags:getForTask` | `task_id` | `Tag[]` |

### Analytics

| Channel | Args | Returns |
|---|---|---|
| `analytics:getWeeklyStats` | `weekOffset?` | `WeeklyStats` |
| `analytics:getHeatmapData` | `days?` | `HeatmapDay[]` |
| `analytics:exportTasks` | — | `ExportRow[]` |
| `analytics:exportCompletions` | — | `CompletionExportRow[]` |

### App

| Channel | Args | Returns |
|---|---|---|
| `app:getVersion` | — | `string` |
| `app:openDataFolder` | — | `void` |
| `app:updateTrayCount` | `count` | `void` |
| `app:snoozeTask` | `taskId, minutes` | `boolean` |
| `app:saveExportFile` | `filename, content` | `string` (saved path) |

### Renderer-bound events (main → renderer)

| Channel | Sent when | Handler |
|---|---|---|
| `quick-add-task` | `Ctrl+Shift+Space` pressed | Opens Add Task modal |

These are received via `window.electronBridge.on(channel, handler)` exposed through a separate `contextBridge.exposeInMainWorld('electronBridge', …)` block in `preload.ts`.

---

## Development Commands

```bash
npm run dev           # Start with hot reload (Electron)
npm run build         # Production build — all three bundles
npm run typecheck     # tsc --noEmit (zero errors expected)
npm run lint          # eslint — zero warnings policy
npm run lint:fix      # Auto-fix lint issues
npm run dist          # Build + package current platform
npm run dist:win      # Windows .exe
npm run dist:mac      # macOS .dmg
npm run dist:linux    # Linux .AppImage + .deb
```

---

## Adding a New IPC Channel

1. Add the channel name constant to `electron/ipc/channels.ts`
2. Add `ipcMain.handle(IPC.NAMESPACE.CHANNEL, ...)` in `electron/ipc/handlers.ts`
3. Expose via `contextBridge` in `electron/preload.ts`
4. Declare the method signature in `src/types/api.d.ts`
5. Add a matching in-memory stub in `src/lib/mockApi.ts` for browser mode

## Adding a New DB Table (migration)

1. Add the DDL to `electron/db/schema.ts` (`SCHEMA_SQL`)
2. Add a new numbered migration object in `electron/db/migrations.ts` using `ALTER TABLE` / `CREATE TABLE IF NOT EXISTS` so existing databases are upgraded safely
3. Update `electron/db/types.ts` with the new TypeScript interface
4. Create a DAL file in `electron/db/` with CRUD functions
5. Update `src/types/api.d.ts` (renderer-side interface)
6. Update `src/lib/mockApi.ts` with in-memory equivalents

## Adding a New View

1. Create `src/pages/MyView.tsx`
2. Add the view name to `SelectedView` union in `src/context/AppContext.tsx`
3. Add a `NavItem` entry in `src/components/Sidebar.tsx`
4. Add a `renderView()` branch in `src/App.tsx`

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
| Global hotkey conflicts | `Ctrl+Shift+Space` may be claimed by another app; no fallback currently |
