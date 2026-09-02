const express = require("express");
const crypto = require("crypto");
const Razorpay = require("razorpay");

const authMiddleware = require("../middleware/authMiddleware");
const User = require("../models/User");

const router = express.Router();


// =====================================================
// RAZORPAY
// =====================================================

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
        months: 1,
        referralPoints: 50
    },

    "3 Months Mentor Plan": {
        price: 1100,
        months: 3,
        referralPoints: 150
    },

    "6 Months Mentor Plan": {
        price: 2200,
        months: 6,
        referralPoints: 300
    },

    "12 Months Mentor Plan": {
        price: 4600,
        months: 12,
        referralPoints: 600
    }

};


// =====================================================
// REFERRAL BADGE CALCULATOR
// =====================================================

function getReferralBadge(points) {

    const totalPoints =
        Number(points || 0);

    if (totalPoints >= 300) {
        return "Raptora Elite";
    }

    if (totalPoints >= 150) {
        return "Raptora Pro";
    }

    if (totalPoints >= 50) {
        return "Raptora Starter";
    }

    return "Raptora Member";
}


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
        value: 99
    },

    WELCOME50: {
        type: "fixed",
        value: 50
    }

};


// =====================================================
// CALCULATE CART SUBTOTAL
// =====================================================

function calculateCartSubtotal(items) {

    if (
        !Array.isArray(items) ||
        items.length === 0
    ) {
        return 0;
    }

    let subtotal = 0;

    for (const item of items) {

        const name =
            String(item.name || "").trim();

        const quantity =
            Number(item.quantity || 1);

        const plan =
            MENTOR_PLANS[name];

        if (!plan) {
            return 0;
        }

        if (
            !Number.isInteger(quantity) ||
            quantity < 1
        ) {
            return 0;
        }

        subtotal +=
            plan.price * quantity;
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
        discountCode.type === "percentage"
    ) {

        discount =
            subtotal *
            discountCode.value /
            100;

    }

    else if (
        discountCode.type === "fixed"
    ) {

        discount =
            discountCode.value;

    }

    return Math.min(
        Math.max(0, discount),
        subtotal
    );
}


// =====================================================
// GET LOGGED-IN USER
// =====================================================

async function getUser(req) {

    if (
        !req.user ||
        !req.user.id
    ) {
        return null;
    }

    return await User.findById(
        req.user.id
    );
}


// =====================================================
// CREATE RAZORPAY ORDER
// =====================================================

router.post(
    "/create-order",
    authMiddleware,
    async (req, res) => {

        try {

            const {
                items,
                coupon
            } = req.body;


            // -----------------------------------------
            // USER
            // -----------------------------------------

            const user =
                await getUser(req);


            if (!user) {

                return res.status(401).json({

                    success: false,

                    message:
                        "Please login before purchasing a mentor plan."

                });

            }


            // -----------------------------------------
            // CART
            // -----------------------------------------

            if (
                !Array.isArray(items) ||
                items.length === 0
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Your mentor cart is empty."

                });

            }


            // -----------------------------------------
            // SUBTOTAL
            // -----------------------------------------

            const subtotal =
                calculateCartSubtotal(items);


            if (
                subtotal <= 0
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Invalid mentor cart."

                });

            }


            // -----------------------------------------
            // DISCOUNT
            // -----------------------------------------

            const normalizedCoupon =
                coupon
                    ? String(coupon)
                        .trim()
                        .toUpperCase()
                    : "";


            const discount =
                calculateDiscount(
                    subtotal,
                    normalizedCoupon
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
                finalAmount <= 0
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "This discount makes the order free. Razorpay requires a paid order."

                });

            }


            // -----------------------------------------
            // CREATE RAZORPAY ORDER
            // -----------------------------------------

            const razorpayOrder =
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
                            String(user._id),

                        coupon:
                            normalizedCoupon,

                        subtotal:
                            String(subtotal),

                        discount:
                            String(discount),

                        finalAmount:
                            String(finalAmount)

                    }

                });


            console.log(
                "Razorpay order created:",
                razorpayOrder.id
            );


            // -----------------------------------------
            // RESPONSE
            // -----------------------------------------

            return res.status(200).json({

                success: true,

                key:
                    process.env.RAZORPAY_KEY_ID,

                orderId:
                    razorpayOrder.id,

                amount:
                    razorpayOrder.amount,

                currency:
                    razorpayOrder.currency,

                subtotal:
                    subtotal,

                discount:
                    discount,

                finalAmount:
                    finalAmount

            });

        }

        catch (error) {

            console.error(
                "CREATE ORDER ERROR:",
                error
            );

            return res.status(500).json({

                success: false,

                message:
                    error.message ||
                    "Unable to create payment order."

            });

        }

    }
);


