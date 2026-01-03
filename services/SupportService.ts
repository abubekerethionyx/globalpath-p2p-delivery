import api from './api';
import { SupportTicket, TicketReply, TicketStatus } from '../types';

export const SupportService = {
    async createTicket(subject: string, description: string, category: string = 'GENERAL', priority: string = 'MEDIUM'): Promise<SupportTicket> {
        const response = await api.post('/support/tickets', { subject, description, category, priority });
        return response.data;
    },

    async getTickets(params?: { page?: number; per_page?: number; status?: string; category?: string; search?: string }): Promise<{
        tickets: SupportTicket[];
        total: number;
        pages: number;
        current_page: number;
    }> {
        const response = await api.get('/support/tickets', { params });
        return response.data;
    },

    async getTicket(id: string): Promise<SupportTicket> {
        const response = await api.get(`/support/tickets/${id}`);
        return response.data;
    },

    async addReply(ticketId: string, message: string): Promise<TicketReply> {
        const response = await api.post(`/support/tickets/${ticketId}/reply`, { message });
        return response.data;
    },

    async updateStatus(ticketId: string, status: TicketStatus): Promise<SupportTicket> {
        const response = await api.put(`/support/tickets/${ticketId}/status`, { status });
        return response.data;
    }
};
