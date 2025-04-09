import express from 'express';
import {
    getProfile,
    updateUsername,
    updatePassword,
    deleteAccount
} from '../controllers/userController.js';

const router = express.Router();

// Protected routes
router.post('/profile', getProfile); // Changed from GET to POST
router.put('/update-username', updateUsername);
router.put('/update-password', updatePassword);
router.delete('/delete-account', deleteAccount);

export default router;
