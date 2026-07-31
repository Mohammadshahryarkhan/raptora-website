const express = require("express");

const router = express.Router();

const Josaa = require("../models/Josaa");


router.post("/predict", async (req,res)=>{

    try{

        const {rank, category, quota} = req.body;


        const colleges = await Josaa.find({

            category: category,

            quota: quota,

            closingRank:{
                $gte: rank
            }

        });


        res.json({

            colleges: colleges

        });


    }
    catch(error){

        console.log(error);

        res.status(500).json({
            message:"Server Error"
        });

    }

});


module.exports = router;