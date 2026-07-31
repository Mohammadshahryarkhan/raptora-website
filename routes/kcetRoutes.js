const express = require("express");

const router = express.Router();

const Kcet = require("../models/kcet");


// KCET Rank Predictor
router.post("/predict", async (req, res) => {

    try {

        const {
            rank,
            category,
            region
        } = req.body;


        if (!rank || !category || !region) {

            return res.status(400).json({

                success: false,

                message: "Rank, category and region are required"

            });

        }


        const result = await Kcet.find({

            category: category,

            region: region,

            closingRank: { $gte: Number(rank) }

        });


        res.status(200).json({

            success: true,

            count: result.length,

            data: result

        });


    } catch (error) {


        console.error("KCET Prediction Error:", error);


        res.status(500).json({

            success: false,

            message: "Prediction failed",

            error: error.message

        });


    }

});


module.exports = router;
