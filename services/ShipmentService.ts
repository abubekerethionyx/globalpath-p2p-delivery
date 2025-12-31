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

    createShipment: async (data: Partial<ShipmentItem>): Promise<ShipmentItem> => {
        const response = await api.post('/shipments/', data);
        return transformShipmentData(response.data);
    },

    updateStatus: async (id: string, status: ItemStatus): Promise<ShipmentItem> => {
        const response = await api.put(`/shipments/${id}/status`, { status });
        return transformShipmentData(response.data);
    },

    pickShipment: async (id: string): Promise<ShipmentItem> => {
        const response = await api.post(`/shipments/${id}/pick`, {});
        return transformShipmentData(response.data);
    }
};
