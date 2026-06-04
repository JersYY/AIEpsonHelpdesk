<script setup>
import { ref } from 'vue'

const emit = defineEmits([
    'close',
    'submit'
])

const selectedPriority =
    ref('MEDIUM')

const submitTicket = () => {

    emit(
        'submit',
        selectedPriority.value
    )

}
</script>

<template>

    <div class="modal-overlay">

        <div class="escalate-modal">

            <!-- HEADER -->
            <div class="modal-header">

                <h2>
                    Escalate To Helpdesk
                </h2>

                <button
                    class="close-button"
                    @click="
                        emit('close')
                    "
                >
                    <i class="fa-solid fa-xmark"></i>
                </button>

            </div>

            <!-- DESCRIPTION -->
            <p class="modal-description">

                The AI assistant could not fully
                resolve your issue.

                A support ticket will be
                automatically created and
                forwarded to the Helpdesk team.

            </p>

            <!-- CHAT SUMMARY -->
            <div class="summary-box">

                <h4>
                    Chat History Included
                </h4>

                <p>
                    Your conversation will be
                    included in the ticket for
                    context.
                </p>

            </div>

            <!-- PRIORITY -->
            <div class="priority-section">

                <label>
                    Select Priority
                </label>

                <div class="priority-buttons">

                    <button
                        class="priority-btn"
                        :class="{
                            active:
                            selectedPriority === 'LOW'
                        }"
                        @click="
                            selectedPriority = 'LOW'
                        "
                    >
                        LOW
                    </button>

                    <button
                        class="priority-btn"
                        :class="{
                            active:
                            selectedPriority === 'MEDIUM'
                        }"
                        @click="
                            selectedPriority = 'MEDIUM'
                        "
                    >
                        MEDIUM
                    </button>

                    <button
                        class="priority-btn"
                        :class="{
                            active:
                            selectedPriority === 'HIGH'
                        }"
                        @click="
                            selectedPriority = 'HIGH'
                        "
                    >
                        HIGH
                    </button>

                </div>

            </div>

            <!-- ACTIONS -->
            <div class="modal-actions">

                <button
                    class="cancel-btn"
                    @click="
                        emit('close')
                    "
                >
                    Cancel
                </button>

                <button
                    class="create-btn"
                    @click="submitTicket"
                >
                    Create Ticket
                </button>

            </div>

        </div>

    </div>

</template>