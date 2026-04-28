import request from 'supertest';
import app from '../src/index';
import { initializeRedis, closeRedis, getRedisClient } from '../src/config/redis';
import { v4 as uuidv4 } from 'uuid';

interface StressTestResult {
  totalRequests: number;
  successfulPurchases: number;
  failedPurchases: number;
  averageLatency: number;
  maxLatency: number;
  minLatency: number;
}

export class StressTest {
  private results: StressTestResult;

  constructor() {
    this.results = {
      totalRequests: 0,
      successfulPurchases: 0,
      failedPurchases: 0,
      averageLatency: 0,
      maxLatency: 0,
      minLatency: 0,
    };
  }

  async run(numUsers: number, totalStock: number): Promise<StressTestResult> {
    console.log(`\n=== Starting Stress Test ===`);
    console.log(`Total users: ${numUsers}`);
    console.log(`Available stock: ${totalStock}`);
    console.log(`Expected success rate: ${((totalStock / numUsers) * 100).toFixed(2)}%\n`);

    const startTime = Date.now();
    const redisClient = await initializeRedis();

    // Reset stock for test
    await redisClient.set('flashsale:stock:prod_001', totalStock.toString());

    const latencies: number[] = [];
    let successCount = 0;
    let failCount = 0;

    // Generate all unique users
    const users = Array.from({ length: numUsers }, (_, i) => `stress_user_${i}_${uuidv4().slice(0, 8)}`);

    // Create all purchase attempts
    const promises = users.map(async (userId, index) => {
      const requestStart = Date.now();
      try {
        const response = await request(app)
          .post('/api/sale/purchase')
          .send({ userId })
          .timeout(5000); // 5 second timeout

        const latency = Date.now() - requestStart;
        latencies.push(latency);

        if (response.body.success) {
          successCount++;
        } else {
          failCount++;
        }

        // Log progress for large tests
        if (index % 100 === 0 && index > 0) {
          console.log(`Processed ${index}/${numUsers} requests...`);
        }

        return response;
      } catch (error: any) {
        const latency = Date.now() - requestStart;
        latencies.push(latency);
        failCount++;
        if (index % 100 === 0) {
          console.log(`Error at user ${index}: ${error.message}`);
        }
        return null;
      }
    });

    // Wait for all requests to complete
    await Promise.all(promises);

    const totalTime = Date.now() - startTime;

    // Calculate statistics
    const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
    const maxLatency = Math.max(...latencies);
    const minLatency = Math.min(...latencies);

    this.results = {
      totalRequests: numUsers,
      successfulPurchases: successCount,
      failedPurchases: failCount,
      averageLatency: Math.round(avgLatency),
      maxLatency,
      minLatency,
    };

    // Verify final stock
    const finalStock = await redisClient.get('flashsale:stock:prod_001');
    const purchasedItems = totalStock - parseInt(finalStock || '0', 10);

    console.log(`\n=== Stress Test Results ===`);
    console.log(`Total requests sent: ${numUsers}`);
    console.log(`Successful purchases: ${successCount}`);
    console.log(`Failed attempts: ${failCount}`);
    console.log(`Items actually sold: ${purchasedItems}`);
    console.log(`Expected sold: ${totalStock}`);
    console.log(`Average latency: ${Math.round(avgLatency)}ms`);
    console.log(`Max latency: ${maxLatency}ms`);
    console.log(`Min latency: ${minLatency}ms`);
    console.log(`Total test duration: ${totalTime}ms`);

    // Validation
    console.log(`\n=== Validation ===`);
    const stockCorrect = purchasedItems === totalStock;
    console.log(`Stock integrity: ${stockCorrect ? '✓ PASSED' : '✗ FAILED'}`);
    console.log(`No overselling: ${successCount <= totalStock ? '✓ PASSED' : '✗ FAILED'}`);

    await closeRedis();

    return this.results;
  }

  async runConcurrencyTest(concurrency: number, totalUsers: number, stock: number): Promise<void> {
    console.log(`\n=== Concurrency Stress Test ===`);
    console.log(`Concurrency level: ${concurrency}`);
    console.log(`Total users: ${totalUsers}`);
    console.log(`Total stock: ${stock}`);

    const redisClient = await initializeRedis();
    await redisClient.set('flashsale:stock:prod_001', stock.toString());

    const batchSize = Math.ceil(totalUsers / concurrency);
    let successCount = 0;

    for (let i = 0; i < concurrency; i++) {
      const start = i * batchSize;
      const end = Math.min(start + batchSize, totalUsers);

      console.log(`Batch ${i + 1}/${concurrency}: Processing users ${start} to ${end - 1}`);

      const batchPromises = [];
      for (let j = start; j < end; j++) {
        batchPromises.push(
          request(app)
            .post('/api/sale/purchase')
            .send({ userId: `concurrent_batch${i}_user${j}` })
            .then(res => {
              if (res.body.success) successCount++;
              return res;
            })
            .catch(() => {})
        );
      }

      await Promise.all(batchPromises);
    }

    const finalStock = await redisClient.get('flashsale:stock:prod_001');
    const soldItems = stock - parseInt(finalStock || '0', 10);

    console.log(`\nBatch Test Results:`);
    console.log(`Successful purchases: ${successCount}`);
    console.log(`Items sold: ${soldItems}/${stock}`);
    console.log(`Stock integrity: ${soldItems === stock ? '✓ PASSED' : '✗ FAILED'}`);

    await closeRedis();
  }
}

// Run if executed directly
if (require.main === module) {
  const test = new StressTest();

  // Test 1: High load with limited stock
  test.run(1000, 10)
    .then(() => {
      console.log('\nTest 1 completed.\n');
      // Test 2: Extreme load with very limited stock
      return test.run(5000, 5);
    })
    .then(() => {
      console.log('\nTest 2 completed.\n');
      // Test 3: Concurrency test
      return test.runConcurrencyTest(50, 1000, 20);
    })
    .then(() => {
      console.log('\nAll stress tests completed.');
      process.exit(0);
    })
    .catch((error) => {
      console.error('Stress test failed:', error);
      process.exit(1);
    });
}
