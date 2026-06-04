<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

import chatService from '../../../services/chat.service.js'
import uploadService from '../../../services/upload.service.js'
import ticketService from '../../../services/ticket.service.js'

import '../../../assets/styles/chat.css'

import UploadButton from '../components/UploadButton.vue'
import UnresolvedIssueCard from '../components/UnresolvedIssueCard.vue'
import EscalateModal from '../components/EscalateModal.vue'
import TicketSuccessModal from '../components/TicketSuccessModal.vue'

const router = useRouter()

const CONFIDENCE_THRESHOLD = 0.6

const message = ref('')
const loading = ref(false)

const selectedImage = ref(null)
const uploadedImageId = ref(null)

const sessionId = ref(null)

const showUnresolvedCard = ref(false)
const showEscalateModal = ref(false)
const showSuccessModal = ref(false)

const createdTicket = ref(null)
const suggestedFaqs = ref([])

const messages = ref([
    {
        sender: 'AI',
        text: "Hello! I'm your AI Helpdesk Assistant. How can I help you today?"
    }
])

const goBack = () => {
    router.push('/dashboard')
}

const createTicket = async (priority) => {

    if (!sessionId.value) {

        alert('Session not found')
        return

    }

    try {

        const response =
            await ticketService.createTicket({
                sessionId: sessionId.value,
                priority
            })

        createdTicket.value =
            response.data.data

        showEscalateModal.value = false

        showSuccessModal.value = true

    } catch (error) {

        console.error(error)

        alert(
            'Failed to create ticket'
        )

    }
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

        showUnresolvedCard.value = false

        const response =
            await chatService.sendMessage({
                sessionId: sessionId.value,
                message: userText,
                imageId: uploadedImageId.value
            })

        const data =
            response.data.data

        if (data.session?.id) {

            sessionId.value =
                data.session.id

        }

        const aiReply =
            data.aiMessage?.messageText ||
            'No response from AI'

        const confidence =
            data.aiMessage?.confidenceScore || 0

        suggestedFaqs.value =
            data.contexts || []

        messages.value.push({
            sender: 'AI',
            text: aiReply
        })

        if (
            confidence <
            CONFIDENCE_THRESHOLD
        ) {

            showUnresolvedCard.value =
                true

        }

        if (selectedImage.value) {

            URL.revokeObjectURL(
                selectedImage.value
            )

        }

        selectedImage.value = null
        uploadedImageId.value = null

    } catch (error) {

        console.error(error)

        messages.value.push({
            sender: 'AI',
            text:
                'AI service unavailable. Please try again later.'
        })

    } finally {

        loading.value = false

    }
}

const handleSelectImage = async (file) => {

    if (!file) return

    if (
        file.size >
        3 * 1024 * 1024
    ) {

        alert(
            'Maximum image size is 3MB'
        )

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

        console.error(error)

        alert(
            'Failed to upload image'
        )

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

                <!-- UNRESOLVED ISSUE -->
                <UnresolvedIssueCard
                    v-if="showUnresolvedCard"
                    :faqs="suggestedFaqs"
                    @view-faq="
                        router.push('/faq')
                    "
                    @escalate="
                        showEscalateModal = true
                    "
                />


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
                @click="
                    URL.revokeObjectURL(selectedImage);
                    selectedImage = null;
                    uploadedImageId = null;
                "
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

    <!-- ESCALATE MODAL -->
    <EscalateModal
        v-if="showEscalateModal"
        @close="
            showEscalateModal = false
        "
        @submit="createTicket"
    />

    <!-- SUCCESS MODAL -->
    <TicketSuccessModal
        v-if="showSuccessModal"
        :ticket="createdTicket"
        @dashboard="
            router.push('/dashboard')
        "
        @tickets="
            router.push('/tickets')
        "
    />
</template>