/**
 * @file app/_layout.tsx
 * @description Root Expo Router layout.
 *              Wraps the entire app in SQLiteProvider + notification setup.
 *
 * Author: Aditya Pratap Bhuyan — https://linkedin.com/in/adityabhuyan
 */

import React, { useEffect } from 'react'
import { Stack } from 'expo-router'
import { SQLiteProvider } from 'expo-sqlite'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { DB_NAME, migrateDbIfNeeded } from '../src/db/database'
import { setupNotificationChannel, requestPermissions } from '../src/notifications/scheduler'

// Keep splash screen visible until DB is ready
SplashScreen.preventAutoHideAsync()

export default function RootLayout() {
  useEffect(() => {
    // Request notification permissions on first launch (non-blocking)
    requestPermissions().catch(console.warn)
    setupNotificationChannel().catch(console.warn)
  }, [])

  return (
    <SQLiteProvider
      databaseName={DB_NAME}
      onInit={migrateDbIfNeeded}
      onInitError={(e) => console.error('DB init error:', e)}
      useSuspense
    >
      <StatusBar style="auto" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="modal/task-form"
          options={{
            presentation: 'modal',
            headerShown:  true,
            title:        'Task',
            headerStyle:  { backgroundColor: '#6366f1' },
            headerTintColor: '#fff',
          }}
        />
      </Stack>
    </SQLiteProvider>
  )
}
