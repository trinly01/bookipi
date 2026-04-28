import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { errorHandler } from './middleware/errorHandler';
import { rateLimiter } from './middleware/rateLimiter';
import saleRoutes from './controllers/saleController';
import { initializeRedis } from './config/redis';
import { FlashSaleService } from './services/flashSaleService';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Security middleware
app.use(helmet());
app.use(cors());
app.use(express.json());

// Rate limiting (more permissive for flash sale)
app.use(rateLimiter);

// Initialize Redis connection and FlashSaleService
app.use(async (req, res, next) => {
  try {
    if (!req.app.get('redis')) {
      const redisClient = await initializeRedis();
      req.app.set('redis', redisClient);

      // Initialize FlashSaleService after Redis is ready
      const flashSaleService = new FlashSaleService();
      await flashSaleService.initialize();
      req.app.set('flashSaleService', flashSaleService);
    }
    next();
  } catch (error) {
    next(error);
  }
});

// Routes
app.use('/api/sale', saleRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use(errorHandler);

// Start server only when not in test mode
if (process.env.NODE_ENV !== 'test' && require.main === module) {
  app.listen(PORT, () => {
    console.log(`Flash Sale API server running on port ${PORT}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

export default app;
