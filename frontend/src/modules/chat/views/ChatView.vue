<script setup>
import { ref, nextTick } from 'vue'
import { useRouter } from 'vue-router'

import chatService from '../../../services/chat.service'
import uploadService from '../../../services/upload.service'

import '../../../assets/styles/chat.css'

import UploadButton from '../components/UploadButton.vue'

const router = useRouter()

const message = ref('')
const loading = ref(false)

const selectedImage = ref(null)
const uploadedImageId = ref(null)

const messages = ref([
    {
        sender: 'AI',
        text: "Hello! I'm your AI Helpdesk Assistant. How can I help you today?"
    }
])

const goBack = () => {
    router.push('/dashboard')
}

const sendMessage = async () => {

    if (
        !message.value.trim() &&
        !uploadedImageId.value
    ) return

    const userText = message.value

    messages.value.push({
        sender: 'USER',
        text: userText,
        image: selectedImage.value
    })

    message.value = ''

    try {

        loading.value = true

        const response =
            await chatService.sendMessage({
                message: userText,
                imageId: uploadedImageId.value
            })

        const aiReply =
            response.data.data.aiMessage.messageText

        messages.value.push({
            sender: 'AI',
            text: aiReply
        })

        selectedImage.value = null
        uploadedImageId.value = null

        await nextTick()

    } catch (error) {

        console.log(error)

        messages.value.push({
            sender: 'AI',
            text: 'AI service unavailable'
        })

    } finally {

        loading.value = false
    }
}

const handleSelectImage = async (file) => {

    if (file.size > 3 * 1024 * 1024) {

        alert('Maximum image size is 3MB')
        return
    }

    try {

        selectedImage.value =
            URL.createObjectURL(file)

        const response =
            await uploadService.uploadImage(file)

        uploadedImageId.value =
            response.data.data.id

    } catch (error) {

        console.log(error)

        alert('Failed to upload image')
    }
}
</script>

<template>

    <div class="chat-page">

        <!-- HEADER -->
        <div class="chat-header">

            <button
                class="back-button"
                @click="goBack"
            >
                <i class="fa-solid fa-arrow-left"></i>
            </button>

            <div class="header-info">

                <img
                    src="/logo.png"
                    class="header-logo"
                />

                <div>

                    <h2>AI Helpdesk</h2>

                    <p>
                        AI Troubleshooting Assistant
                    </p>

                </div>

            </div>

        </div>

        <!-- CHAT -->
        <div class="chat-container">

            <div class="chat-messages">

                <template
                    v-for="(chat, index) in messages"
                    :key="index"
                >

                    <!-- AI MESSAGE -->
                    <div
                        v-if="chat.sender === 'AI'"
                        class="ai-message"
                    >

                        <img
                            src="/logo.png"
                            class="ai-avatar"
                        />

                        <div class="ai-bubble">
                            {{ chat.text }}
                        </div>

                    </div>

                    <!-- USER MESSAGE -->
                    <div
                        v-else
                        class="user-message"
                    >

                        <div class="user-bubble">

                            <img
                                v-if="chat.image"
                                :src="chat.image"
                                class="chat-image"
                            />

                            <p v-if="chat.text">
                                {{ chat.text }}
                            </p>

                        </div>

                    </div>

                </template>

                <!-- LOADING -->
                <div
                    v-if="loading"
                    class="ai-message"
                >

                    <img
                        src="/logo.png"
                        class="ai-avatar"
                    />

                    <div class="ai-bubble">
                        AI is typing...
                    </div>

                </div>

            </div>

        </div>

        <!-- IMAGE PREVIEW -->
        <div
            v-if="selectedImage"
            class="image-preview-wrapper"
        >

            <img
                :src="selectedImage"
                class="image-preview"
            />

            <button
                class="remove-image-button"
                @click="selectedImage = null"
            >
                <i class="fa-solid fa-xmark"></i>
            </button>

        </div>

        <!-- INPUT -->
        <div class="chat-input-wrapper">

            <div class="chat-input-box">

                <UploadButton
                    @select="handleSelectImage"
                />

                <input
                    v-model="message"
                    type="text"
                    placeholder="Type your message..."
                    @keyup.enter="sendMessage"
                />

                <button
                    class="send-button"
                    @click="sendMessage"
                >
                    <i class="fa-solid fa-paper-plane"></i>
                </button>

            </div>

        </div>

    </div>

</template>