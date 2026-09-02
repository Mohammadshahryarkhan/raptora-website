const User = require("../models/User");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { Resend } = require("resend");


// =====================================================
// GENERATE REFERRAL CODE
// =====================================================

function generateReferralCode() {

    return (
        "RAPTORA-" +
        crypto
            .randomBytes(4)
            .toString("hex")
            .toUpperCase()
    );

}


// ================= REGISTER =================

exports.register = async (req, res) => {

    try {

        const {
            name,
            email,
            phone,
            password,
            referralCode
        } = req.body;


        // =====================================================
        // VALIDATE REQUIRED FIELDS
        // =====================================================

        if (
            !name ||
            !email ||
            !phone ||
            !password
        ) {

            return res.status(400).json({

                message:
                    "Name, email, phone and password are required."

            });

        }


        // =====================================================
        // NORMALIZE EMAIL
        // =====================================================

        const normalizedEmail =
            String(email)
                .trim()
                .toLowerCase();


        // =====================================================
        // NORMALIZE PHONE
        // =====================================================

        const normalizedPhone =
            String(phone)
                .trim();


        // =====================================================
        // CHECK EXISTING USER
        // =====================================================

        const existingUser =
            await User.findOne({
                email: normalizedEmail
            });


        console.log(
            "Checking email:",
            normalizedEmail
        );

        console.log(
            "Existing user:",
            existingUser
        );


        if (existingUser) {

            return res.status(400).json({

                message:
                    "User already exists"

            });

        }


        // =====================================================
        // CHECK REFERRAL CODE
        // =====================================================

        let referringUser = null;


        if (referralCode) {

            referringUser =
                await User.findOne({

                    referralCode:
                        String(referralCode)
                            .trim()
                            .toUpperCase()

                });


            if (!referringUser) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Invalid referral code."

                });

            }

        }


        // =====================================================
        // HASH PASSWORD
        // =====================================================

        const hashedPassword =
            await bcrypt.hash(
                password,
                10
            );


        // =====================================================
        // CREATE USER
        // =====================================================

        const user =
            new User({

                name:
                    String(name).trim(),

                email:
                    normalizedEmail,

                phone:
                    normalizedPhone,

                password:
                    hashedPassword,

                referralCode:
                    generateReferralCode(),

                referredBy:
                    referringUser
                        ? referringUser._id
                        : null,

                referralPoints:
                    0,

                referralBadge:
                    "Raptora Member",

                badge:
                    "Raptora Member"

            });


        // =====================================================
        // SAVE USER
        // =====================================================

        await user.save();


        // =====================================================
        // SUCCESS
        // =====================================================

        return res.status(201).json({

            success: true,

            message:
                "Registration successful"

        });

    }

    catch (err) {

        console.error(
            "REGISTER ERROR:",
            err
        );


        return res.status(500).json({

            success: false,

            message:
                "Server Error"

        });

    }

};



// =====================================================
// LOGIN
// =====================================================

exports.login = async (req, res) => {

    try {

        const {
            email,
            password
        } = req.body;


        // =====================================================
        // VALIDATE INPUT
        // =====================================================

        if (
            !email ||
            !password
        ) {

            return res.status(400).json({

                message:
                    "Email and password are required."

            });

        }


        const normalizedEmail =
            String(email)
                .trim()
                .toLowerCase();


        // =====================================================
        // FIND USER
        // =====================================================

        const user =
            await User.findOne({

                email:
                    normalizedEmail

            });


        if (!user) {

            return res.status(400).json({

                message:
                    "Invalid Email"

            });

        }


        // =====================================================
        // CHECK PASSWORD
        // =====================================================

        const match =
            await bcrypt.compare(
                password,
                user.password
            );


        if (!match) {

            return res.status(400).json({

                message:
                    "Invalid Password"

            });

        }


        // =====================================================
        // FIX OLD USERS WITHOUT PHONE
        // =====================================================

        if (
            user.phone === undefined ||
            user.phone === null
        ) {

            user.phone = "";

        }


        // =====================================================
        // FIX OLD USERS WITHOUT REFERRAL CODE
        // =====================================================

        if (
            !user.referralCode
        ) {

            user.referralCode =
                generateReferralCode();

        }


        // =====================================================
        // FIX OLD USERS WITHOUT REFERRAL POINTS
        // =====================================================

        if (
            user.referralPoints === undefined ||
            user.referralPoints === null
        ) {

            user.referralPoints =
                0;

        }


        // =====================================================
        // FIX OLD USERS WITHOUT REFERRAL BADGE
        // =====================================================

        if (
            !user.referralBadge
        ) {

            user.referralBadge =
                "Raptora Member";

        }


        // =====================================================
        // SAVE UPDATED OLD USER
        // =====================================================

        await user.save({
            validateBeforeSave: false
        });


        // =====================================================
        // CREATE JWT
        // =====================================================

        const token =
            jwt.sign(

                {

                    id:
                        user._id,

                    name:
                        user.name,

                    email:
                        user.email

                },

                process.env.JWT_SECRET,

                {

                    expiresIn:
                        "1d"

                }

            );


        // =====================================================
        // RESPONSE
        // =====================================================

        return res.json({

            success:
                true,

            message:
                "Login Successful",

            token,

            name:
                user.name,

            email:
                user.email,

            phone:
                user.phone || ""

        });

    }

    catch (err) {

        console.error(
            "LOGIN ERROR:",
            err
        );


        return res.status(500).json({

            success:
                false,

            message:
                "Server Error"

        });

    }

};



