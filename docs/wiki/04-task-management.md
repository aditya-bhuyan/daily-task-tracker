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

1. Click **+ Add Task** (top-right, any view)
2. Fill in fields — only Title is required
3. Click **Create Task**

---

## Editing a Task

- **Click the task title** (underlines on hover) → edit modal opens pre-filled
- **⋯ menu → ✏️ Edit** — same result

Click **Save Changes** to persist.

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

Streaks count backwards from yesterday. A missed or skipped day resets the streak.

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
