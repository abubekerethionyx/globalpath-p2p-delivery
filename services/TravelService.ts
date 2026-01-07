import api from './api';
import { Travel, TravelPin } from '../types';
import { transformShipmentData } from './ShipmentService';

export const TravelService = {
    getAllTravels: async (params?: { page?: number, per_page?: number }): Promise<{ travels: Travel[], total: number, pages: number, current_page: number }> => {
        const response = await api.get('/travels/', { params });
        return response.data;
    },

    getTravel: async (id: string): Promise<Travel> => {
        const response = await api.get(`/travels/${id}`);
        return response.data;
    },

    createTravel: async (data: { origin_country: string, destination_country: string, travel_date: string, weight_capacity?: number, description?: string }): Promise<any> => {
        const response = await api.post('/travels/', data);
        return response.data;
    },

    deleteTravel: async (id: string): Promise<any> => {
        const response = await api.delete(`/travels/${id}`);
        return response.data;
    },

    updateTravelStatus: async (id: string, status: 'ACTIVE' | 'COMPLETED' | 'CANCELLED'): Promise<any> => {
        const response = await api.put(`/travels/${id}/status`, { status });
        return response.data;
    },

    pinItem: async (travelId: string, shipmentId: string): Promise<any> => {
        const response = await api.post(`/travels/${travelId}/pin`, { shipment_id: shipmentId });
        return response.data;
    },

    getTravelPins: async (travelId: string): Promise<TravelPin[]> => {
        const response = await api.get(`/travels/${travelId}/pins`);
        // The shipment inside TravelPin needs transformation
        return response.data.map((tp: any) => ({
            ...tp,
            shipment: transformShipmentData(tp.shipment)
        }));
    },

    getMyTravels: async (): Promise<Travel[]> => {
        const response = await api.get('/travels/my-travels');
        return response.data;
    },

    updatePinStatus: async (pinId: string, status: 'APPROVED' | 'REJECTED' | 'PENDING'): Promise<any> => {
        const response = await api.put(`/travels/pins/${pinId}/status`, { status });
        return response.data;
    },

    unpinItem: async (pinId: string): Promise<any> => {
        const response = await api.delete(`/travels/pins/${pinId}`);
        return response.data;
    }
};
