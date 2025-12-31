import api from './api';
import { User } from '../types';

// Helper function to transform snake_case API response to camelCase
export const transformUserData = (userData: any): User => {
    return {
        id: userData.id,
        name: userData.name,
        email: userData.email,
        role: userData.role,
        avatar: userData.avatar,
        rating: userData.rating,
        completedDeliveries: userData.completed_deliveries,
        earnings: userData.earnings,
        walletBalance: userData.wallet_balance ?? 0, // Default to 0 if undefined
        currentPlanId: userData.current_plan_id,
        itemsCountThisMonth: userData.items_count_this_month ?? 0, // Default to 0 if undefined
        verificationStatus: userData.verification_status,
        idType: userData.id_type,
        nationalId: userData.national_id,
        passportNumber: userData.passport_number,
        passportExpiry: userData.passport_expiry,
        issuanceCountry: userData.issuance_country,
        phoneNumber: userData.phone_number,
        homeAddress: userData.home_address,
        emergencyContact: userData.emergency_contact,
        emergencyContactPhone: userData.emergency_contact_phone,
        selfieUrl: userData.selfie_url,
        idFrontUrl: userData.id_front_url,
        idBackUrl: userData.id_back_url,
        livenessVideo: userData.liveness_video,
        createdAt: userData.created_at,
    } as User;
};


export const UserService = {
    getProfile: async (): Promise<User> => {
        const response = await api.get('/users/profile');
        return transformUserData(response.data);
    },

    updateUser: async (userId: string, data: Partial<User>): Promise<User> => {
        const response = await api.put(`/users/${userId}`, data);
        const transformedUser = transformUserData(response.data);
        // Update local storage if current user is updated
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        if (currentUser.id === userId) {
            localStorage.setItem('user', JSON.stringify(transformedUser));
        }
        return transformedUser;
    },

    getAllUsers: async (): Promise<User[]> => {
        const response = await api.get('/users/');
        return response.data.map(transformUserData);
    },

    getUserById: async (userId: string): Promise<User> => {
        const response = await api.get(`/users/${userId}`);
        return transformUserData(response.data);
    },

    submitVerification: async (userId: string, formData: FormData): Promise<User> => {
        const response = await api.post(`/users/${userId}/verify`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        const transformedUser = transformUserData(response.data);
        // Update local storage if current user is updated
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        if (currentUser.id === userId) {
            localStorage.setItem('user', JSON.stringify(transformedUser));
        }
        return transformedUser;
    },

    updateRegistration: async (userId: string, formData: FormData): Promise<User> => {
        const response = await api.put(`/users/${userId}/registration`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        const transformedUser = transformUserData(response.data);
        // Update local storage if current user is updated
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        if (currentUser.id === userId) {
            localStorage.setItem('user', JSON.stringify(transformedUser));
        }
        return transformedUser;
    },

    updateAvatar: async (userId: string, file: File): Promise<User> => {
        const formData = new FormData();
        formData.append('avatar', file);
        const response = await api.post(`/users/${userId}/avatar`, formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
            },
        });
        const transformedUser = transformUserData(response.data);
        // Update local storage if current user is updated
        const currentUser = JSON.parse(localStorage.getItem('user') || '{}');
        if (currentUser.id === userId) {
            localStorage.setItem('user', JSON.stringify(transformedUser));
        }
        return transformedUser;
    }
};
