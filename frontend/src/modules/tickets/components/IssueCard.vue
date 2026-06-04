<script setup>
import EscalationStatus from "./EscalationStatus.vue";

const props = defineProps({
    ticket: {
        type: Object,
        required: true
    }
});

const getTicketTitle = () => {
    return props.ticket.title
        || props.ticket.session?.title
        || 'Support Ticket';
};

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

const formatDate = (date) => {
    if (!date) return '-';

    return new Date(date).toLocaleDateString();
};
</script>

<template>
    <div class="ticket-card">
        <div class="ticket-card-top">
            <div class="ticket-card-badges">
                <span class="ticket-number">
                    {{ getTicketCode() }}
                </span>

                <EscalationStatus
                    :value="ticket.status"
                />

                <EscalationStatus
                    :value="ticket.priority"
                    type="priority"
                />
            </div>

            <span class="ticket-category">
                {{ getCategoryName() }}
            </span>
        </div>

        <h3 class="ticket-title">
            {{ getTicketTitle() }}
        </h3>

        <p class="ticket-summary">
            {{ ticket.summary || '-' }}
        </p>

        <div class="ticket-footer">
            <div class="ticket-meta">
                <span>
                    Created: {{ formatDate(ticket.createdAt) }}
                </span>

                <span>
                    Updated: {{ formatDate(ticket.updatedAt) }}
                </span>

                <span>
                    Assigned: {{ getAssignedName() }}
                </span>
            </div>
        </div>
    </div>
</template>
