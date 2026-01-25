import express from 'express';
import { getFavorites, getUserBookings, UpdateFavorite } from '../controllers/userController.js';

const userRouter = express.Router();

userRouter.get('/bookings', getUserBookings)
userRouter.post('/update-favorite', UpdateFavorite)
userRouter.get('/favorites', getFavorites)

export default userRouter;