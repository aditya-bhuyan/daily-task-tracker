# Task Management

> **Created and maintained by [Aditya Pratap Bhuyan](https://linkedin.com/in/adityabhuyan)**

Complete reference for creating, editing, completing, and managing tasks in TaskFlow.

---

## Task Fields

| Field | Required | Description |
|---|---|---|
| **Title** | ✅ | Short name for the task |
| **Description** | No | Optional notes or details |
| **Category** | No | One of 9 built-in categories (or none) |
| **Priority** | No | Low / **Medium** (default) / High |
| **Due Date** | No | The calendar date this task is due |
| **Due Time** | No | Time of day for the reminder notification (HH:MM) |
| **Schedule Type** | No | Any Day / Weekdays Only / Weekends Only |
| **Tags** | No | One or more free-form colour-coded labels |
| **Recurrence** | No | Whether and how the task repeats |

### Date & Time Behaviour

| Configured | Today View | Notification |
|---|---|---|
| Date + Time | ✅ Appears on that date | Fires at that time |
| Date only | ✅ Appears on that date | Fires at 9:00 AM |
| Time only, no date | ❌ Not shown unless recurring | Fires every day at that time |
| Neither | ❌ Not shown unless recurring | Fires daily at 9:00 AM |

---

## Creating a Task

1. Click **+ Add Task** (top-right, any view) — or press `Ctrl+Shift+Space` anywhere
2. Fill in fields — only Title is required
3. Click **Create Task**

---

## Editing a Task

- **Click the task title** (underlines on hover) → edit modal opens pre-filled
- **⋯ menu → ✏️ Edit** — same result

Click **Save Changes** to persist.

---

## Tags

Tags are free-form, colour-coded labels that provide a lightweight cross-category organisation layer.

### Adding tags to a task

In the task form, click the **Tags** field (shows `🏷 Add tags…`):
- An existing tag appears as a coloured chip — click it to select/deselect
- To create a new tag: type a name, pick a colour from the 10-colour swatch, click **Add**
- Selected tags show a ✓ ring; click **×** on a chip to remove it
- Press **Enter** in the tag-name input to create quickly

### Tags on task cards

Selected tags are shown as small coloured chips in the badge row alongside category and priority. The tag name is prefixed with 🏷.

### Tag colours

There are 10 preset colours to choose from when creating a tag:

`indigo · blue · green · amber · red · pink · violet · cyan · orange · slate`

---

## Sub-tasks / Checklists

Every task can have an expandable checklist of sub-tasks. Sub-tasks have their own completion state and are independent of the parent task's completion status.

### Showing/hiding the checklist

- **⋯ menu → 🔽 Show Sub-tasks** — expands the checklist inline on the card
- **⋯ menu → 🔼 Hide Sub-tasks** — collapses it
- **Click the `☑ X/N` progress badge** on the card — toggles expand/collapse

### Managing sub-tasks

| Action | How |
|---|---|
| Add | Type in the input at the bottom of the list → press **Enter** or click **+** |
| Complete | Click the checkbox next to the sub-task |
| Delete | Hover the row → click **✕** on the right |
| Reorder | Drag the **⠿** handle on the left |

### Progress bar

A thin progress bar at the top of the checklist fills from left to right as sub-tasks are completed. The counter `X/N` shows how many are done.

---

## Drag-and-Drop Reordering

In **Today** and **All Tasks** views, task cards can be reordered manually:

1. Hover a card to reveal the **⠿** drag handle on the left edge
2. Click and drag the handle (or the whole card) to a new position
3. A blue ring highlights the drop target as you drag
4. Release — the new order is saved to the database immediately

The same mechanism works for sub-tasks inside a checklist.

> **Note:** Drag-and-drop sets a manual `sort_order`. Any subsequent filter or search will still apply but results remain in your custom order within the filtered set.

---

## Archiving and Deleting

From the **⋯** (three-dot) menu on any task card:

| Action | Effect |
|---|---|
| **📦 Archive** | Hides from active views. History kept. Restore via Edit → Status → Active. |
| **🗑 Delete** | Permanently removes task + all history. Cannot be undone. |

For **recurring tasks**, the delete menu says **"Delete All Occurrences"** and shows a tip: use **⏩ Skip Today Only** to skip just today.

---

## Recurrence

Toggle **🔁 Recurrence** to **On** in the task form.

### Types

| Type | Fires on | Extra fields shown |
|---|---|---|
| **Daily** | Every N days from creation | Interval |
| **Weekly** | Specific days of week | Day toggles (S M T W T F S), Interval |
| **Monthly** | A specific day of each month | Day of month (1–31), Interval |
| **Yearly** | Specific day + month | Day of month, Month selector |
| **Hourly** | Every day (notification repeats hourly) | Interval |
| **Custom** | Defined by cron expression | Cron input + reference guide |

### Custom Cron

The form shows a built-in reference when Custom is selected:

```
Field order: minute(0-59) · hour(0-23) · day-of-month(1-31) · month(1-12) · day-of-week(0-6, 0=Sun)

Examples:
  0 9 * * 1-5      Weekdays at 9am
  0 8,20 * * *     8am & 8pm daily
  0 9 1 * *        1st of every month
  */30 * * * *     Every 30 minutes
  0 9 1 1 *        January 1st at 9am (yearly)
  0 9-17 * * 1-5   Every hour 9am–5pm, weekdays
```

### Schedule Type vs Recurrence

These are independent:
- **Schedule Type** — which days the task *appears* in Today view
- **Recurrence** — the repeat *pattern*

Example: Daily + Weekdays Only → recurs daily but only shown Mon–Fri.

### End Conditions

| Setting | Behaviour |
|---|---|
| **Never** | Recurs indefinitely |
| **Ends on date** | Stops on or after this date |
| **After N occurrences** | Stops after N completions are logged |

---

## Completion Actions

Each task card in **Today view** shows:

| Button | What it does |
|---|---|
| **✅ Done** | Marks today's occurrence complete. Recurring: task returns tomorrow. Non-recurring: task is archived. |
| **⏭ Tomorrow** | Defers today to tomorrow |
| **📅 Pick Day** | Opens date picker to defer to any future date |
| **⏭ Skip** | Marks today as skipped (breaks streak) |
| **💤 Snooze** | Re-schedules the reminder: 5 / 10 / 30 min or 1 hour |

After an action, the buttons are replaced by a status badge:

| Badge | Meaning |
|---|---|
| 🟢 **✓ Done** | Completed today |
| 🔵 **⏭ Deferred to [date]** | Pushed to a future date (with Undo) |
| ⬜ **⏭ Skipped** | Skipped today (with Undo) |

Click **Undo** to remove the record and restore action buttons.

### From the ⋯ Menu (all views)

| Option | Appears when | Effect |
|---|---|---|
| ✏️ Edit | Always | Open edit modal |
| 🔽/🔼 Show/Hide Sub-tasks | Always | Toggle inline checklist |
| ⏭ Move to Tomorrow | Always | Defer today to tomorrow |
| ⏩ Skip Today Only | Recurring tasks only | Skip today without deleting the task |
| 📦 Archive | Always | Archive the task |
| 🗑 Delete / Delete All | Always | Permanent delete |

---

## Streak Counter

For recurring tasks completed for 2+ consecutive days, a flame indicator appears on the task card:

```
🔥 7 day streak
```

Streaks count backwards from yesterday. A missed or skipped day resets the streak. The **Weekly Review** screen shows the top 5 streaks across all tasks.

---

## Pomodoro Timer

Every task card has a 🍅 button (visible on hover). Click it to open an in-card Pomodoro timer:

| Phase | Default Duration |
|---|---|
| 🍅 Focus | 25 minutes |
| ☕ Short Break | 5 minutes |
| 🛋 Long Break | 15 minutes (after every 4 focus rounds) |

The page title updates to `MM:SS 🍅 Focus — Task Name` while a timer is running so you always know how much time is left, even when working in another window. An audio beep sounds at each phase transition.

Controls: **▶ Start · ⏸ Pause · ⏭ Skip phase · ↺ Reset**

---

## Filters and Search

Available in **All Tasks** and **Category** views above the task list:

| Control | Options |
|---|---|
| 🔍 Search | Full-text on title + description (300ms debounce) |
| Priority | All · 🔴 High · 🟡 Medium · 🟢 Low |
| Status | All · Active · Archived |
| Days | All · Any · Weekdays · Weekends |

Click **✕ Clear filters** to reset all at once.

---

## Calendar View

- Monthly grid — click **← Prev** / **Next →** to navigate months
- Days with tasks show a **blue count badge**
- Click any day → task list appears below the calendar for that date
- Today is highlighted with a filled circle

---

## Weekly Review

Click **📊 Weekly Review** in the sidebar.

- **Completion rate ring** — colour-coded: green (≥80%), amber (≥50%), red (<50%)
- **Summary row** — Scheduled / Completed / Skipped / Deferred counts
- **By Priority** — progress bar per priority level
- **By Category** — progress bar per category, sorted by activity
- **🔥 Top Streaks** — top 5 tasks with the longest current streaks
- **Week navigation** — `← Prev` / `This Week` / `Next →`

---

## Activity Heatmap

Click **🟩 Heatmap** in the sidebar.

- Covers the last 365 days (53 weeks × 7 days)
- Cell colour intensity represents completion count: none → light → medium → dark → max
- Hover any cell for a tooltip: date + ✅ completed / ⏭ skipped / 📅 deferred counts
- Colour scale adapts to Light and Dark mode automatically
- Summary line shows total completions and number of active days
