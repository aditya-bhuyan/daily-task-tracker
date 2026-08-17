# TaskFlow Mobile 📱

> **React Native (Expo) mobile companion to the TaskFlow desktop app.**  
> Daily task tracker for Android & iOS — same features, same data model, built for your pocket.
>
> **Author:** Aditya Pratap Bhuyan — [linkedin.com/in/adityabhuyan](https://linkedin.com/in/adityabhuyan)

---

## ✨ Features

| Category | Feature | Details |
|---|---|---|
| **Tasks** | 9 Categories | 💼 Office · 🏃 Health · 💰 Finance · 📚 Study · 🧘 Spiritual · 🏠 Daily Personal · 💊 Daily Health · 📅 Weekday · 🎉 Weekend |
| | Recurrence | Daily · Weekly (pick days) · Monthly · Yearly · Hourly · Custom — with end date or end after N |
| | Schedule types | Any day / Weekdays only / Weekends only |
| | Subtasks | Inline checklist per task with progress bar |
| | Tags | Multi-colour free-form labels |
| | Priority | High / Medium / Low with colour coding |
| **Completion** | Done | Marks the occurrence; recurring tasks remain active for next cycle |
| | Defer | Push to tomorrow or any chosen date |
| | Skip | Skip today's occurrence |
| | Snooze | 15 min · 30 min · 1 hr · 2 hr reminder |
| | Undo | Reverse any of the above in one tap |
| **Views** | Today | Progress bar header, quick-complete, FAB add button |
| | All Tasks | Full-text search + category / priority / schedule filters |
| | Calendar | Monthly grid with density dots; tap any day to list its tasks |
| | Weekly Review | Completion-rate donut, category bars, priority bars, streak ladder, week navigation |
| | Activity Heatmap | GitHub-style 52-week colour grid with best-streak / active-days stats |
| | Export | CSV or JSON of tasks and completions; native OS share sheet |
| **Productivity** | Pomodoro Timer | 25 / 5 min work-break cycles with haptic feedback |
| | Notifications | Local push reminders at task due time; hourly repeat; snooze trigger |
| **UI** | Dark / Light | Follows device system preference |

---

## 🏗 Architecture

```
taskflow-mobile/
│
├── app.json                      Expo config — app name, Android package, EAS project ID
├── package.json                  Dependencies (Expo SDK 51, NativeWind v4, expo-router v3)
├── tsconfig.json                 Path alias: @taskflow/shared → packages/shared/src
├── babel.config.js               NativeWind + Reanimated preset
├── metro.config.js               Monorepo watchFolders + NativeWind integration
├── tailwind.config.js            NativeWind preset + custom colour tokens
├── eas.json                      Build profiles: development · preview (APK) · production (AAB)
│
├── app/                          Expo Router v3 — file-based routing
│   ├── _layout.tsx               Root layout: SQLiteProvider, migration, notifications init
│   ├── (tabs)/
│   │   ├── _layout.tsx           Bottom tab bar with Ionicons (6 tabs)
│   │   ├── index.tsx             Today view
│   │   ├── all-tasks.tsx         All Tasks + search + filters
│   │   ├── calendar.tsx          Monthly calendar
│   │   ├── weekly.tsx            Weekly Review
│   │   ├── heatmap.tsx           Activity Heatmap
│   │   └── export.tsx            CSV / JSON Export
│   └── modal/
│       └── task-form.tsx         Create / Edit task modal (all fields + recurrence + tags + subtasks)
│
└── src/
    ├── db/
    │   ├── database.ts           expo-sqlite init + migrations + DEFAULT_CATEGORIES seed
    │   ├── schema.ts             DDL — identical to desktop (7 tables, 7 indexes)
    │   ├── tasks.ts              Task CRUD: getAll / getById / getToday / getByDate / create / update / delete / reorder
    │   ├── categories.ts         Category CRUD + reorder
    │   ├── completions.ts        markComplete / markDeferred / markSkipped / getStreak / deleteForDate
    │   ├── subtasks.ts           Subtask CRUD + reorder
    │   ├── tags.ts               Tag CRUD + setTaskTags pivot
    │   ├── analytics.ts          getWeeklyStats / getHeatmapData / exportTasks / exportCompletions
    │   └── api.ts                createApi(db) → implements full TaskApi interface (same shape as desktop)
    ├── notifications/
    │   └── scheduler.ts          expo-notifications: daily/hourly/snooze, Android channel setup
    └── components/
        ├── TaskCard.tsx           Priority accent bar, category chip, recurrence badge, subtask progress, action buttons
        ├── CompletionActions.tsx  Bottom-sheet modal: Done / Skip / Defer / Snooze / Undo
        ├── SubtaskList.tsx        Inline checklist with add / toggle / delete
        ├── FilterBar.tsx          Horizontal chip filters: category · priority · schedule type
        └── PomodoroTimer.tsx      25/5 work-break cycles, animated ring, haptic feedback
```

### Shared Package (`packages/shared/`)

The mobile app imports `@taskflow/shared` — code that is **identical** across both apps:

| File | What it provides |
|---|---|
| `src/types.ts` | All TypeScript interfaces: `Task`, `Category`, `Recurrence`, `TaskApi`, `WeeklyStats`, … |
| `src/recurrenceEngine.ts` | `isDueOn()` · `getOccurrencesInRange()` — pure functions, zero platform dependencies |
| `src/constants.ts` | `DEFAULT_CATEGORIES` (9), `PRIORITY_COLORS`, `HEATMAP_LEVELS`, day/month labels |

---

## 🚀 Getting Started

### Prerequisites

| Tool | Version | Notes |
|---|---|---|
| Node.js | 20 LTS | [nodejs.org](https://nodejs.org) |
| Expo CLI | latest | `npm install -g expo-cli` |
| EAS CLI | latest | For device/CI builds only — `npm install -g eas-cli` |
| Android Studio | latest | For local Android builds; not needed for Expo Go |

### 1 — Install dependencies

```bash
# From the monorepo root (installs all workspaces at once)
cd "Watsonx Challenge-2026"
npm install

# Or install only the mobile app
cd taskflow-mobile
npm install
```

### 2 — Start the development server

```bash
cd taskflow-mobile
npx expo start
```

| Key | Action |
|---|---|
| `a` | Open on Android emulator |
| `i` | Open on iOS simulator *(Mac only)* |
| QR code | Scan with **Expo Go** app on your device |

### 3 — Run directly on a device / emulator

```bash
npx expo start --android    # Android
npx expo start --ios        # iOS (Mac only)
```

---

## 📦 Building for Distribution

### Option A — Expo EAS Build (recommended — no local Android/iOS toolchain needed)

```bash
npm install -g eas-cli
eas login                                          # free Expo account

# One-time project link
cd taskflow-mobile
eas init                                           # generates projectId

# Preview APK (sideload / share for testing)
eas build --platform android --profile preview

# Production AAB (Google Play Store)
eas build --platform android --profile production

# iOS IPA (requires paid Apple Developer account)
eas build --platform ios --profile production
```

### Option B — Local Android build (requires Android Studio + SDK)

```bash
npx expo run:android
```

---

## ⚙️ Configuration

### `app.json` — required before first EAS build

```json
{
  "expo": {
    "extra": {
      "eas": {
        "projectId": "YOUR_EAS_PROJECT_ID"
      }
    }
  }
}
```

Get the `projectId` by running `eas init` inside `taskflow-mobile/`.

### `eas.json` — build profiles

| Profile | Output | Use for |
|---|---|---|
| `development` | Debug APK with dev client | Local development on device |
| `preview` | Release APK | Internal testing / sharing |
| `production` | Release AAB | Google Play Store submission |

For Play Store submission, add `google-services-key.json` and complete the `submit.production.android` section in `eas.json`.

---

## 🔁 CI/CD — GitHub Actions

The workflow `mobile-build.yml` fires on two triggers:

| Trigger | Profile used | Output |
|---|---|---|
| `git push --tags` (e.g. `v1.0.0`) | `production` | AAB auto-queued on EAS |
| Manual dispatch (GitHub UI) | Your choice | APK or AAB on EAS |

### Complete release command sequence

```powershell
# Stage and commit all changes
git add .
git commit -m "chore: release v1.0.0"

# Create version tag (must match v*.*.* pattern)
git tag v1.0.0

# Push branch AND tag together
git push origin main --tags
```

This triggers three workflows at once:
- **CI** (`deno.yml`) — typecheck + lint + Vite build
- **Desktop Release** (`npm-publish.yml`) — Win / Mac / Linux installers + GitHub Release
- **Mobile Build** (`mobile-build.yml`) — EAS Android production AAB

### One-time GitHub secret setup

Add `EXPO_TOKEN` as a repository secret before the mobile workflow can authenticate:

> **GitHub → Settings → Secrets and variables → Actions → New repository secret**  
> Name: `EXPO_TOKEN`  
> Value: your Expo access token from [expo.dev/settings/access-tokens](https://expo.dev/settings/access-tokens)

---

## 🗃 Database

The mobile app uses **expo-sqlite** with the exact same 7-table schema as the desktop:

| Table | Description |
|---|---|
| `categories` | 9 default categories — seeded on first launch |
| `recurrences` | Recurrence rules (type, interval, days_of_week, ends_on, ends_after) |
| `tasks` | Core records — title, priority, due date/time, schedule type, sort order |
| `task_completions` | Per-occurrence status: `completed` / `skipped` / `deferred` |
| `subtasks` | Inline checklist items — sort order preserved |
| `tags` | Free-form colour labels |
| `task_tags` | Many-to-many pivot |

**DB file location:** app private documents directory — not accessible to other apps and not shared with the desktop. Copy it with `expo-file-system` or the device file manager to back it up.

---

## 🔔 Notifications

Implemented in `src/notifications/scheduler.ts` using `expo-notifications`:

| Notification type | When it fires |
|---|---|
| **Daily reminder** | At `due_time` for every task due today — re-scheduled on Today view load |
| **Hourly task** | Repeating every 3 600 seconds for tasks with `recurrence.type = 'hourly'` |
| **Snooze** | One-off, N minutes after the snooze action |

Permissions are requested on first launch. If denied, the app degrades gracefully — task management works fully, only push reminders are absent.

---

## 🔗 Monorepo Context

```
Watsonx Challenge-2026/
├── package.json                ← npm workspaces root
├── tsconfig.base.json          ← shared TS options
├── daily-task-tracker/         ← 🖥 Electron desktop (DO NOT MODIFY)
├── packages/shared/            ← 📦 @taskflow/shared
└── taskflow-mobile/            ← 📱 This app
```

> ⚠️ The desktop app (`daily-task-tracker/`) is **frozen**. All new feature work goes into `taskflow-mobile/` or `packages/shared/` only.

---

## 🤝 Contributing

1. Fork the repository
2. Branch: `git checkout -b feat/my-feature`
3. Install: `npm install` from the monorepo root
4. Develop and test: `cd taskflow-mobile && npx expo start`
5. Ensure no TypeScript errors: `npm run typecheck`
6. PR to `main`

---

## 📄 License

MIT © [Aditya Pratap Bhuyan](https://linkedin.com/in/adityabhuyan)
