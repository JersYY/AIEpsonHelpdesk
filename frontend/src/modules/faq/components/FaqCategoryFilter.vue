<script setup>

defineProps({
    categories: Array,
    selectedCategory: String,
});

defineEmits([
    "select",
]);

</script>

<template>

    <div class="category-list">

        <button
        v-for="category in categories"
        :key="category"
        class="category-chip"
        :class="{
            active: selectedCategory === category
        }"
        @click="$emit('select', category)"
        >
        {{ category }}
        </button>

    </div>

</template>

<style scoped>
.category-list {
    display: flex;
    gap: 14px;
    flex-wrap: wrap;

    margin-bottom: 30px;
}

.category-chip {
    border: none;

    background: #747F9B;
    color: white;

    border-radius: 999px;

    padding: 8px 18px;

    cursor: pointer;

    font-size: 13px;
    font-weight: 700;

    min-width: 48px;

    transition: 0.2s;
}

.category-chip.active {
    background: #CDDBFF;
    color: #25345b;
}
</style>
