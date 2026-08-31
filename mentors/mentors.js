
/* =====================================================
   RAPTORA — MENTORS CART + RAZORPAY
   mentors/mentors.js
===================================================== */


/* =====================================================
   RENDER BACKEND
===================================================== */

const API_BASE_URL =
    "https://raptora-website-1.onrender.com";


/* =====================================================
   CART
===================================================== */

let cart = JSON.parse(
    localStorage.getItem("raptoraMentorCart")
) || [];


/* =====================================================
   SAVE CART
===================================================== */

function saveCart() {

    localStorage.setItem(
        "raptoraMentorCart",
        JSON.stringify(cart)
    );

}


/* =====================================================
   ADD TO CART
===================================================== */

function addToCart(name, price) {

    price = Number(price);

    const existingItem = cart.find(
        item => item.name === name
    );


    if (existingItem) {

        existingItem.quantity =
            Number(existingItem.quantity || 1) + 1;

    } else {

        cart.push({

            name: name,

            price: price,

            quantity: 1

        });

    }


    saveCart();

    updateCart();

    openCart();

}


/* =====================================================
   INCREASE QUANTITY
===================================================== */

function increaseQuantity(index) {

    if (!cart[index]) {
        return;
    }


    cart[index].quantity =
        Number(cart[index].quantity || 1) + 1;


    saveCart();

    updateCart();

}


/* =====================================================
   DECREASE QUANTITY
===================================================== */

function decreaseQuantity(index) {

    if (!cart[index]) {
        return;
    }


    const quantity =
        Number(cart[index].quantity || 1);


    if (quantity > 1) {

        cart[index].quantity =
            quantity - 1;

    } else {

        cart.splice(index, 1);

    }


    saveCart();

    updateCart();

}


/* =====================================================
   REMOVE ITEM
===================================================== */

function removeFromCart(index) {

    if (
        index < 0 ||
        index >= cart.length
    ) {
        return;
    }


    cart.splice(index, 1);


    saveCart();

    updateCart();

}


/* =====================================================
   CALCULATE TOTAL
===================================================== */

function getCartTotal() {

    return cart.reduce(

        (total, item) => {

            const price =
                Number(item.price || 0);

            const quantity =
                Number(item.quantity || 1);

            return total + (price * quantity);

        },

        0

    );

}


/* =====================================================
   TOTAL QUANTITY
===================================================== */

function getCartQuantity() {

    return cart.reduce(

        (total, item) => {

            return total +
                Number(item.quantity || 1);

        },

        0

    );

}


/* =====================================================
   UPDATE CART
===================================================== */

function updateCart() {

    const cartItems =
        document.getElementById("cart-items");

    const cartCount =
        document.getElementById("cart-count");

    const cartTotal =
        document.getElementById("cart-total");

    const checkoutButton =
        document.getElementById("checkout-button");


    if (!cartItems) {
        return;
    }


    /* -----------------------------------------------
       CART COUNT
    ------------------------------------------------ */

    if (cartCount) {

        cartCount.textContent =
            getCartQuantity();

    }


    /* -----------------------------------------------
       EMPTY CART
    ------------------------------------------------ */

    if (cart.length === 0) {

        cartItems.innerHTML = `

            <div class="empty-cart">

                Your cart is empty.

            </div>

        `;


        if (cartTotal) {

            cartTotal.textContent =
                "₹0";

        }


        if (checkoutButton) {

            checkoutButton.disabled = true;

            checkoutButton.textContent =
                "Proceed to Checkout";

        }


        return;

    }


    /* -----------------------------------------------
       CART ITEMS
    ------------------------------------------------ */

    cartItems.innerHTML = "";


    cart.forEach(
        (item, index) => {

            const price =
                Number(item.price || 0);

            const quantity =
                Number(item.quantity || 1);

            const itemTotal =
                price * quantity;


            const itemElement =
                document.createElement("div");


            itemElement.className =
                "cart-item";


            itemElement.innerHTML = `

                <div class="cart-item-top">

                    <div>

                        <div class="cart-item-name">

                            ${escapeHTML(item.name)}

                        </div>


                        <div class="cart-item-price">

                            ₹${price.toLocaleString("en-IN")}
                            each

                        </div>

                    </div>


                    <div class="cart-item-total">

                        ₹${itemTotal.toLocaleString("en-IN")}

                    </div>

                </div>


                <div class="cart-item-bottom">


                    <div class="quantity-control">


                        <button
                            type="button"
                            class="quantity-button"
                            onclick="decreaseQuantity(${index})">

                            −

                        </button>


                        <span class="quantity-value">

                            ${quantity}

                        </span>


                        <button
                            type="button"
                            class="quantity-button"
                            onclick="increaseQuantity(${index})">

                            +

                        </button>


                    </div>


                    <button
                        type="button"
                        class="remove-item"
                        onclick="removeFromCart(${index})">

                        Remove

                    </button>


                </div>

            `;


            cartItems.appendChild(
                itemElement
            );

        }
    );


    /* -----------------------------------------------
       TOTAL
    ------------------------------------------------ */

    if (cartTotal) {

        cartTotal.textContent =
            "₹" +
            getCartTotal().toLocaleString("en-IN");

    }


    /* -----------------------------------------------
       ENABLE CHECKOUT
    ------------------------------------------------ */

    if (checkoutButton) {

        checkoutButton.disabled = false;

        checkoutButton.textContent =
            "Proceed to Checkout";

    }

}


/* =====================================================
   OPEN CART
===================================================== */

