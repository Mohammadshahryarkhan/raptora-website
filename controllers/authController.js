const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

// ================= REGISTER =================
// ================= REGISTER =================
exports.register = async (req, res) => {

    try {

        const { name, email, phone, password } = req.body;


        const existingUser = await User.findOne({ email });
console.log("Checking email:", email);
console.log("Existing user:", existingUser);
        if (existingUser) {
            return res.status(400).json({
                message: "User already exists"
            });
        }


        const hashedPassword = await bcrypt.hash(password, 10);


        const user = new User({

            name,
            email,
            phone,
            password: hashedPassword

        });


        await user.save();


        res.status(201).json({
            message: "Registration successful"
        });


    } catch (err) {

        console.log(err);

        res.status(500).json({
            message: "Server Error"
        });

    }

};
// ================= LOGIN =================
exports.login = async (req, res) => {

    try {

        const { email, password } = req.body;

        const user = await User.findOne({ email });

        if (!user) {

            return res.status(400).json({
                message: "Invalid Email"
            });

        }

        const match = await bcrypt.compare(password, user.password);

        if (!match) {

            return res.status(400).json({
                message: "Invalid Password"
            });

        }

        const token = jwt.sign(

            {
                id: user._id,
                name: user.name,
                email: user.email
            },

            process.env.JWT_SECRET,

            {
                expiresIn: "1d"
            }

        );

        res.json({

    message: "Login Successful",

    token,

    name: user.name,

    email: user.email,

    phone: user.phone

});
    } catch (err) {

        console.log(err);

        res.status(500).json({
            message: "Server Error"
        });

    }

};