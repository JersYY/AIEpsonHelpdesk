<script setup>
defineProps({
  priority: { type: String, default: '' },
})
</script>

<template>
  <span class="badge" :class="`badge-${(priority || '').toLowerCase()}`">
    {{ priority }}
  </span>
</template>
