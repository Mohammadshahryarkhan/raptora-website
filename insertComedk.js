const mongoose = require("mongoose");

require("dotenv").config();

const Comedk = require("./models/Comedk");

const comedkData = require("./data/comedkData");


mongoose.connect(process.env.MONGO_URI)

.then(async()=>{


    await Comedk.deleteMany();


    await Comedk.insertMany(comedkData);


    console.log("COMEDK Data Inserted Successfully");


    process.exit();


})

.catch((error)=>{


    console.log(error);


});