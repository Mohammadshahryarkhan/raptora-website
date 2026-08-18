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
                message:
                    "If an account exists, a reset link has been sent."
            });

        }


        // ================= GENERATE RESET TOKEN =================

        const resetToken =
            crypto.randomBytes(32).toString("hex");


        // ================= HASH TOKEN =================

        const hashedToken =
            crypto
                .createHash("sha256")
                .update(resetToken)
                .digest("hex");


        user.resetPasswordToken =
            hashedToken;


        // ================= TOKEN EXPIRY =================

        user.resetPasswordExpires =
            Date.now() + 15 * 60 * 1000;


        await user.save({
            validateBeforeSave: false
        });


        // ================= RESET URL =================

        const resetUrl =
            `${process.env.FRONTEND_URL}/reset-password.html?token=${resetToken}`;


        // ================= RESEND =================

        const resend =
            new Resend(process.env.RESEND_API_KEY);


        // ================= SEND EMAIL =================

        const emailResult =
            await resend.emails.send({

                from:
                    "Raptora <noreply@raptora.in>",

                to:
                    user.email,

                subject:
                    "Raptora Password Reset",

                html: `

                    <div style="
                        font-family: Arial, sans-serif;
                        max-width: 600px;
                        margin: auto;
                        padding: 20px;
                    ">

                        <h2>
                            Reset Your Raptora Password
                        </h2>

                        <p>
                            Hello ${user.name},
                        </p>

                        <p>
                            We received a request to reset
                            your Raptora password.
                        </p>

                        <p>
                            Click the button below to create
                            a new password:
                        </p>

                        <p>

                            <a
                                href="${resetUrl}"

                                style="
                                    display:inline-block;
                                    padding:12px 20px;
                                    background:#007bff;
                                    color:white;
                                    text-decoration:none;
                                    border-radius:6px;
                                "
                            >

                                Reset Password

                            </a>

                        </p>

                        <p>
                            This link will expire in 15 minutes.
                        </p>

                        <p>
                            If you did not request this
                            password reset, you can safely
                            ignore this email.
                        </p>

                    </div>

                `

            });


        // ================= RESEND RESULT =================

        console.log(
            "RESEND RESULT:",
            emailResult
        );


        // ================= SUCCESS RESPONSE =================

        res.json({

            message:
                "If an account exists, a reset link has been sent."

        });


    } catch (err) {

        console.log(
            "Forgot Password Error:",
            err
        );

        res.status(500).json({

            message:
                "Server Error"

        });

    }

};


// ================= RESET PASSWORD =================
exports.resetPassword = async (req, res) => {

    try {

        const { token } =
            req.params;

        const { password } =
            req.body;


        // ================= CHECK PASSWORD =================

        if (!password) {

            return res.status(400).json({

                message:
                    "Password is required"

            });

        }


        // ================= HASH RESET TOKEN =================

        const hashedToken =
            crypto
                .createHash("sha256")
                .update(token)
                .digest("hex");


        // ================= FIND USER =================

        const user =
            await User.findOne({

                resetPasswordToken:
                    hashedToken,

                resetPasswordExpires: {

                    $gt:
                        Date.now()

                }

            });


        // ================= INVALID TOKEN =================

        if (!user) {

            return res.status(400).json({

                message:
                    "Invalid or expired reset link"

            });

        }


        // ================= HASH NEW PASSWORD =================

        const hashedPassword =
            await bcrypt.hash(
                password,
                10
            );


        user.password =
            hashedPassword;


        // ================= CLEAR RESET TOKEN =================

        user.resetPasswordToken =
            null;

        user.resetPasswordExpires =
            null;


        await user.save();


        // ================= SUCCESS =================

        res.json({

            message:
                "Password reset successful"

        });


    } catch (err) {

        console.log(
            "Reset Password Error:",
            err
        );

        res.status(500).json({

            message:
                "Server Error"

        });

    }

};
