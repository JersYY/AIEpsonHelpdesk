<script setup>
const props = defineProps({
  isDark: { type: Boolean, default: false },
  isRailCollapsed: { type: Boolean, default: false },
})

const emit = defineEmits(['toggle-sidebar', 'toggle-theme'])
</script>

<template>
  <button
    class="sidebar-toggle"
    :title="props.isRailCollapsed ? 'Buka sidebar' : 'Buka menu'"
    @click="emit('toggle-sidebar')"
  >
    <i class="fa-solid fa-bars-staggered"></i>
  </button>

  <div class="app-bar-spacer"></div>

  <button class="theme-switch" :title="isDark ? 'Mode terang' : 'Mode gelap'" @click="emit('toggle-theme')">
    <span class="theme-switch-track" :class="{ dark: isDark }">
      <span class="theme-switch-thumb">
        <i :class="isDark ? 'fa-solid fa-moon' : 'fa-solid fa-sun'"></i>
      </span>
    </span>
  </button>
</template>
