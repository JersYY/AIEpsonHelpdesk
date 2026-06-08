<script setup>
import { computed } from 'vue'
import { formatStatus } from '../../utils/formatters.js'

const props = defineProps({
  status: { type: String, default: '' },
})

const displayStatus = computed(() => formatStatus(props.status))
</script>

<template>
  <span class="badge" :class="`badge-${(status || '').toLowerCase()}`">
    {{ displayStatus }}
  </span>
</template>
