const express = require("express");
const crypto = require("crypto");
const Razorpay = require("razorpay");
const jwt = require("jsonwebtoken");
const User = require("../models/User");

const router = express.Router();

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});


// =====================================================
// VALID MENTOR PLANS
// =====================================================

const MENTOR_PLANS = {

    "1 Month Mentor Plan": {
        price: 400,
        months: 1
    },

    "3 Months Mentor Plan": {
        price: 1100,
        months: 3
    },

    "6 Months Mentor Plan": {
        price: 2200,
        months: 6
    },

    "12 Months Mentor Plan": {
        price: 4600,
        months: 12
    }

};


// =====================================================
// DISCOUNT CODES
// =====================================================

const DISCOUNT_CODES = {

    RAPTORA8: {
        type: "percentage",
        value: 8
    },

    RAPTORA10: {
        type: "percentage",
        value: 10
    },

    RAPTORA99: {
        type: "percentage",
        value: 99
    },

    RAPTORA100: {
        type: "percentage",
        value: 100
    },

    PAPA99: {
        type: "percentage",
        value: 99.7
    },

    WELCOME50: {
        type: "fixed",
        value: 50
    }

};


// =====================================================
// CALCULATE SERVER-SIDE CART TOTAL
// =====================================================

function calculateCartSubtotal(items) {

    if (!Array.isArray(items) || items.length === 0) {
        return 0;
    }

    let subtotal = 0;

    for (const item of items) {

        const name = String(item.name || "");
        const quantity = Number(item.quantity || 1);

        if (!MENTOR_PLANS[name]) {
            return 0;
        }

        if (
            !Number.isInteger(quantity) ||
            quantity < 1
        ) {
            return 0;
        }

        subtotal +=
            MENTOR_PLANS[name].price * quantity;
    }

    return subtotal;
}


// =====================================================
// CALCULATE DISCOUNT
// =====================================================

function calculateDiscount(subtotal, coupon) {

    if (!coupon) {
        return 0;
    }

    const code =
        String(coupon)
            .trim()
            .toUpperCase();

    const discountCode =
        DISCOUNT_CODES[code];

    if (!discountCode) {
        return 0;
    }

    let discount = 0;

    if (
        discountCode.type ===
        "percentage"
    ) {

        discount =
            subtotal *
            discountCode.value /
            100;

    }

    else if (
        discountCode.type ===
        "fixed"
    ) {

        discount =
            discountCode.value;

    }

    return Math.min(
        discount,
        subtotal
    );
}


// =====================================================
// AUTHENTICATION
// =====================================================

function authenticateUser(req, res, next) {

    try {

        const authHeader =
            req.headers.authorization;

        if (!authHeader) {

            return res.status(401).json({

                success: false,

                message:
                    "Authentication required."

            });

        }

        const token =
            authHeader.startsWith("Bearer ")
                ? authHeader.substring(7)
                : authHeader;

        const decoded =
            jwt.verify(
                token,
                process.env.JWT_SECRET
            );

        req.user = decoded;

        next();

    }

    catch (error) {

        console.error(
            "Authentication error:",
            error.message
        );

        return res.status(401).json({

            success: false,

            message:
                "Invalid or expired login session."

        });

    }

}


// =====================================================
// CREATE RAZORPAY ORDER
// =====================================================

router.post(
    "/create-order",
    authenticateUser,
    async (req, res) => {

        try {

            const {
                items,
                coupon
            } = req.body;


            // -----------------------------------------
            // VALIDATE CART
            // -----------------------------------------

            const subtotal =
                calculateCartSubtotal(items);


            if (
                !subtotal ||
                subtotal <= 0
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Invalid mentor cart."

                });

            }


            // -----------------------------------------
            // CALCULATE DISCOUNT
            // -----------------------------------------

            const discount =
                calculateDiscount(
                    subtotal,
                    coupon
                );


            // -----------------------------------------
            // FINAL AMOUNT
            // -----------------------------------------

            const finalAmount =
                Math.max(
                    0,
                    subtotal - discount
                );


            if (
                !finalAmount ||
                finalAmount <= 0
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Invalid payment amount."

                });

            }


            // -----------------------------------------
            // CREATE ORDER
            // -----------------------------------------

            const order =
                await razorpay.orders.create({

                    amount:
                        Math.round(
                            finalAmount * 100
                        ),

                    currency:
                        "INR",

                    receipt:
                        `raptora_${Date.now()}`,

                    notes: {

                        userId:
                            String(req.user.id),

                        coupon:
                            coupon || "",

                        discount:
                            String(discount),

                        subtotal:
                            String(subtotal)

                    }

                });


            // -----------------------------------------
            // RESPONSE
            // -----------------------------------------

            res.json({

                success: true,

                key:
                    process.env.RAZORPAY_KEY_ID,

                orderId:
                    order.id,

                amount:
                    order.amount,

                currency:
                    order.currency

            });

        }


        catch (error) {

            console.error(
                "Razorpay order error:",
                error
            );

            res.status(500).json({

                success: false,

                message:
                    "Unable to create payment order."

            });

        }

    }
);


