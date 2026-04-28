export interface FlashSaleStatus {
  status: 'upcoming' | 'active' | 'ended' | 'sold_out';
  startTime: string;
  endTime: string;
  totalStock: number;
  remainingStock: number;
  productId: string;
}

export interface PurchaseRequest {
  userId: string;
}

export interface PurchaseResponse {
  success: boolean;
  message: string;
  orderId?: string;
  purchasedAt?: string;
}

export interface UserPurchase {
  orderId: string;
  userId: string;
  productId: string;
  status: 'completed' | 'pending' | 'failed';
  createdAt: string;
}

export interface SaleConfig {
  productId: string;
  initialStock: number;
  startTime: Date;
  endTime: Date;
  maxPurchasePerUser: number;
}
