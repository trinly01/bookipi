import request from 'supertest';
import app from '../src/index';
import { getRedisClient, closeRedis, initializeRedis, RedisClientType } from '../src/config/redis';

describe('Flash Sale API Integration Tests', () => {
  let redisClient: RedisClientType;

  beforeAll(async () => {
    // Initialize Redis connection
    redisClient = await initializeRedis();
    // Clear any existing test data
    await redisClient.flushDb();
  });

  afterAll(async () => {
    await closeRedis();
  });

  beforeEach(async () => {
    // Clear database before each test
    await redisClient.flushDb();
    // Reinitialize stock for product
    await redisClient.set('flashsale:stock:prod_001', '3');
  });

  describe('GET /api/sale/status', () => {
    it('should return sale status', async () => {
      const response = await request(app).get('/api/sale/status');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('remainingStock');
      expect(response.body).toHaveProperty('totalStock');
    });
  });

  describe('GET /api/sale/info', () => {
    it('should return sale info', async () => {
      const response = await request(app).get('/api/sale/info');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('status');
      expect(response.body).toHaveProperty('rules');
      expect(Array.isArray(response.body.rules)).toBe(true);
    });
  });

  describe('POST /api/sale/purchase', () => {
    it('should reject missing user ID', async () => {
      const response = await request(app)
        .post('/api/sale/purchase')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
    });

    it('should allow successful purchase when stock is available', async () => {
      const response = await request(app)
        .post('/api/sale/purchase')
        .send({ userId: 'user1' });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body).toHaveProperty('orderId');
    });

    it('should prevent same user from purchasing twice', async () => {
      // First purchase
      await request(app)
        .post('/api/sale/purchase')
        .send({ userId: 'user1' });

      // Second purchase attempt
      const response = await request(app)
        .post('/api/sale/purchase')
        .send({ userId: 'user1' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already purchased');
    });

    it('should decrement stock correctly on each purchase', async () => {
      // Purchase 1
      await request(app)
        .post('/api/sale/purchase')
        .send({ userId: 'user1' });

      // Purchase 2
      await request(app)
        .post('/api/sale/purchase')
        .send({ userId: 'user2' });

      // Purchase 3
      await request(app)
        .post('/api/sale/purchase')
        .send({ userId: 'user3' });

      // Stock should be 0 now
      const statusResponse = await request(app).get('/api/sale/status');
      expect(statusResponse.body.remainingStock).toBe(0);
    });

    it('should reject purchase when stock is depleted', async () => {
      // Buy all 3 items
      await request(app)
        .post('/api/sale/purchase')
        .send({ userId: 'user1' });
      await request(app)
        .post('/api/sale/purchase')
        .send({ userId: 'user2' });
      await request(app)
        .post('/api/sale/purchase')
        .send({ userId: 'user3' });

      // Fourth attempt
      const response = await request(app)
        .post('/api/sale/purchase')
        .send({ userId: 'user4' });

      expect(response.status).toBe(400);
      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('sold out');
    });

    it('should handle concurrent purchases correctly', async () => {
      const promises = Array.from({ length: 10 }, (_, i) =>
        request(app)
          .post('/api/sale/purchase')
          .send({ userId: `concurrent_user_${i}` })
      );

      const results = await Promise.all(promises);

      // Should have exactly 3 successes (stock = 3)
      const successful = results.filter(r => r.body.success).length;
      expect(successful).toBe(3);

      // Check remaining stock
      const statusResponse = await request(app).get('/api/sale/status');
      expect(statusResponse.body.remainingStock).toBe(0);
    });
  });

  describe('GET /api/sale/purchase/:userId', () => {
    it('should return 404 when user has not purchased', async () => {
      const response = await request(app).get('/api/sale/purchase/nonexistent');

      expect(response.status).toBe(404);
    });

    it('should return purchase details when user has purchased', async () => {
      // Make a purchase
      const purchaseResponse = await request(app)
        .post('/api/sale/purchase')
        .send({ userId: 'user1' });

      const orderId = purchaseResponse.body.orderId;

      // Check purchase
      const checkResponse = await request(app).get('/api/sale/purchase/user1');

      expect(checkResponse.status).toBe(200);
      expect(checkResponse.body.orderId).toBe(orderId);
      expect(checkResponse.body.userId).toBe('user1');
      expect(checkResponse.body.status).toBe('completed');
    });
  });
});