// =====================================================
// FORGOT PASSWORD
// =====================================================

exports.forgotPassword = async (req, res) => {

    try {

        const {
            email
        } = req.body;


        if (!email) {

            return res.status(400).json({

                message:
                    "Email is required"

            });

        }


        const normalizedEmail =
            String(email)
                .trim()
                .toLowerCase();


        const user =
            await User.findOne({

                email:
                    normalizedEmail

            });


        if (!user) {

            return res.json({

                message:
                    "If an account exists, a reset link has been sent."

            });

        }


        const resetToken =
            crypto
                .randomBytes(32)
                .toString("hex");


        const hashedToken =
            crypto
                .createHash("sha256")
                .update(resetToken)
                .digest("hex");


        user.resetPasswordToken =
            hashedToken;


        user.resetPasswordExpires =
            Date.now() +
            15 * 60 * 1000;


        await user.save({
            validateBeforeSave: false
        });


        const resetUrl =
            `${process.env.FRONTEND_URL}/frontend/reset-password.html?token=${resetToken}`;


        const resend =
            new Resend(
                process.env.RESEND_API_KEY
            );


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


        console.log(
            "RESEND RESULT:",
            emailResult
        );


        return res.json({

            message:
                "If an account exists, a reset link has been sent."

        });

    }

    catch (err) {

        console.error(
            "FORGOT PASSWORD ERROR:",
            err
        );


        return res.status(500).json({

            message:
                "Server Error"

        });

    }

};



// =====================================================
// RESET PASSWORD
// =====================================================

exports.resetPassword = async (req, res) => {

    try {

        const {
            token
        } = req.params;


        const {
            password
        } = req.body;


        // =====================================================
        // VALIDATE PASSWORD
        // =====================================================

        if (!password) {

            return res.status(400).json({

                message:
                    "Password is required"

            });

        }


        if (
            password.length < 6
        ) {

            return res.status(400).json({

                message:
                    "Password must be at least 6 characters long."

            });

        }


        // =====================================================
        // HASH RESET TOKEN
        // =====================================================

        const hashedToken =
            crypto
                .createHash("sha256")
                .update(token)
                .digest("hex");


        // =====================================================
        // FIND USER
        // =====================================================

        const user =
            await User.findOne({

                resetPasswordToken:
                    hashedToken,

                resetPasswordExpires: {

                    $gt:
                        Date.now()

                }

            });


        // =====================================================
        // INVALID TOKEN
        // =====================================================

        if (!user) {

            return res.status(400).json({

                message:
                    "Invalid or expired reset link"

            });

        }


        // =====================================================
        // HASH NEW PASSWORD
        // =====================================================

        const hashedPassword =
            await bcrypt.hash(
                password,
                10
            );


        user.password =
            hashedPassword;


        // =====================================================
        // CLEAR RESET TOKEN
        // =====================================================

        user.resetPasswordToken =
            null;

        user.resetPasswordExpires =
            null;


        // =====================================================
        // SAVE
        // =====================================================

        await user.save({
            validateBeforeSave: false
        });


        // =====================================================
        // SUCCESS
        // =====================================================

        return res.json({

            success:
                true,

            message:
                "Password reset successful"

        });

    }

    catch (err) {

        console.error(
            "RESET PASSWORD ERROR:",
            err
        );


        return res.status(500).json({

            message:
                "Server Error"

        });

    }

};
