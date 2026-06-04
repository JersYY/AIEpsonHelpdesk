<script setup>
defineProps({
  contexts: { type: Array, default: () => [] },
})

const title = (c) => c.documentTitle || c.document?.title || 'Knowledge'
</script>

<template>
  <details v-if="contexts.length" class="context-panel">
    <summary>
      <i class="fa-solid fa-book"></i>
      {{ contexts.length }} sumber knowledge terkait
    </summary>
    <div v-for="(c, i) in contexts" :key="i" class="context-item">
      <strong>{{ title(c) }}</strong>
      <span class="muted">{{ (c.chunkText || '').slice(0, 160) }}...</span>
    </div>
  </details>
</template>
