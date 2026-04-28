import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface SaleStatus {
  status: 'upcoming' | 'active' | 'ended' | 'sold_out';
  startTime: string;
  endTime: string;
  totalStock: number;
  remainingStock: number;
  productId: string;
}

export interface SaleInfo extends SaleStatus {
  maxPurchasePerUser: number;
  rules: string[];
}

export interface PurchaseResponse {
  success: boolean;
  message: string;
  orderId?: string;
  purchasedAt?: string;
}

export interface OrderDetail {
  orderId: string;
  userId: string;
  productId: string;
  status: string;
  createdAt: string;
}

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
});

export const saleAPI = {
  getStatus(): Promise<{ data: SaleStatus }> {
    return api.get('/api/sale/status');
  },

  getInfo(): Promise<{ data: SaleInfo }> {
    return api.get('/api/sale/info');
  },

  async purchase(userId: string): Promise<{ data: PurchaseResponse }> {
    return api.post('/api/sale/purchase', { userId });
  },

  async checkPurchase(userId: string): Promise<{ data: OrderDetail }> {
    return api.get(`/api/sale/purchase/${userId}`);
  },
};
