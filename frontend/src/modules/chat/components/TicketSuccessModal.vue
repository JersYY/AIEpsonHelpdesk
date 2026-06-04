<script setup>

const props = defineProps({
    ticket: {
        type: Object,
        default: () => ({})
    }
})

const emit = defineEmits([
    'dashboard',
    'tickets'
])

const getTicketCode = () => {
    return props.ticket?.ticketCode || '-'
}

</script>

<template>

    <div class="modal-overlay">

        <div class="success-modal">

            <!-- ICON -->
            <div class="success-icon">

                <i class="fa-solid fa-check"></i>

            </div>

            <!-- TITLE -->
            <h2>
                Ticket Successfully Created
            </h2>

            <p class="success-description">
                Your issue has been escalated
                to the helpdesk team
            </p>

            <!-- INFO -->
            <div class="ticket-info">

                <div class="ticket-column">

                    <span class="label">
                        Ticket ID
                    </span>

                    <strong>
                        {{ getTicketCode() }}
                    </strong>

                    <span class="label">
                        Priority
                    </span>

                    <div
                        class="priority-badge"
                        :class="
                            (ticket?.priority || '')
                            .toLowerCase()
                        "
                    >
                        {{
                            ticket?.priority ||
                            '-'
                        }}
                    </div>

                </div>

                <div class="ticket-column">

                    <span class="label">
                        Status
                    </span>

                    <div class="status-badge">

                        {{
                            ticket?.status ||
                            'OPEN'
                        }}

                    </div>

                    <span class="label">
                        Created
                    </span>

                    <strong>

                        {{
                            ticket?.createdAt
                            ? new Date(
                                ticket.createdAt
                              ).toLocaleDateString()
                            : '-'
                        }}

                    </strong>

                </div>

            </div>

            <!-- ACTIONS -->
            <div class="success-actions">

                <button
                    class="dashboard-btn"
                    @click="
                        emit('dashboard')
                    "
                >
                    Return To Dashboard
                </button>

                <button
                    class="tickets-btn"
                    @click="
                        emit('tickets')
                    "
                >
                    View My Tickets
                </button>

            </div>

        </div>

    </div>

</template>
