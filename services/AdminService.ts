import api from './api';

export interface AdminSetting {
    value: string | boolean;
    description: string;
}

export interface AdminSettings {
    [key: string]: AdminSetting;
}

export interface PublicSettings {
    require_subscription_for_details: boolean;
    require_subscription_for_chat: boolean;
    require_otp_for_signup: boolean;
    enable_free_promo_sender: boolean;
    enable_free_promo_picker: boolean;
    enable_google_login: boolean;
}

export const AdminService = {
    getSettings: async (): Promise<AdminSettings> => {
        const response = await api.get('/admin/settings');
        return response.data;
    },

    updateSettings: async (settings: AdminSettings): Promise<void> => {
        await api.post('/admin/settings', settings);
    },

    getPublicSettings: async (): Promise<PublicSettings> => {
        const response = await api.get('/admin/settings/public');
        return response.data;
    },

    getUsers: async (): Promise<any[]> => {
        const response = await api.get('/admin/users');
        return response.data;
    },

    broadcastNotification: async (data: {
        title: string;
        message: string;
        type: string;
        target_type: 'ALL' | 'ROLE' | 'USERS' | 'LOCATION_HISTORY';
        roles?: string[];
        user_ids?: string[];
        location?: string;
    }): Promise<void> => {
        await api.post('/admin/notifications/broadcast', data);
    }
};
