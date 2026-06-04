<script setup>
import { computed, onMounted, ref } from "vue";
import { useRouter } from "vue-router";

import { useKnowledgeStore } from "../../../stores/knowledge.store";

import FaqAccordion from "../components/FaqAccordion.vue";
import FaqSearchBar from "../components/FaqSearchBar.vue";
import FaqCategoryFilter from "../components/FaqCategoryFilter.vue";

const router = useRouter();
const knowledgeStore = useKnowledgeStore();

const search = ref("");
const selectedCategory = ref("All");
const openFaq = ref(null);

onMounted(async () => {
    await knowledgeStore.fetchFaqs();
});

const categories = computed(() => {
    const names = knowledgeStore.faqs
        .map(item => item.category?.name)
        .filter(Boolean);

    return [
        "All",
        ...new Set(names),
    ];
});

const filteredFaqs = computed(() => {
    return knowledgeStore.faqs.filter(faq => {
        const matchSearch = faq.title
            ?.toLowerCase()
            .includes(search.value.toLowerCase());

        const matchCategory =
            selectedCategory.value === "All"
            || faq.category?.name === selectedCategory.value;

        return matchSearch && matchCategory;
    });
});
</script>

<template>
    <div class="faq-page">
        <div class="faq-topbar">
            <button
                class="back-button"
                @click="router.back()"
            >
                <i class="fa-solid fa-arrow-left"></i>
            </button>

            <div class="header-info">
                <img
                    src="/logo.png"
                    class="header-logo"
                />

                <div>
                    <h1>
                        Knowledge Base
                    </h1>

                    <p>
                        Find answers to common questions
                    </p>
                </div>
            </div>
        </div>

        <div class="faq-container">
            <FaqSearchBar
                v-model="search"
            />

            <FaqCategoryFilter
                :categories="categories"
                :selected-category="selectedCategory"
                @select="selectedCategory = $event"
            />

            <h3 class="faq-result">
                {{ filteredFaqs.length }}
                results found
            </h3>

            <FaqAccordion
                v-for="faq in filteredFaqs"
                :key="faq.id"
                :faq="faq"
                :is-open="openFaq === faq.id"
                @toggle="
                    openFaq =
                        openFaq === faq.id
                        ? null
                        : faq.id
                "
            />
        </div>
    </div>
</template>

<style scoped>
@import "../../../assets/styles/faq.css";
</style>
