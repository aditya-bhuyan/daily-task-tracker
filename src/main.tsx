import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App'
import './index.css'
import { mockTaskApi } from './lib/mockApi'

// In browser mode (no Electron preload), inject the in-memory mock API so the
// full UI is functional. window.taskApi is injected by preload.ts in Electron
// and takes precedence — this only runs when it is absent.
if (typeof window !== 'undefined' && !window.taskApi) {
  // @ts-ignore — intentional polyfill for browser mode
  window.taskApi = mockTaskApi
}

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)