// =====================================================
// VERIFY PAYMENT + ACTIVATE MENTOR PLAN
// =====================================================

router.post(
    "/verify",
    authenticateUser,
    async (req, res) => {

        try {

            const {
                razorpay_order_id,
                razorpay_payment_id,
                razorpay_signature,
                items
            } = req.body;


            // -----------------------------------------
            // VALIDATE PAYMENT
            // -----------------------------------------

            if (
                !razorpay_order_id ||
                !razorpay_payment_id ||
                !razorpay_signature
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Missing payment information."

                });

            }


            // -----------------------------------------
            // GENERATE SIGNATURE
            // -----------------------------------------

            const generatedSignature =
                crypto
                    .createHmac(
                        "sha256",
                        process.env.RAZORPAY_KEY_SECRET
                    )
                    .update(
                        `${razorpay_order_id}|${razorpay_payment_id}`
                    )
                    .digest("hex");


            // -----------------------------------------
            // SAFE SIGNATURE COMPARISON
            // -----------------------------------------

            const expected =
                Buffer.from(
                    generatedSignature,
                    "utf8"
                );

            const received =
                Buffer.from(
                    razorpay_signature,
                    "utf8"
                );


            if (
                expected.length !==
                received.length
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Invalid payment signature."

                });

            }


            if (
                !crypto.timingSafeEqual(
                    expected,
                    received
                )
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Invalid payment signature."

                });

            }


            // -----------------------------------------
            // FIND USER
            // -----------------------------------------

            const user =
                await User.findById(
                    req.user.id
                );


            if (!user) {

                return res.status(404).json({

                    success: false,

                    message:
                        "User account not found."

                });

            }


            // -----------------------------------------
            // FIND PURCHASED PLAN
            // -----------------------------------------

            if (
                !Array.isArray(items) ||
                items.length === 0
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Mentor plan information is missing."

                });

            }


            // For now, activate the first mentor plan
            // in the cart.

            const purchasedPlan =
                items[0];


            const planName =
                String(
                    purchasedPlan.name || ""
                );


            const plan =
                MENTOR_PLANS[planName];


            if (!plan) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Invalid mentor plan."

                });

            }


            // -----------------------------------------
            // START DATE
            // -----------------------------------------

            const startDate =
                new Date();


            // -----------------------------------------
            // EXPIRY DATE
            // -----------------------------------------

            const expiryDate =
                new Date(startDate);


            expiryDate.setMonth(
                expiryDate.getMonth() +
                plan.months
            );


            // -----------------------------------------
            // ACTIVATE MENTOR PLAN
            // -----------------------------------------

            user.mentorPlan =
                planName;

            user.mentorPlanPrice =
                plan.price;

            user.mentorStartDate =
                startDate;

            user.mentorExpiryDate =
                expiryDate;

            user.mentorActive =
                true;


            // -----------------------------------------
            // BADGE
            // -----------------------------------------

            if (
                user.badge ===
                "New Member"
            ) {

                user.badge =
                    "Mentor Student";

            }


            // -----------------------------------------
            // SAVE USER
            // -----------------------------------------

            await user.save();


            // -----------------------------------------
            // LOG PAYMENT
            // -----------------------------------------

            console.log(
                "Razorpay payment verified:",
                razorpay_payment_id
            );

            console.log(
                "Mentor activated for:",
                user.email
            );

            console.log(
                "Plan:",
                planName
            );

            console.log(
                "Start:",
                startDate
            );

            console.log(
                "Expiry:",
                expiryDate
            );


            // -----------------------------------------
            // SUCCESS
            // -----------------------------------------

            res.json({

                success: true,

                message:
                    "Payment verified and mentor plan activated.",

                paymentId:
                    razorpay_payment_id,

                orderId:
                    razorpay_order_id,

                mentorPlan:
                    planName,

                mentorStartDate:
                    startDate,

                mentorExpiryDate:
                    expiryDate

            });

        }


        catch (error) {

            console.error(
                "Payment verification error:",
                error
            );


            res.status(500).json({

                success: false,

                message:
                    "Payment verification failed."

            });

        }

    }
);


module.exports = router;
