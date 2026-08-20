import express from 'express';
import { getAllReviews } from '../models/reviewsModel.js';
import { addReview, getReviews } from '../controllers/reviewsController.js';

const router = express.Router();

router.get('/', getReviews);
router.post('/', addReview);

export default router;
