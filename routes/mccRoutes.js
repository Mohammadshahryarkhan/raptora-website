const express = require("express");

const router = express.Router();

const Mcc = require("../models/Mcc");


// MCC Test Route

router.get("/test", (req, res) => {

    res.send("MCC route working");

});




// NEET MCC Predictor

router.post("/predict", async (req, res) => {

    try {


        const {
            rank,
            category,
            quota
        } = req.body;



        console.log("MCC Request:", req.body);



        if (!rank || !category || !quota) {

            return res.status(400).json({

                success:false,

                message:"Rank, category and quota are required"

            });

        }



        const colleges = await Mcc.find({

            category: category,

            quota: quota,

            closingRank: {

                $gte: Number(rank)

            }

        });



        console.log("MCC Colleges Found:", colleges.length);



        res.status(200).json({

            success:true,

            count: colleges.length,

            data: colleges

        });



    }

    catch(error) {


        console.log("MCC Error:", error);



        res.status(500).json({

            success:false,

            message:"Prediction failed",

            error:error.message

        });


    }


});


module.exports = router;
