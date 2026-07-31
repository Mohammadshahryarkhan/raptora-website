const express = require("express");

const router = express.Router();

const Kcet = require("../models/kcet");


router.post("/predict", async (req, res) => {

    try {

        const {
            rank,
            category,
            region
        } = req.body;


        const result = await Kcet.find({
            category: category,
            region: region,
            cutoffRank: { $gte: rank }
        });


        res.status(200).json({
            success: true,
            data: result
        });


    } catch (error) {

        console.error(error);

        res.status(500).json({
            success: false,
            message: "Prediction failed",
            error: error.message
        });

    }

});


module.exports = router;
