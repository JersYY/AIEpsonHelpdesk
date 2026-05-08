<script setup>
defineProps({
    title: String,
    subtitle: String,
    icon: String
})
</script>

<template>
    <div class="quick-card">
        <div class="quick-icon">
            <i :class="icon"></i>
        </div>

        <div>
            <h3>{{ title }}</h3>
            <p>{{ subtitle }}</p>
        </div>
    </div>
</template>