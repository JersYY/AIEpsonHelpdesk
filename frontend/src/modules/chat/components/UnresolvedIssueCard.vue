<script setup>
defineProps({
    faqs: {
        type: Array,
        default: () => []
    }
})

const emit = defineEmits([
    'view-faq',
    'escalate'
])
</script>

<template>

    <div class="unresolved-card">

        <div class="unresolved-title">

            <i class="fa-solid fa-circle-exclamation"></i>

            <span>
                Unable to fully resolve this issue
            </span>

        </div>

        <p class="unresolved-description">
            Here are some suggested FAQ articles that might help:
        </p>

        <div class="faq-list">

            <div
                v-for="(faq,index) in faqs.slice(0,3)"
                :key="index"
                class="faq-item"
            >

                <div class="faq-icon">
                    <i class="fa-regular fa-circle-question"></i>
                </div>

                <div class="faq-content">

                    <div class="faq-question">
                        {{
                            faq.title ||
                            faq.question ||
                            faq.document?.title ||
                            'Related FAQ'
                        }}
                    </div>

                    <div class="faq-category">
                        {{
                            faq.category?.name ||
                            'Knowledge Base'
                        }}
                    </div>

                </div>

            </div>

        </div>

        <div class="faq-actions">

            <button
                class="faq-btn"
                @click="emit('view-faq')"
            >
                <i class="fa-regular fa-book-open"></i>

                View FAQ
            </button>

            <button
                class="escalate-btn"
                @click="emit('escalate')"
            >
                <i class="fa-solid fa-circle-exclamation"></i>

                Escalate To Helpdesk
            </button>

        </div>

    </div>

</template>