const express = require("express");
const crypto = require("crypto");
const Razorpay = require("razorpay");

const router = express.Router();

const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});

// =====================================================
// CREATE RAZORPAY ORDER
// =====================================================

router.post("/create-order", async (req, res) => {
    try {
        const {
            items,
            subtotal,
            coupon,
            discount,
            amount
        } = req.body;

        const finalAmount = Number(amount);

        if (!finalAmount || finalAmount <= 0) {
            return res.status(400).json({
                success: false,
                message: "Invalid payment amount."
            });
        }

        const order = await razorpay.orders.create({
            amount: Math.round(finalAmount * 100),
            currency: "INR",
            receipt: `raptora_${Date.now()}`,
            notes: {
                coupon: coupon || "",
                discount: String(discount || 0)
            }
        });

        res.json({
            success: true,
            key: process.env.RAZORPAY_KEY_ID,
            orderId: order.id,
            amount: order.amount,
            currency: order.currency
        });

    } catch (error) {
        console.error("Razorpay order error:", error);

        res.status(500).json({
            success: false,
            message: "Unable to create payment order."
        });
    }
});


// =====================================================
// VERIFY RAZORPAY PAYMENT
// =====================================================

router.post("/verify", async (req, res) => {
    try {
        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature
        } = req.body;

        if (
            !razorpay_order_id ||
            !razorpay_payment_id ||
            !razorpay_signature
        ) {
            return res.status(400).json({
                success: false,
                message: "Missing payment information."
            });
        }

        const generatedSignature = crypto
            .createHmac(
                "sha256",
                process.env.RAZORPAY_KEY_SECRET
            )
            .update(
                `${razorpay_order_id}|${razorpay_payment_id}`
            )
            .digest("hex");

        if (generatedSignature !== razorpay_signature) {
            return res.status(400).json({
                success: false,
                message: "Invalid payment signature."
            });
        }

        console.log(
            "Razorpay payment verified:",
            razorpay_payment_id
        );

        res.json({
            success: true,
            message: "Payment verified successfully.",
            paymentId: razorpay_payment_id,
            orderId: razorpay_order_id
        });

    } catch (error) {
        console.error("Payment verification error:", error);

        res.status(500).json({
            success: false,
            message: "Payment verification failed."
        });
    }
});

module.exports = router;