// =====================================================
// VERIFY PAYMENT
// =====================================================

router.post(
    "/verify",
    authMiddleware,
    async (req, res) => {

        try {

            const {
                razorpay_order_id,
                razorpay_payment_id,
                razorpay_signature,
                items
            } = req.body;


            console.log(
                "======================================"
            );

            console.log(
                "PAYMENT VERIFICATION STARTED"
            );

            console.log(
                "Order ID:",
                razorpay_order_id
            );

            console.log(
                "Payment ID:",
                razorpay_payment_id
            );


            // -----------------------------------------
            // VALIDATE PAYMENT DATA
            // -----------------------------------------

            if (
                !razorpay_order_id ||
                !razorpay_payment_id ||
                !razorpay_signature
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Missing Razorpay payment information."

                });

            }


            // -----------------------------------------
            // USER
            // -----------------------------------------

            const user =
                await getUser(req);


            if (!user) {

                return res.status(401).json({

                    success: false,

                    message:
                        "Please login again."

                });

            }


            // -----------------------------------------
            // FETCH RAZORPAY ORDER
            // -----------------------------------------

            let razorpayOrder;

            try {

                razorpayOrder =
                    await razorpay.orders.fetch(
                        razorpay_order_id
                    );

            }

            catch (error) {

                console.error(
                    "RAZORPAY ORDER FETCH ERROR:",
                    error
                );

                return res.status(400).json({

                    success: false,

                    message:
                        "Unable to find this Razorpay order."

                });

            }


            // -----------------------------------------
            // CHECK ORDER USER
            // -----------------------------------------

            if (
                !razorpayOrder.notes ||
                String(
                    razorpayOrder.notes.userId
                ) !== String(user._id)
            ) {

                return res.status(403).json({

                    success: false,

                    message:
                        "This payment order does not belong to this account."

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
            // COMPARE SIGNATURE
            // -----------------------------------------

            if (
                generatedSignature.length !==
                razorpay_signature.length
            ) {

                console.error(
                    "SIGNATURE LENGTH MISMATCH"
                );

                return res.status(400).json({

                    success: false,

                    message:
                        "Invalid payment signature."

                });

            }


            const signatureValid =
                crypto.timingSafeEqual(

                    Buffer.from(
                        generatedSignature,
                        "utf8"
                    ),

                    Buffer.from(
                        razorpay_signature,
                        "utf8"
                    )

                );


            if (!signatureValid) {

                console.error(
                    "INVALID RAZORPAY SIGNATURE"
                );

                return res.status(400).json({

                    success: false,

                    message:
                        "Invalid payment signature."

                });

            }


            console.log(
                "Razorpay signature verified."
            );


            // -----------------------------------------
            // FETCH PAYMENT
            // -----------------------------------------

            let payment;

            try {

                payment =
                    await razorpay.payments.fetch(
                        razorpay_payment_id
                    );

            }

            catch (error) {

                console.error(
                    "RAZORPAY PAYMENT FETCH ERROR:",
                    error
                );

                return res.status(400).json({

                    success: false,

                    message:
                        "Unable to validate Razorpay payment."

                });

            }


            // -----------------------------------------
            // PAYMENT STATUS
            // -----------------------------------------

            if (
                payment.status !== "captured"
            ) {

                console.error(
                    "PAYMENT STATUS:",
                    payment.status
                );

                return res.status(400).json({

                    success: false,

                    message:
                        `Payment is not captured. Current status: ${payment.status}`

                });

            }


            // -----------------------------------------
            // PAYMENT ORDER MATCH
            // -----------------------------------------

            if (
                String(payment.order_id) !==
                String(razorpay_order_id)
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Payment does not match the Razorpay order."

                });

            }


            // -----------------------------------------
            // AMOUNT MATCH
            // -----------------------------------------

            if (
                Number(payment.amount) !==
                Number(razorpayOrder.amount)
            ) {

                console.error(
                    "AMOUNT MISMATCH",
                    {
                        paymentAmount:
                            payment.amount,

                        orderAmount:
                            razorpayOrder.amount
                    }
                );

                return res.status(400).json({

                    success: false,

                    message:
                        "Payment amount does not match the order."

                });

            }


            // =====================================================
            // DUPLICATE PAYMENT PROTECTION
            // =====================================================
            //
            // If this exact Razorpay payment/order was already
            // successfully processed, DO NOT activate the plan
            // again and DO NOT award referral points again.
            //
            // =====================================================

            if (
                String(user.razorpayPaymentId || "") ===
                String(razorpay_payment_id)
                ||
                String(user.razorpayOrderId || "") ===
                String(razorpay_order_id)
            ) {

                console.log(
                    "DUPLICATE PAYMENT VERIFICATION BLOCKED:",
                    {
                        user:
                            user.email,

                        orderId:
                            razorpay_order_id,

                        paymentId:
                            razorpay_payment_id
                    }
                );

                return res.status(200).json({

                    success: true,

                    alreadyProcessed:
                        true,

                    message:
                        "This payment has already been processed.",

                    paymentId:
                        razorpay_payment_id,

                    orderId:
                        razorpay_order_id,

                    referralReward:
                        0

                });

            }


            // -----------------------------------------
            // IDENTIFY PLAN
            // -----------------------------------------

            let purchasedPlan = null;


            if (
                Array.isArray(items)
            ) {

                for (
                    const item of items
                ) {

                    const name =
                        String(
                            item.name || ""
                        ).trim();


                    const plan =
                        MENTOR_PLANS[name];


                    if (plan) {

                        purchasedPlan = {

                            name:
                                name,

                            price:
                                plan.price,

                            months:
                                plan.months,

                            referralPoints:
                                plan.referralPoints

                        };

                        break;

                    }

                }

            }


            if (!purchasedPlan) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Unable to identify mentor plan."

                });

            }


            // -----------------------------------------
            // DATES
            // -----------------------------------------

            const startDate =
                new Date();


            const endDate =
                new Date(
                    startDate
                );


            endDate.setMonth(
                endDate.getMonth() +
                purchasedPlan.months
            );


            // -----------------------------------------
            // MILESTONES
            // -----------------------------------------

            const milestones = [

                {
                    title:
                        "Complete Student Profile",

                    description:
                        "Complete your Raptora student profile.",

                    completed:
                        false,

                    completedDate:
                        null
                },

                {
                    title:
                        "Mentor Introduction",

                    description:
                        "Connect with your assigned Raptora mentor.",

                    completed:
                        false,

                    completedDate:
                        null
                },

                {
                    title:
                        "Understand Your Goals",

                    description:
                        "Discuss your college and career goals with your mentor.",

                    completed:
                        false,

                    completedDate:
                        null
                },

                {
                    title:
                        "College Shortlisting",

                    description:
                        "Create your personalized college shortlist.",

                    completed:
                        false,

                    completedDate:
                        null
                },

                {
                    title:
                        "Rank & College Strategy",

                    description:
                        "Review your predicted colleges and admission strategy.",

                    completed:
                        false,

                    completedDate:
                        null
                },

                {
                    title:
                        "Application Planning",

                    description:
                        "Plan your applications and important admission deadlines.",

                    completed:
                        false,

                    completedDate:
                        null
                },

                {
                    title:
                        "Document Preparation",

                    description:
                        "Prepare the documents required for admission.",

                    completed:
                        false,

                    completedDate:
                        null
                },

                {
                    title:
                        "Application Review",

                    description:
                        "Review your applications before submission.",

                    completed:
                        false,

                    completedDate:
                        null
                },

                {
                    title:
                        "Admission Updates",

                    description:
                        "Track important admission and counselling updates.",

                    completed:
                        false,

                    completedDate:
                        null
                },

                {
                    title:
                        "Final College Decision",

                    description:
                        "Finalize your college choice with mentor guidance.",

                    completed:
                        false,

                    completedDate:
                        null
                }

            ];


            // -----------------------------------------
            // ACTIVATE MENTOR SUBSCRIPTION
            // -----------------------------------------

            user.mentorSubscription = {

                active:
                    true,

                plan:
                    purchasedPlan.name,

                durationMonths:
                    purchasedPlan.months,

                price:
                    purchasedPlan.price,

                startDate:
                    startDate,

                endDate:
                    endDate,

                razorpayOrderId:
                    razorpay_order_id,

                razorpayPaymentId:
                    razorpay_payment_id

            };


            // -----------------------------------------
            // COURSE START DATE
            // -----------------------------------------

            user.courseStartDate =
                startDate;


            // -----------------------------------------
            // PROGRESS
            // -----------------------------------------

            user.mentorshipProgress = {

                completedMilestones:
                    0,

                totalMilestones:
                    milestones.length,

                currentMilestone:
                    milestones[0].title

            };


            // -----------------------------------------
            // MILESTONES
            // -----------------------------------------

            user.milestones =
                milestones;


            // -----------------------------------------
            // MENTORSHIP BADGE
            // -----------------------------------------

            user.badge =
                "Raptora Mentor Member";


            // -----------------------------------------
            // PAYMENT STATUS
            // -----------------------------------------

            user.paymentStatus =
                "paid";


            user.razorpayPaymentId =
                razorpay_payment_id;


            user.razorpayOrderId =
                razorpay_order_id;


            // -----------------------------------------
            // REFERRAL REWARD
            // -----------------------------------------

            let referralReward = 0;

            let referringUser = null;


            if (
                user.referredBy &&
                purchasedPlan.referralPoints > 0
            ) {

                referringUser =
                    await User.findById(
                        user.referredBy
                    );


                if (referringUser) {

                    referralReward =
                        purchasedPlan.referralPoints;


                    referringUser.referralPoints =
                        Number(
                            referringUser.referralPoints || 0
                        ) +
                        referralReward;


                    referringUser.referralBadge =
                        getReferralBadge(
                            referringUser.referralPoints
                        );


                    await referringUser.save();

                    console.log(
                        "REFERRAL REWARD AWARDED:",
                        {
                            referredStudent:
                                user.email,

                            referrer:
                                referringUser.email,

                            points:
                                referralReward,

                            totalPoints:
                                referringUser.referralPoints,

                            badge:
                                referringUser.referralBadge
                        }
                    );

                }

            }


            // -----------------------------------------
            // SAVE STUDENT
            // -----------------------------------------

            await user.save();


            console.log(
                "USER SAVED SUCCESSFULLY"
            );

            console.log(
                "Mentorship activated for:",
                user.email
            );


            console.log(
                "Referral points awarded:",
                referralReward
            );


            console.log(
                "PAYMENT VERIFICATION SUCCESS"
            );

            console.log(
                "======================================"
            );


            // -----------------------------------------
            // SUCCESS RESPONSE
            // -----------------------------------------

            return res.status(200).json({

                success:
                    true,

                alreadyProcessed:
                    false,

                message:
                    "Payment verified and mentor plan activated.",

                paymentId:
                    razorpay_payment_id,

                orderId:
                    razorpay_order_id,

                mentorPlan:
                    purchasedPlan.name,

                startDate:
                    startDate,

                endDate:
                    endDate,

                referralReward:
                    referralReward

            });

        }

        catch (error) {

            console.error(
                "======================================"
            );

            console.error(
                "PAYMENT VERIFICATION ERROR:"
            );

            console.error(
                error
            );

            console.error(
                "ERROR MESSAGE:",
                error.message
            );

            console.error(
                "ERROR STACK:",
                error.stack
            );

            console.error(
                "======================================"
            );


            return res.status(500).json({

                success:
                    false,

                message:
                    error.message ||
                    "Payment verification failed."

            });

        }

    }
);


// =====================================================
// EXPORT
// =====================================================

module.exports = router;
