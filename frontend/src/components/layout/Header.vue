<script setup>
import Navbar from './Navbar.vue'

defineProps({
  isDark: { type: Boolean, default: false },
  isRailCollapsed: { type: Boolean, default: false },
})

const emit = defineEmits(['toggle-sidebar', 'toggle-theme'])
</script>

<template>
  <header class="app-bar">
    <Navbar
      :is-dark="isDark"
      :is-rail-collapsed="isRailCollapsed"
      @toggle-sidebar="emit('toggle-sidebar')"
      @toggle-theme="emit('toggle-theme')"
    />
  </header>
</template>
