    const express = require("express");
const crypto = require("crypto");
const Razorpay = require("razorpay");

const router = express.Router();

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});


// =====================================================
// VALID MENTOR PLANS
// =====================================================

const MENTOR_PLANS = {

    "1 Month Mentor Plan": 400,

    "3 Months Mentor Plan": 1100,

    "6 Months Mentor Plan": 2200,

    "12 Months Mentor Plan": 4600

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

        if (!Number.isInteger(quantity) || quantity < 1) {
            return 0;
        }

        subtotal +=
            MENTOR_PLANS[name] * quantity;
    }

    return subtotal;
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

    WELCOME15: {
        type: "fixed",
        value: 15
    }

};


// =====================================================
// CALCULATE SERVER-SIDE DISCOUNT
// =====================================================

function calculateDiscount(
    subtotal,
    coupon
) {

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
// CREATE RAZORPAY ORDER
// =====================================================

router.post(
    "/create-order",
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
            // CREATE RAZORPAY ORDER
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
// VERIFY RAZORPAY PAYMENT
// =====================================================

router.post(
    "/verify",
    async (req, res) => {

        try {

            const {
                razorpay_order_id,
                razorpay_payment_id,
                razorpay_signature
            } = req.body;


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
            // VERIFY SIGNATURE
            // -----------------------------------------

            if (
                !crypto.timingSafeEqual(
                    Buffer.from(
                        generatedSignature,
                        "utf8"
                    ),
                    Buffer.from(
                        razorpay_signature,
                        "utf8"
                    )
                )
            ) {

                return res.status(400).json({

                    success: false,

                    message:
                        "Invalid payment signature."

                });

            }


            // -----------------------------------------
            // PAYMENT VERIFIED
            // -----------------------------------------

            console.log(
                "Razorpay payment verified:",
                razorpay_payment_id
            );


            res.json({

                success: true,

                message:
                    "Payment verified successfully.",

                paymentId:
                    razorpay_payment_id,

                orderId:
                    razorpay_order_id

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
