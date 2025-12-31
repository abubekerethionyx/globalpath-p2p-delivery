import api from './api';
import { Message, MessageThread } from '../types';

export const MessageService = {
    getUserThreads: async (): Promise<MessageThread[]> => {
        const response = await api.get('/messages/threads');
        return response.data;
    },

    createThread: async (participantId: string, shipmentId?: string): Promise<MessageThread> => {
        const response = await api.post('/messages/threads', { participant_id: participantId, shipment_id: shipmentId });
        return response.data;
    },

    getThreadMessages: async (threadId: string): Promise<Message[]> => {
        const response = await api.get(`/messages/threads/${threadId}/messages`);
        return response.data;
    },

    sendMessage: async (threadId: string, text: string): Promise<Message> => {
        const response = await api.post('/messages/', { thread_id: threadId, text });
        return response.data;
    }
};
