<script setup>
defineProps({
    title: String,
    subtitle: String,
    total: Number,
    icon: String
})
</script>

<template>
    <div class="issue-card">

        <div class="issue-left">
            <div class="issue-icon">
                <i :class="icon"></i>
            </div>

            <div>
                <h4>{{ title }}</h4>
                <p>{{ subtitle }}</p>
            </div>
        </div>

        <div class="issue-badge">
            {{ total }} cases
        </div>

    </div>
</template>