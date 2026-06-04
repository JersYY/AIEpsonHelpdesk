<script setup>

defineProps({
    value: {
        type: String,
        required: true
    },

    type: {
        type: String,
        default: 'status'
    }
})

</script>

<template>

    <span
        class="status-pill"
        :class="[
            value?.toLowerCase(),
            type
        ]"
    >
        {{ value }}
    </span>

</template>