import { getAllReviews } from "../models/reviewsModel.js";
import { createReview } from "../models/reviewsModel.js";

export const getReviews = async (req, res) => {
    try {
        const reviews = await getAllReviews();
        res.json(reviews);

    } catch (error) {
        console.error("Error fetching reviews:", error);
        res.status(500).json({message: "Server error fetching reviews"});
    }

};

export const addReview = async(req, res) => {
    try {
        const result = await createReview(req.body) ;
        res.status(201).json({message: "Review added succesfully", id: result.insertId});
    
    } catch (error) {
        console.error("Error adding review:", error);
        res.status(500).json({message: "Server error adding review"});
    }
};
