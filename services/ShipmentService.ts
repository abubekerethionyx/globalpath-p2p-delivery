import api from './api';
import { ShipmentItem, ItemStatus } from '../types';
import { transformUserData } from './UserService';

// Transform snake_case to camelCase
const transformShipmentData = (data: any): ShipmentItem => {
    return {
        id: data.id,
        senderId: data.sender_id,
        partnerId: data.partner_id,
        category: data.category,
        description: data.description,
        pickupCountry: data.pickup_country,
        destCountry: data.dest_country,
        address: data.address,
        receiverName: data.receiver_name,
        receiverPhone: data.receiver_phone,
        weight: data.weight,
        fee: data.fee,
        notes: data.notes,
        status: data.status,
        createdAt: data.created_at,
        imageUrls: data.image_urls,
        pickedAt: data.picked_at,
        availablePickupTime: data.available_pickup_time,
        // Transform nested user objects
        sender: data.sender ? transformUserData(data.sender) : undefined,
        partner: data.partner ? transformUserData(data.partner) : undefined
    } as ShipmentItem;
};


export const ShipmentService = {
    getAllShipments: async (): Promise<ShipmentItem[]> => {
        const response = await api.get('/shipments/');
        return response.data.map(transformShipmentData);
    },

    getShipment: async (id: string): Promise<ShipmentItem> => {
        const response = await api.get(`/shipments/${id}`);
        return transformShipmentData(response.data);
    },

    createShipment: async (data: FormData | Partial<ShipmentItem>): Promise<ShipmentItem> => {
        const response = await api.post('/shipments/', data, {
            headers: data instanceof FormData ? {
                'Content-Type': 'multipart/form-data'
            } : undefined
        });
        return transformShipmentData(response.data);
    },

    updateShipment: async (id: string, data: FormData | Partial<ShipmentItem>): Promise<ShipmentItem> => {
        const response = await api.put(`/shipments/${id}`, data, {
            headers: data instanceof FormData ? {
                'Content-Type': 'multipart/form-data'
            } : undefined
        });
        return transformShipmentData(response.data);
    },

    updateStatus: async (id: string, status: ItemStatus): Promise<ShipmentItem> => {
        const response = await api.put(`/shipments/${id}/status`, { status });
        return transformShipmentData(response.data);
    },

    pickShipment: async (id: string): Promise<any> => {
        const response = await api.post(`/shipments/${id}/pick`, {});
        return response.data;
    },

    getRequests: async (id: string): Promise<any[]> => {
        const response = await api.get(`/shipments/${id}/requests`);
        return response.data;
    },

    approveRequest: async (requestId: string): Promise<ShipmentItem> => {
        const response = await api.post(`/shipments/request/${requestId}/approve`, {});
        return transformShipmentData(response.data);
    },

    rejectRequest: async (requestId: string): Promise<any> => {
        const response = await api.post(`/shipments/request/${requestId}/reject`, {});
        return response.data;
    },

    getMyRequests: async (): Promise<any[]> => {
        const response = await api.get('/shipments/my-requests');
        return response.data.map((r: any) => ({
            ...r,
            shipment: transformShipmentData(r.shipment)
        }));
    },

    getSupportedCountries: async (): Promise<string[]> => {
        const response = await api.get('/shipments/countries');
        return response.data;
    }
};
