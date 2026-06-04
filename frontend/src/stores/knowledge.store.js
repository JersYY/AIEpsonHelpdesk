import { defineStore } from "pinia";
import { KnowledgeService } from "../services/knowledge.service";

export const useKnowledgeStore = defineStore("knowledge", {

    state: () => ({
        faqs: [],
        loading: false,
    }),

    actions: {

        async fetchFaqs() {

        try {

            this.loading = true;

            const data =
            await KnowledgeService.getAll();

            this.faqs = data;

        } finally {

            this.loading = false;

        }

        }

    }

});