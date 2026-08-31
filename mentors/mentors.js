
/* =====================================================
   RAPTORA — MENTORS CART
   mentors/mentors.js
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

    const existingItem = cart.find(
        item => item.name === name
    );

    if (existingItem) {

        existingItem.quantity += 1;

    } else {

        cart.push({
            name: name,
            price: Number(price),
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

    cart[index].quantity += 1;

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

    if (cart[index].quantity > 1) {

        cart[index].quantity -= 1;

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
       TOTAL QUANTITY
    ------------------------------------------------ */

    const totalQuantity = cart.reduce(
        (total, item) =>
            total + Number(item.quantity || 1),
        0
    );


    if (cartCount) {

        cartCount.textContent =
            totalQuantity;

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
            cartTotal.textContent = "₹0";
        }

        if (checkoutButton) {
            checkoutButton.disabled = true;
        }

        return;
    }


    /* -----------------------------------------------
       CART ITEMS
    ------------------------------------------------ */

    cartItems.innerHTML = "";

    let total = 0;


    cart.forEach((item, index) => {

        const quantity =
            Number(item.quantity || 1);

        const price =
            Number(item.price);

        const itemTotal =
            price * quantity;

        total += itemTotal;


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


        cartItems.appendChild(itemElement);

    });


    /* -----------------------------------------------
       TOTAL
    ------------------------------------------------ */

    if (cartTotal) {

        cartTotal.textContent =
            "₹" + total.toLocaleString("en-IN");

    }


    /* -----------------------------------------------
       CHECKOUT
    ------------------------------------------------ */

    if (checkoutButton) {

        checkoutButton.disabled = false;

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


    document.body.style.overflow = "hidden";
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


    document.body.style.overflow = "";
}


/* =====================================================
   CHECKOUT
===================================================== */

function checkout() {

    if (cart.length === 0) {
        return;
    }


    const total = cart.reduce(
        (sum, item) =>
            sum +
            Number(item.price) *
            Number(item.quantity || 1),
        0
    );


    console.log(
        "RAPTORA checkout amount:",
        total
    );


    /*
       Razorpay will be connected here.

       The backend will receive:
       - plan
       - quantity
       - total amount

       and create the Razorpay order.
    */

    alert(
        "Razorpay checkout will open here."
    );
}


/* =====================================================
   ESCAPE HTML
===================================================== */

function escapeHTML(value) {

    const div =
        document.createElement("div");

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

        if (event.key === "Escape") {
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
           Fix old cart items that were saved
           before quantity was introduced.
        */

        cart = cart.map(item => ({

            ...item,

            quantity:
                Number(item.quantity) > 0
                    ? Number(item.quantity)
                    : 1

        }));


        saveCart();

        updateCart();

    }
);

