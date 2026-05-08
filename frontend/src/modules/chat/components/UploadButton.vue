<script setup>
const emit = defineEmits([
    'select'
])

const handleFile = (event) => {

    const file =
        event.target.files[0]

    if (!file) return

    emit('select', file)
}
</script>

<template>

    <label class="upload-button">

        <input
            type="file"
            accept="image/*"
            hidden
            @change="handleFile"
        />

        <i class="fa-regular fa-image"></i>

    </label>

</template>