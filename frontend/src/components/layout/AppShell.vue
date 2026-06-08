<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

import { usePreferencesStore } from '../../stores/preferences.store'
import Header from './Header.vue'
import Sidebar from './Sidebar.vue'

import '../../assets/styles/shell.css'

const prefs = usePreferencesStore()

const drawerOpen = ref(false)
const isNarrow = ref(false)
let narrowQuery = null

const isRailCollapsed = computed(() => prefs.compactSidebar && !isNarrow.value)

const isDark = computed(() => {
  if (prefs.theme === 'dark') return true
  if (prefs.theme === 'light') return false
  return window.matchMedia('(prefers-color-scheme: dark)').matches
})

const toggleTheme = () => {
  prefs.setTheme(isDark.value ? 'light' : 'dark')
}

const toggleSidebar = () => {
  if (isNarrow.value) {
    drawerOpen.value = !drawerOpen.value
    return
  }
  prefs.toggleCompactSidebar()
}

const closeDrawer = () => {
  drawerOpen.value = false
}

const syncNarrow = () => {
  isNarrow.value = narrowQuery?.matches ?? false
}

onMounted(() => {
  narrowQuery = window.matchMedia('(max-width: 860px)')
  syncNarrow()
  narrowQuery.addEventListener('change', syncNarrow)
})

onBeforeUnmount(() => {
  narrowQuery?.removeEventListener('change', syncNarrow)
})
</script>

<template>
  <div class="app-shell" :class="{ 'sidebar-collapsed': isRailCollapsed, 'drawer-open': drawerOpen }">
    <div
      class="drawer-backdrop"
      :class="{ show: drawerOpen }"
      @click="closeDrawer"
    ></div>

    <Sidebar
      :drawer-open="drawerOpen"
      :is-rail-collapsed="isRailCollapsed"
      @close-drawer="closeDrawer"
      @toggle-sidebar="toggleSidebar"
    />

    <div class="app-main">
      <Header
        :is-dark="isDark"
        :is-rail-collapsed="isRailCollapsed"
        @toggle-sidebar="toggleSidebar"
        @toggle-theme="toggleTheme"
      />

      <div class="app-content">
        <router-view v-slot="{ Component, route }">
          <Transition name="route-fade" mode="out-in">
            <component :is="Component" :key="route.fullPath" />
          </Transition>
        </router-view>
      </div>
    </div>
  </div>
</template>
