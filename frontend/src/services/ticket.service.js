import api from "./api";

export const getMyTickets = () => {
    return api.get("/tickets/my");
};

export const escalateTicket = (payload) => {
    return api.post("/tickets/escalate", payload);
};

export default {
    getMyTickets,
    escalateTicket,
    createTicket: escalateTicket
};
