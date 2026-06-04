<script setup>

defineProps({
    modelValue: String,
    });

    defineEmits([
    "update:modelValue",
    ]);

    </script>

    <template>

    <div class="faq-search">
        <i class="fa-solid fa-magnifying-glass"></i>

        <input
            :value="modelValue"
            @input="$emit('update:modelValue', $event.target.value)"
            type="text"
            placeholder="Search FAQ..."
        />
    </div>

</template>

<style scoped>
.faq-search i {
    color: #7d88a7;
    font-size: 16px;

    margin-right: 12px;
}

.faq-search input {
    width: 100%;

    border: none;
    outline: none;

    background: transparent;

    font-size: 14px;
    color: #25345b;

    font-family: 'Inter', sans-serif;
}

.faq-search input::placeholder {
    color: #7d88a7;
}
</style>
