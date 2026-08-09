export const IPC = {
  TASKS: {
    GET_ALL:    'tasks:getAll',
    GET_BY_ID:  'tasks:getById',
    GET_TODAY:  'tasks:getToday',
    GET_BY_DATE: 'tasks:getByDate',
    CREATE:     'tasks:create',
    UPDATE:     'tasks:update',
    DELETE:     'tasks:delete',
    ARCHIVE:    'tasks:archive',
  },
  CATEGORIES: {
    GET_ALL: 'categories:getAll',
    CREATE:  'categories:create',
    UPDATE:  'categories:update',
    DELETE:  'categories:delete',
    REORDER: 'categories:reorder',
  },
  COMPLETIONS: {
    MARK_COMPLETE:    'completions:markComplete',
    MARK_DEFERRED:    'completions:markDeferred',
    MARK_SKIPPED:     'completions:markSkipped',
    GET_FOR_DATE:     'completions:getForDate',
    GET_HISTORY:      'completions:getHistory',
    GET_STREAK:       'completions:getStreak',
    DELETE_FOR_DATE:  'completions:deleteForDate',
  },
  RECURRENCES: {
    CREATE: 'recurrences:create',
    UPDATE: 'recurrences:update',
    DELETE: 'recurrences:delete',
  },
  APP: {
    GET_VERSION:         'app:getVersion',
    OPEN_DATA_FOLDER:    'app:openDataFolder',
    UPDATE_TRAY_COUNT:   'app:updateTrayCount',
    SNOOZE_TASK:         'app:snoozeTask',
  },
  TASKS_CALENDAR: {
    GET_OCCURRENCES_FOR_MONTH: 'tasks:getOccurrencesForMonth',
  },
} as const
