import express from 'express';
import { addAsset } from '../controllers/watchlistController.js';
import { getAsset } from '../controllers/watchlistController.js';
import { deleteAsset } from '../controllers/watchlistController.js';

const router = express.Router();

router.post('/add', addAsset);
router.post('/get', getAsset);
router.post('/delete', deleteAsset);

export default router;
