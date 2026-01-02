import api from './api';
import { User } from '../types';

// We'll use a local transform since UserService uses this file
const transformUserData = (userData: any): User => {
    return {
        id: userData.id,
        firstName: userData.first_name,
        lastName: userData.last_name,
        email: userData.email,
        isEmailVerified: userData.is_email_verified,
        isPhoneVerified: userData.is_phone_verified,
        role: userData.role,
        avatar: userData.avatar,
        rating: userData.rating,
        completedDeliveries: userData.completed_deliveries,
        earnings: userData.earnings,
        walletBalance: userData.wallet_balance ?? 0,
        currentPlanId: userData.current_plan_id,
        isSubscriptionActive: userData.is_subscription_active,
        itemsCountThisMonth: userData.items_count_this_month ?? 0,
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
        averageDeliveryTime: userData.average_delivery_time,
    } as User;
};

export const AuthService = {
    login: async (email: string, password: string): Promise<{ token: string; user: User }> => {
        const response = await api.post('/users/login', { email, password });
        if (response.data.token) {
            localStorage.setItem('token', response.data.token);
            // Transform snake_case to camelCase before storing
            const transformedUser = transformUserData(response.data.user);
            localStorage.setItem('user', JSON.stringify(transformedUser));
            return { token: response.data.token, user: transformedUser };
        }
        return response.data;
    },

    register: async (data: Partial<User> & { password: string; is_phone_verified?: boolean }): Promise<User> => {
        // Map camelCase to snake_case for backend
        const payload = {
            ...data,
            first_name: data.firstName,
            last_name: data.lastName,
            phone_number: data.phoneNumber,
        };
        const response = await api.post('/users/register', payload);
        return transformUserData(response.data);
    },

    logout: () => {
        localStorage.removeItem('token');
        localStorage.removeItem('user');
    },

    getCurrentUser: (): User | null => {
        const userStr = localStorage.getItem('user');
        if (userStr) {
            return JSON.parse(userStr);
        }
        return null;
    },

    isAuthenticated: (): boolean => {
        return !!localStorage.getItem('token');
    },

    forgotPassword: async (email: string) => {
        const response = await api.post('/users/forgot-password', { email });
        return response.data;
    },

    resetPassword: async (token: string, newPassword: string) => {
        const response = await api.post('/users/reset-password', { token, new_password: newPassword });
        return response.data;
    },

    verifyOTP: async (email: string, otp: string) => {
        const response = await api.post('/users/verify-otp', { email, otp });
        return response.data;
    },

    googleLogin: async (token: string, role?: string): Promise<{ token?: string; user?: User; needs_role?: boolean; email?: string }> => {
        const response = await api.post('/users/google-login', { token, role });
        if (response.data.token) {
            localStorage.setItem('token', response.data.token);
            const transformedUser = transformUserData(response.data.user);
            localStorage.setItem('user', JSON.stringify(transformedUser));
            return { token: response.data.token, user: transformedUser };
        }
        return response.data;
    }
};
