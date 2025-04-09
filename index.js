// index.js

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Route imports
import authRouter from './routes/authRoutes.js';
import portfolioRouter from './routes/portfolioRoutes.js';
import watchlistRouter from './routes/watchlistRoutes.js';
import userRoutes from './routes/userRoutes.js';

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/auth', authRouter);
app.use('/portfolio', portfolioRouter);
app.use('/watchlist', watchlistRouter);
app.use('/user', userRoutes);

app.get('/', (req, res) => {
  res.send('✅ Backend running on Railway!');
});


// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
});
