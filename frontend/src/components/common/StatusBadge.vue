<script setup>
defineProps({
  status: { type: String, default: '' },
})
</script>

<template>
  <span class="badge" :class="`badge-${(status || '').toLowerCase()}`">
    {{ status }}
  </span>
</template>
