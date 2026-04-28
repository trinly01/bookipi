import { initializeRedis, closeRedis } from './src/config/redis';
import { FlashSaleService } from './src/services/flashSaleService';
import { getConfig } from './src/config/env';

async function debugTest() {
  try {
    console.log('Initializing Redis...');
    const redis = await initializeRedis();
    await redis.flushDb(); // Clean slate

    console.log('Creating FlashSaleService...');
    const service = new FlashSaleService();
    await service.initialize();

    console.log('Config:', getConfig().flashSale);
    console.log('Current time:', new Date().toISOString());

    console.log('\nAttempting purchase...');
    const result = await service.attemptPurchase('debug_user_123');

    console.log('Result:', JSON.stringify(result, null, 2));

    // Check user purchase
    const purchase = await service.checkUserPurchase('debug_user_123');
    console.log('User purchase record:', purchase);

    await closeRedis();
  } catch (error) {
    console.error('ERROR:', error);
    process.exit(1);
  }
}

debugTest();
