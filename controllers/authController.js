const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { Resend } = require("resend");

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


// ================= FORGOT PASSWORD =================
exports.forgotPassword = async (req, res) => {

    try {

        const { email } = req.body;


        const user = await User.findOne({ email });


        if (!user) {

            return res.json({
                message: "If an account exists, a reset link has been sent."
            });

        }


        // Generate reset token
        const resetToken = crypto.randomBytes(32).toString("hex");


        // Hash token before storing
        const hashedToken = crypto
            .createHash("sha256")
            .update(resetToken)
            .digest("hex");


        user.resetPasswordToken = hashedToken;


        // Token expires in 15 minutes
        user.resetPasswordExpires = Date.now() + 15 * 60 * 1000;


        await user.save({
            validateBeforeSave: false
        });



        // Reset URL
        const resetUrl =
            `${process.env.FRONTEND_URL}/reset-password.html?token=${resetToken}`;



        // Gmail transporter
             const transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 587,
    secure: false,
    requireTLS: true,
    family: 4,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});
   



        // Send email
        await transporter.sendMail({

            from: process.env.EMAIL_USER,

            to: user.email,

            subject: "Raptora Password Reset",


            html: `

            <div style="
                font-family: Arial, sans-serif;
                max-width: 600px;
                margin: auto;
                padding: 20px;
            ">

                <h2>Reset Your Raptora Password</h2>


                <p>Hello ${user.name},</p>


                <p>
                    We received a request to reset your Raptora password.
                </p>


                <p>
                    Click the button below to create a new password:
                </p>


                <p>

                    <a href="${resetUrl}"

                    style="
                        display:inline-block;
                        padding:12px 20px;
                        background:#007bff;
                        color:white;
                        text-decoration:none;
                        border-radius:6px;
                    ">

                        Reset Password

                    </a>

                </p>


                <p>
                    This link will expire in 15 minutes.
                </p>


                <p>
                    If you did not request this password reset,
                    you can safely ignore this email.
                </p>


            </div>

            `

        });



        res.json({

            message: "If an account exists, a reset link has been sent."

        });



    } catch (err) {


        console.log("Forgot Password Error:", err);


        res.status(500).json({

            message: "Server Error"

        });


    }

};



// ================= RESET PASSWORD =================
exports.resetPassword = async (req, res) => {


    try {


        const { token } = req.params;


        const { password } = req.body;



        if (!password) {


            return res.status(400).json({

                message: "Password is required"

            });


        }



        const hashedToken = crypto

            .createHash("sha256")

            .update(token)

            .digest("hex");




        const user = await User.findOne({


            resetPasswordToken: hashedToken,


            resetPasswordExpires: {

                $gt: Date.now()

            }


        });




        if (!user) {


            return res.status(400).json({

                message: "Invalid or expired reset link"

            });


        }




        const hashedPassword = await bcrypt.hash(password, 10);



        user.password = hashedPassword;



        user.resetPasswordToken = null;


        user.resetPasswordExpires = null;



        await user.save();




        res.json({

            message: "Password reset successful"

        });




    } catch (err) {


        console.log("Reset Password Error:", err);



        res.status(500).json({

            message: "Server Error"

        });


    }


};
