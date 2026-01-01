import api from './api';
import { Message, MessageThread } from '../types';
import { transformUserData } from './UserService';

export const MessageService = {
    getUserThreads: async (): Promise<MessageThread[]> => {
        const response = await api.get('/messages/threads');
        return response.data.map((thread: any) => ({
            ...thread,
            participant1: thread.participant1 ? transformUserData(thread.participant1) : null,
            participant2: thread.participant2 ? transformUserData(thread.participant2) : null
        }));
    },

    createThread: async (participantId: string, shipmentId?: string): Promise<MessageThread> => {
        const response = await api.post('/messages/threads', { participant_id: participantId, shipment_id: shipmentId });
        const thread = response.data;
        return {
            ...thread,
            participant1: thread.participant1 ? transformUserData(thread.participant1) : null,
            participant2: thread.participant2 ? transformUserData(thread.participant2) : null
        };
    },

    getThreadMessages: async (threadId: string): Promise<Message[]> => {
        const response = await api.get(`/messages/threads/${threadId}/messages`);
        return response.data.map((msg: any) => ({
            ...msg,
            sender: msg.sender ? transformUserData(msg.sender) : null,
            receiver: msg.receiver ? transformUserData(msg.receiver) : null
        }));
    },

    sendMessage: async (threadId: string, text: string): Promise<Message> => {
        const response = await api.post('/messages/', { thread_id: threadId, text });
        const msg = response.data;
        return {
            ...msg,
            sender: msg.sender ? transformUserData(msg.sender) : null,
            receiver: msg.receiver ? transformUserData(msg.receiver) : null
        };
    }
};
