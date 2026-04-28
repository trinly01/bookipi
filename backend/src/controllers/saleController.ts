import { Router } from 'express';
import { Request, Response } from 'express';
import { FlashSaleService } from '../services/flashSaleService';

const router = Router();

export const getSaleStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const flashSaleService = req.app.get('flashSaleService') as FlashSaleService;
    const status = await flashSaleService.getSaleStatus();
    res.json(status);
  } catch (error) {
    console.error('Error getting sale status:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: 'Failed to retrieve sale status',
    });
  }
};

export const attemptPurchase = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.body;
    const flashSaleService = req.app.get('flashSaleService') as FlashSaleService;

    if (!userId || typeof userId !== 'string' || userId.trim().length === 0) {
      res.status(400).json({
        success: false,
        message: 'Valid user ID is required',
      });
      return;
    }

    const result = await flashSaleService.attemptPurchase(userId.trim());
    res.status(result.success ? 200 : 400).json(result);
  } catch (error) {
    console.error('Purchase error:', error);
    res.status(500).json({
      success: false,
      message: 'An unexpected error occurred',
    });
  }
};

export const checkUserPurchase = async (req: Request, res: Response): Promise<void> => {
  try {
    const { userId } = req.params;
    const flashSaleService = req.app.get('flashSaleService') as FlashSaleService;

    if (!userId || typeof userId !== 'string') {
      res.status(400).json({
        error: 'Valid user ID is required',
      });
      return;
    }

    const purchase = await flashSaleService.checkUserPurchase(userId);

    if (!purchase) {
      res.status(404).json({
        message: 'No purchase found for this user',
      });
      return;
    }

    res.json(purchase);
  } catch (error) {
    console.error('Error checking user purchase:', error);
    res.status(500).json({
      error: 'Internal server error',
    });
  }
};

export const getSaleInfo = async (req: Request, res: Response): Promise<void> => {
  try {
    const flashSaleService = req.app.get('flashSaleService') as FlashSaleService;
    const status = await flashSaleService.getSaleStatus();
    const { MAX_PURCHASE_PER_USER } = process.env;

    res.json({
      ...status,
      maxPurchasePerUser: parseInt(MAX_PURCHASE_PER_USER || '1', 10),
      rules: [
        'Each user can purchase only one item',
        'Purchase is only allowed during the sale period',
        'First come, first served',
      ],
    });
  } catch (error) {
    console.error('Error getting sale info:', error);
    res.status(500).json({
      error: 'Failed to retrieve sale information',
    });
  }
};

// Define routes
router.get('/status', getSaleStatus);
router.get('/info', getSaleInfo);
router.post('/purchase', attemptPurchase);
router.get('/purchase/:userId', checkUserPurchase);

export default router;
