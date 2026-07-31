const express = require("express");

const router = express.Router();

const Kcet = require("../models/Kcet");


router.post("/predict", async(req,res)=>{

try{


const {
rank,
category,
region
}=req.body;



const colleges = await Kcet.find({

category:category,

region:region,

closingRank:{
$gte:Number(rank)
}

});



res.json({

colleges:colleges

});


}

catch(error){

console.log(error);

res.status(500).json({

message:"Server Error"

});

}


});


module.exports=router;