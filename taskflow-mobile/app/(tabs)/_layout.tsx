/**
 * @file app/(tabs)/_layout.tsx
 * @description Bottom tab bar navigation with 6 tabs.
 *
 * Author: Aditya Pratap Bhuyan — https://linkedin.com/in/adityabhuyan
 */

import React from 'react'
import { Tabs } from 'expo-router'
import { Ionicons } from '@expo/vector-icons'
import { Platform } from 'react-native'

type IoniconName = React.ComponentProps<typeof Ionicons>['name']

function tabIcon(name: IoniconName, outlineName: IoniconName) {
  return ({ color, focused }: { color: string; focused: boolean }) => (
    <Ionicons name={focused ? name : outlineName} size={24} color={color} />
  )
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor:   '#6366f1',
        tabBarInactiveTintColor: '#94a3b8',
        tabBarStyle: {
          backgroundColor: '#fff',
          borderTopColor:  '#e2e8f0',
          paddingBottom:   Platform.OS === 'ios' ? 20 : 4,
          height:          Platform.OS === 'ios' ? 80 : 60,
        },
        headerStyle:      { backgroundColor: '#6366f1' },
        headerTintColor:  '#fff',
        headerTitleStyle: { fontWeight: '700', fontSize: 18 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title:      "Today",
          tabBarIcon: tabIcon('today', 'today-outline'),
        }}
      />
      <Tabs.Screen
        name="all-tasks"
        options={{
          title:      "All Tasks",
          tabBarIcon: tabIcon('list', 'list-outline'),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title:      "Calendar",
          tabBarIcon: tabIcon('calendar', 'calendar-outline'),
        }}
      />
      <Tabs.Screen
        name="weekly"
        options={{
          title:      "Weekly",
          tabBarIcon: tabIcon('bar-chart', 'bar-chart-outline'),
        }}
      />
      <Tabs.Screen
        name="heatmap"
        options={{
          title:      "Activity",
          tabBarIcon: tabIcon('grid', 'grid-outline'),
        }}
      />
      <Tabs.Screen
        name="export"
        options={{
          title:      "Export",
          tabBarIcon: tabIcon('share', 'share-outline'),
        }}
      />
    </Tabs>
  )
}
