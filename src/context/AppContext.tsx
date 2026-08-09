import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useReducer,
} from 'react'
import type { Category } from '@/types'

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type SelectedView =
  | 'today'
  | 'all'
  | 'calendar'
  | 'weekly'
  | 'heatmap'
  | 'export'
  | { type: 'category'; id: number }

interface AppState {
  selectedView: SelectedView
  categories: Category[]
  todayDate: string // ISO date string e.g. '2025-01-15'
  isLoading: boolean
  refreshTrigger: number
}

type AppAction =
  | { type: 'SET_VIEW'; payload: SelectedView }
  | { type: 'SET_CATEGORIES'; payload: Category[] }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'TRIGGER_REFRESH' }

// ---------------------------------------------------------------------------
// Reducer
// ---------------------------------------------------------------------------

function getTodayISO(): string {
  return new Date().toISOString().split('T')[0]
}

function reducer(state: AppState, action: AppAction): AppState {
  switch (action.type) {
    case 'SET_VIEW':
      return { ...state, selectedView: action.payload }
    case 'SET_CATEGORIES':
      return { ...state, categories: action.payload, isLoading: false }
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload }
    case 'TRIGGER_REFRESH':
      return { ...state, refreshTrigger: state.refreshTrigger + 1 }
    default:
      return state
  }
}

const initialState: AppState = {
  selectedView: 'today',
  categories: [],
  todayDate: getTodayISO(),
  isLoading: true,
  refreshTrigger: 0,
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

interface AppContextValue extends AppState {
  setView: (view: SelectedView) => void
  refreshCategories: () => Promise<void>
  triggerRefresh: () => void
}

const AppContext = createContext<AppContextValue | undefined>(undefined)

// ---------------------------------------------------------------------------
// Provider
// ---------------------------------------------------------------------------

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState)

  const refreshCategories = useCallback(async () => {
    dispatch({ type: 'SET_LOADING', payload: true })
    try {
      const cats = await window.taskApi.categories.getAll()
      dispatch({ type: 'SET_CATEGORIES', payload: cats })
    } catch {
      dispatch({ type: 'SET_LOADING', payload: false })
    }
  }, [])

  // Load categories on mount
  useEffect(() => {
    refreshCategories()
  }, [refreshCategories])

  const setView = useCallback((view: SelectedView) => {
    dispatch({ type: 'SET_VIEW', payload: view })
  }, [])

  const triggerRefresh = useCallback(() => {
    dispatch({ type: 'TRIGGER_REFRESH' })
  }, [])

  return (
    <AppContext.Provider value={{ ...state, setView, refreshCategories, triggerRefresh }}>
      {children}
    </AppContext.Provider>
  )
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useApp(): AppContextValue {
  const ctx = useContext(AppContext)
  if (!ctx) throw new Error('useApp must be used within <AppProvider>')
  return ctx
}
