<script setup>
const props = defineProps({
    ticket: {
        type: Object,
        required: true
    }
});

const emit = defineEmits([
    'close'
]);

const getCategoryName = () => {
    return props.ticket.category?.name
        || 'AI Chat Escalation';
};

const getAssignedName = () => {
    const assigned =
        props.ticket.assignedHelpdesk
        || props.ticket.assignedTo
        || props.ticket.assignee
        || props.ticket.helpdesk;

    if (!assigned) return 'Unassigned';
    if (typeof assigned === 'string') return assigned;

    return assigned.name
        || assigned.email
        || 'Unassigned';
};

const getTicketCode = () => {
    return props.ticket.ticketCode || '-';
};

const formatDateTime = (date) => {
    if (!date) return '-';

    return new Date(date).toLocaleString();
};
</script>

<template>
    <div
        class="ticket-modal-overlay"
        @click.self="emit('close')"
    >
        <div class="ticket-detail-modal">
            <div class="ticket-modal-header">
                <div>
                    <span class="label">
                        Ticket ID
                    </span>

                    <h2>
                        {{ getTicketCode() }}
                    </h2>
                </div>

                <button
                    class="close-btn"
                    @click="emit('close')"
                >
                    <i class="fa-solid fa-xmark"></i>
                </button>
            </div>

            <div class="ticket-badges">
                <span
                    class="status-badge"
                    :class="ticket.status?.toLowerCase()"
                >
                    {{ ticket.status || '-' }}
                </span>

                <span
                    class="priority-badge"
                    :class="ticket.priority?.toLowerCase()"
                >
                    {{ ticket.priority || '-' }}
                </span>

                <span class="category-badge">
                    {{ getCategoryName() }}
                </span>
            </div>

            <p class="ticket-description">
                {{ ticket.summary || '-' }}
            </p>

            <div class="ticket-info-grid">
                <div>
                    <span class="label">
                        Assigned To
                    </span>

                    <strong>
                        {{ getAssignedName() }}
                    </strong>
                </div>

                <div>
                    <span class="label">
                        Category
                    </span>

                    <strong>
                        {{ getCategoryName() }}
                    </strong>
                </div>

                <div>
                    <span class="label">
                        Created At
                    </span>

                    <strong>
                        {{ formatDateTime(ticket.createdAt) }}
                    </strong>
                </div>

                <div>
                    <span class="label">
                        Updated At
                    </span>

                    <strong>
                        {{ formatDateTime(ticket.updatedAt) }}
                    </strong>
                </div>
            </div>

            <div class="ticket-note">
                Only helpdesk staff and admins can change ticket status.
            </div>
        </div>
    </div>
</template>
