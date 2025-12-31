import api from './api';
import { SubscriptionPlan, SubscriptionTransaction } from '../types';

export const SubscriptionService = {
    getPlans: async (): Promise<SubscriptionPlan[]> => {
        const response = await api.get('/subscriptions/plans');
        return response.data;
    },

    createPlan: async (data: Partial<SubscriptionPlan>): Promise<SubscriptionPlan> => {
        const response = await api.post('/subscriptions/plans', data);
        return response.data;
    },

    updatePlan: async (planId: string, data: Partial<SubscriptionPlan>): Promise<SubscriptionPlan> => {
        const response = await api.put(`/subscriptions/plans/${planId}`, data);
        return response.data;
    },

    deletePlan: async (planId: string): Promise<void> => {
        await api.delete(`/subscriptions/plans/${planId}`);
    },

    getUserTransactions: async (userId: string): Promise<SubscriptionTransaction[]> => {
        const response = await api.get(`/subscriptions/transactions/${userId}`);
        return response.data;
    },

    getAllTransactions: async (): Promise<SubscriptionTransaction[]> => {
        const response = await api.get('/subscriptions/transactions');
        return response.data;
    },

    updateTransactionStatus: async (transactionId: string, status: string): Promise<SubscriptionTransaction> => {
        const response = await api.patch(`/subscriptions/transactions/${transactionId}`, { status });
        return response.data;
    },

    createTransaction: async (data: Partial<SubscriptionTransaction>): Promise<SubscriptionTransaction> => {
        const response = await api.post('/subscriptions/transactions', data);
        return response.data;
    }
};
