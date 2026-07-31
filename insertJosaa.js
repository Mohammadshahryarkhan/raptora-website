const mongoose = require("mongoose");
require("dotenv").config();

const Josaa = require("./models/Josaa");

const josaaData = require("./data/josaaData");


console.log("Starting JoSAA Upload...");


mongoose.connect(process.env.MONGO_URI)

.then(async () => {


    console.log("MongoDB Connected");


    await Josaa.deleteMany();


    await Josaa.insertMany(josaaData);


    console.log("JoSAA Data Inserted Successfully");


    await mongoose.connection.close();


})

.catch((error) => {


    console.log("Error:", error);


});