function openCart() {

    const drawer =
        document.getElementById("cart-drawer");

    const overlay =
        document.getElementById("cart-overlay");


    if (drawer) {

        drawer.classList.add("active");

    }


    if (overlay) {

        overlay.classList.add("active");

    }


    document.body.style.overflow =
        "hidden";

}


/* =====================================================
   CLOSE CART
===================================================== */

function closeCart() {

    const drawer =
        document.getElementById("cart-drawer");

    const overlay =
        document.getElementById("cart-overlay");


    if (drawer) {

        drawer.classList.remove("active");

    }


    if (overlay) {

        overlay.classList.remove("active");

    }


    document.body.style.overflow =
        "";

}


/* =====================================================
   CHECKOUT
===================================================== */

async function checkout() {

    if (cart.length === 0) {

        alert(
            "Your cart is empty."
        );

        return;

    }


    const checkoutButton =
        document.getElementById(
            "checkout-button"
        );


    const total =
        getCartTotal();


    if (total <= 0) {

        alert(
            "Invalid cart amount."
        );

        return;

    }


    try {

        /* -------------------------------------------
           DISABLE BUTTON
        ------------------------------------------- */

        if (checkoutButton) {

            checkoutButton.disabled =
                true;

            checkoutButton.textContent =
                "Creating Order...";

        }


        /* -------------------------------------------
           CREATE RAZORPAY ORDER
        ------------------------------------------- */

        const response =
            await fetch(

                `${API_BASE_URL}/api/payment/create-order`,

                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body: JSON.stringify({

                        items: cart,

                        amount: total

                    })

                }

            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(

                data.message ||
                "Unable to create payment order."

            );

        }


        /* -------------------------------------------
           CHECK RAZORPAY SCRIPT
        ------------------------------------------- */

        if (
            typeof Razorpay ===
            "undefined"
        ) {

            throw new Error(
                "Razorpay checkout is not loaded. Add the Razorpay checkout script to mentors.html."
            );

        }


        /* -------------------------------------------
           RAZORPAY OPTIONS
        ------------------------------------------- */

        const options = {

            key: data.key,

            amount: data.amount,

            currency:
                data.currency || "INR",

            name: "RAPTORA",

            description:
                "RAPTORA Mentor Plan",

            order_id:
                data.orderId,


            handler:
                async function(payment) {

                    await verifyPayment(
                        payment
                    );

                },


            theme: {

                color: "#e50914"

            },


            modal: {

                ondismiss:
                    function() {

                        resetCheckoutButton();

                    }

            }

        };


        /* -------------------------------------------
           OPEN RAZORPAY
        ------------------------------------------- */

        const razorpay =
            new Razorpay(options);


        razorpay.on(
            "payment.failed",
            function(response) {

                console.error(
                    "Razorpay payment failed:",
                    response
                );


                alert(
                    "Payment failed. Please try again."
                );


                resetCheckoutButton();

            }
        );


        razorpay.open();

    }


    catch (error) {

        console.error(
            "Checkout error:",
            error
        );


        alert(
            error.message ||
            "Unable to start checkout."
        );


        resetCheckoutButton();

    }

}


/* =====================================================
   VERIFY PAYMENT
===================================================== */

async function verifyPayment(payment) {

    try {

        const response =
            await fetch(

                `${API_BASE_URL}/api/payment/verify`,

                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body: JSON.stringify({

                        razorpay_order_id:
                            payment.razorpay_order_id,

                        razorpay_payment_id:
                            payment.razorpay_payment_id,

                        razorpay_signature:
                            payment.razorpay_signature,

                        items: cart

                    })

                }

            );


        const data =
            await response.json();


        if (!response.ok) {

            throw new Error(

                data.message ||
                "Payment verification failed."

            );

        }


        /* -------------------------------------------
           SUCCESS
        ------------------------------------------- */

        alert(
            "Payment successful! Your mentor plan has been activated."
        );


        /* -------------------------------------------
           CLEAR CART
        ------------------------------------------- */

        cart = [];


        saveCart();

        updateCart();

        closeCart();


    }


    catch (error) {

        console.error(
            "Payment verification error:",
            error
        );


        alert(

            error.message ||
            "Payment verification failed. Please contact RAPTORA support."

        );


        resetCheckoutButton();

    }

}


/* =====================================================
   RESET CHECKOUT BUTTON
===================================================== */

function resetCheckoutButton() {

    const checkoutButton =
        document.getElementById(
            "checkout-button"
        );


    if (!checkoutButton) {
        return;
    }


    checkoutButton.disabled =
        cart.length === 0;


    checkoutButton.textContent =
        "Proceed to Checkout";

}


/* =====================================================
   ESCAPE HTML
===================================================== */

function escapeHTML(value) {

    const div =
        document.createElement(
            "div"
        );


    div.textContent =
        String(value);


    return div.innerHTML;

}


/* =====================================================
   ESC KEY
===================================================== */

document.addEventListener(
    "keydown",
    function(event) {

        if (
            event.key === "Escape"
        ) {

            closeCart();

        }

    }
);


/* =====================================================
   INITIALIZE
===================================================== */

document.addEventListener(
    "DOMContentLoaded",
    function() {

        /*
         * Make sure every old cart item
         * has a valid quantity.
         */

        cart = cart.map(
            item => ({

                ...item,

                price:
                    Number(item.price || 0),

                quantity:
                    Number(item.quantity) > 0
                        ? Number(item.quantity)
                        : 1

            })
        );


        saveCart();

        updateCart();

    }
);

