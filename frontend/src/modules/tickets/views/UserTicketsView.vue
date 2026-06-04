<script setup>
import { onMounted, ref } from "vue";

import IssueCard from "../components/IssueCard.vue";
import TicketDetailModal from "../components/TicketDetailModal.vue";

import { getMyTickets } from "../../../services/ticket.service";

import "../../../assets/styles/ticket.css";

const loading = ref(false);
const tickets = ref([]);
const selectedTicket = ref(null);

const loadTickets = async () => {
    try {
        loading.value = true;

        const response = await getMyTickets();

        tickets.value = response.data.data || [];
    } catch (error) {
        console.error("Failed to load tickets:", error);
    } finally {
        loading.value = false;
    }
};

const openTicket = (ticket) => {
    selectedTicket.value = ticket;
};

const closeTicket = () => {
    selectedTicket.value = null;
};

onMounted(() => {
    loadTickets();
});
</script>

<template>
    <div class="user-tickets-page">
        <div class="ticket-page-header">
            <button
                class="back-button"
                @click="$router.back()"
            >
                <i class="fa-solid fa-arrow-left"></i>
            </button>

            <div class="header-info">
                <img
                    src="/logo.png"
                    class="header-logo"
                />

                <div>
                    <h1>My Tickets</h1>

                    <p>
                        Track your escalated support tickets
                    </p>
                </div>
            </div>
        </div>

        <div
            v-if="loading"
            class="ticket-loading"
        >
            Loading tickets...
        </div>

        <div
            v-else-if="tickets.length === 0"
            class="empty-ticket-state"
        >
            <h3>
                No Tickets Found
            </h3>

            <p>
                You haven't escalated any issue yet.
            </p>

            <button
                class="start-chat-btn"
                @click="$router.push('/chat')"
            >
                Start Chat
            </button>
        </div>

        <div
            v-else
            class="ticket-list"
        >
            <IssueCard
                v-for="ticket in tickets"
                :key="ticket.id"
                :ticket="ticket"
                @click="openTicket(ticket)"
            />
        </div>

        <TicketDetailModal
            v-if="selectedTicket"
            :ticket="selectedTicket"
            @close="closeTicket"
        />
    </div>
</template>
