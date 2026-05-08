<script setup>
defineProps({
    title: String,
    time: String,
    status: String,
})
</script>

<template>
    <div class="activity-card">

        <div class="activity-left">

            <div class="activity-icon">
                <i class="fa-regular fa-clock"></i>
            </div>

            <div>

                <h4>
                    {{ title }}
                </h4>

                <p>
                    {{ time }}
                </p>

            </div>

        </div>

        <div
            class="activity-status"
            :class="status?.toLowerCase()"
        >
            {{ status }}
        </div>

    </div>
</template>