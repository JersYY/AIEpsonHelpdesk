<script setup>

defineProps({
    faq: Object,
    isOpen: Boolean,
});

defineEmits([
    "toggle",
]);

</script>

<template>

    <div class="faq-card">

        <div
        class="faq-header"
        @click="$emit('toggle')"
        >

        <div class="faq-left">

            <div class="faq-icon">
            ?
            </div>

            <div>

            <h4>
                {{ faq.category?.name || "General" }}
            </h4>

            <p>
                {{ faq.title }}
            </p>

            </div>

        </div>

        <span class="faq-arrow">
            {{ isOpen ? "⌃" : "⌄" }}
        </span>

        </div>

        <div
        v-if="isOpen"
        class="faq-content"
        >
        {{ faq.content }}
        </div>

    </div>

</template>