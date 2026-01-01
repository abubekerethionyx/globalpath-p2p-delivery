import api from './api';

export interface Notification {
    id: string;
    title: string;
    message: string;
    type: 'INFO' | 'SUCCESS' | 'WARNING' | 'MESSAGE';
    link?: string;
    is_read: boolean;
    created_at: string;
}

export const NotificationService = {
    async getNotifications(): Promise<Notification[]> {
        const response = await api.get('/notifications');
        return response.data;
    },

    async getUnreadCount(): Promise<number> {
        const response = await api.get('/notifications/unread-count');
        return response.data.count;
    },

    async markAsRead(id: string): Promise<Notification> {
        const response = await api.put(`/notifications/${id}/read`);
        return response.data;
    },

    async markAllAsRead(): Promise<void> {
        await api.put('/notifications/read-all');
    }
};
