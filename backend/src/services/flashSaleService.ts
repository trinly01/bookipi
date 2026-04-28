import { getRedisClient } from '../config/redis';
import {
  FlashSaleStatus,
  PurchaseResponse,
  UserPurchase,
} from '../models/types';
import { v4 as uuidv4 } from 'uuid';
import { getConfig } from '../config/env';

export class FlashSaleService {
  private config: ReturnType<typeof getConfig>;
  private initialized: boolean = false;

  constructor() {
    this.config = getConfig();
  }

  public async initialize(): Promise<void> {
    if (!this.initialized) {
      await this.initializeSaleKeys();
      this.initialized = true;
    }
  }

  private getStockKey(): string {
    return `flashsale:stock:${this.config.flashSale.productId}`;
  }

  private getUserPurchaseKey(userId: string): string {
    return `flashsale:purchase:${userId}`;
  }

  private async initializeSaleKeys(): Promise<void> {
    const redis = getRedisClient();
    const stockKey = this.getStockKey();

    // Initialize stock only if not exists
    const isInitialized = await redis.setNX(stockKey, this.config.flashSale.initialStock.toString());

    if (isInitialized) {
      console.log(`Initialized stock for ${this.config.flashSale.productId}: ${this.config.flashSale.initialStock}`);
    }

    // Set expiry to end time of sale
    const ttlSeconds = Math.max(1, Math.ceil((this.config.flashSale.endTime.getTime() - Date.now()) / 1000));
    await redis.expire(stockKey, ttlSeconds);
  }

  public async getSaleStatus(): Promise<FlashSaleStatus> {
    const now = new Date();
    const { startTime, endTime, initialStock, productId } = this.config.flashSale;

    let status: FlashSaleStatus['status'];
    if (now < startTime) {
      status = 'upcoming';
    } else if (now >= endTime) {
      status = 'ended';
    } else {
      status = 'active';
    }

    // Get remaining stock from Redis
    const stockKey = this.getStockKey();
    const redis = getRedisClient();
    const stockValue = await redis.get(stockKey);
    const remainingStock = stockValue ? parseInt(stockValue, 10) : initialStock;

    // Override to sold_out if stock is 0 and sale is active
    if (status === 'active' && remainingStock <= 0) {
      status = 'sold_out';
    }

    return {
      status,
      startTime: startTime.toISOString(),
      endTime: endTime.toISOString(),
      totalStock: initialStock,
      remainingStock,
      productId,
    };
  }

  public async attemptPurchase(userId: string): Promise<PurchaseResponse> {
    const now = new Date();
    const { startTime, endTime, productId, initialStock } = this.config.flashSale;
    const redis = getRedisClient();

    // 1. Check if sale is active
    if (now < startTime) {
      return { success: false, message: 'Sale has not started yet' };
    }

    if (now >= endTime) {
      return { success: false, message: 'Sale has ended' };
    }

    // 2. Check if user already purchased
    const userPurchaseKey = this.getUserPurchaseKey(userId);
    const hasPurchased = await redis.exists(userPurchaseKey);

    if (hasPurchased) {
      return { success: false, message: 'You have already purchased this item' };
    }

    // 3. Atomically decrement stock and set purchase flag using Lua script
    const luaScript = `
      local stockKey = KEYS[1]
      local userKey = KEYS[2]

      local stock = redis.call('GET', stockKey)
      if not stock then
        return -2 -- Stock not initialized
      end

      stock = tonumber(stock)
      if stock <= 0 then
        return -1 -- Out of stock
      end

      -- Decrement stock atomically
      redis.call('DECR', stockKey)
      -- Set user purchase flag
      redis.call('SET', userKey, '1')
      return stock - 1
    `;

    const endTimeMs = this.config.flashSale.endTime.getTime();
    const remainingSeconds = Math.max(1, Math.ceil((endTimeMs - Date.now()) / 1000));

    try {
      const result = await redis.eval(luaScript, {
        keys: [this.getStockKey(), userPurchaseKey],
      }) as number;

      if (result === -2) {
        return { success: false, message: 'System error: Sale not initialized' };
      }

      if (result === -1) {
        return { success: false, message: 'Sorry, the item is sold out' };
      }

      // Successfully purchased
      const orderId = uuidv4();
      const createdAt = new Date().toISOString();

      // Store purchase details as hash - use non-null values
      const purchaseHashKey = `flashsale:order:${orderId}`;
      await redis.hSet(purchaseHashKey, {
        orderId: orderId,
        userId: userId,
        productId: productId!,
        status: 'completed',
        createdAt: createdAt,
      });

      // Set TTLs
      await redis.expire(purchaseHashKey, remainingSeconds);
      await redis.expire(userPurchaseKey, remainingSeconds);

      console.log(`Purchase successful: User ${userId}, Order ${orderId}, Remaining stock: ${result}`);

      return {
        success: true,
        message: 'Purchase successful!',
        orderId,
        purchasedAt: createdAt,
      };
    } catch (error) {
      console.error('Purchase error:', error);
      return {
        success: false,
        message: 'An error occurred during purchase. Please try again.',
      };
    }
  }

  public async checkUserPurchase(userId: string): Promise<UserPurchase | null> {
    const redis = getRedisClient();
    const userPurchaseKey = this.getUserPurchaseKey(userId);
    const hasPurchase = await redis.exists(userPurchaseKey);

    if (!hasPurchase) {
      return null;
    }

    // Find the order by scanning keys
    const orderKeys = await redis.keys('flashsale:order:*');

    for (const key of orderKeys) {
      const storedUserId = await redis.hGet(key, 'userId');
      if (storedUserId === userId) {
        const purchaseData = await redis.hGetAll(key);
        return {
          orderId: purchaseData.orderId || '',
          userId: purchaseData.userId || '',
          productId: purchaseData.productId || '',
          status: (purchaseData.status as 'completed' | 'pending' | 'failed') || 'completed',
          createdAt: purchaseData.createdAt || '',
        };
      }
    }

    return null;
  }
}

