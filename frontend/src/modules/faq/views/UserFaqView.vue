<script setup>
import { computed, onMounted, ref } from 'vue'

import { useKnowledgeStore } from '../../../stores/knowledge.store'

const knowledgeStore = useKnowledgeStore()

const search = ref('')
const selectedCategory = ref('All')
const openFaq = ref(null)

onMounted(() => knowledgeStore.fetchFaqs())

const categories = computed(() => {
  const names = knowledgeStore.faqs.map((i) => i.category?.name).filter(Boolean)
  return ['All', ...new Set(names)]
})

const filteredFaqs = computed(() =>
  knowledgeStore.faqs.filter((faq) => {
    const matchSearch = faq.title?.toLowerCase().includes(search.value.toLowerCase())
    const matchCategory = selectedCategory.value === 'All' || faq.category?.name === selectedCategory.value
    return matchSearch && matchCategory
  }),
)
</script>

<template>
  <div class="content-pad">
    <h1 class="page-title">Knowledge Base</h1>
    <p class="page-subtitle">Temukan jawaban untuk pertanyaan umum.</p>

    <input v-model="search" class="input" placeholder="Cari pertanyaan..." style="margin-bottom: 14px;" />

    <div class="cat-filter">
      <button
        v-for="cat in categories"
        :key="cat"
        class="btn"
        :class="selectedCategory === cat ? 'btn-primary' : 'btn-ghost'"
        @click="selectedCategory = cat"
      >
        {{ cat }}
      </button>
    </div>

    <p class="muted" style="margin: 16px 0;">{{ filteredFaqs.length }} hasil ditemukan</p>

    <div class="faq-list">
      <div v-for="faq in filteredFaqs" :key="faq.id" class="card faq-acc">
        <button class="faq-head" @click="openFaq = openFaq === faq.id ? null : faq.id">
          <div>
            <strong>{{ faq.title }}</strong>
            <span v-if="faq.category" class="badge badge-medium" style="margin-left: 8px;">{{ faq.category.name }}</span>
          </div>
          <i :class="openFaq === faq.id ? 'fa-solid fa-chevron-up' : 'fa-solid fa-chevron-down'"></i>
        </button>
        <div v-if="openFaq === faq.id" class="faq-body">{{ faq.content }}</div>
      </div>
      <p v-if="!filteredFaqs.length" class="muted">Tidak ada hasil.</p>
    </div>
  </div>
</template>

<style scoped>
.cat-filter { display: flex; gap: 8px; flex-wrap: wrap; }
.faq-list { display: flex; flex-direction: column; gap: 10px; }
.faq-acc { padding: 0; overflow: hidden; }
.faq-head {
  width: 100%; display: flex; justify-content: space-between; align-items: center;
  padding: 14px 16px; background: transparent; border: none; cursor: pointer;
  color: var(--color-text); font-family: inherit; text-align: left;
}
.faq-body { padding: 0 16px 16px; color: var(--color-muted); white-space: pre-wrap; line-height: 1.6; }
</style>
