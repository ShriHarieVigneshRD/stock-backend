// portfolioRoutes.js
import express from 'express';
import { buyAsset, sellAsset, getTransactionHistory, getStocks } from '../controllers/portfolioController.js';

const router = express.Router();

router.post('/buy', buyAsset);
router.post('/sell', sellAsset);
router.post('/getstocks', getStocks);
router.post('/transactions', getTransactionHistory);

export default router;
