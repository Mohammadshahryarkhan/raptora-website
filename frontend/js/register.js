/* ==========================================
   RAPTORA REGISTER
========================================== */

document
    .getElementById("registerForm")
    .addEventListener("submit", async function (e) {

        e.preventDefault();


        /* ===========================
           GET FORM VALUES
        ============================ */

        const name =
            document.getElementById("name").value.trim();

        const username =
            document.getElementById("username").value.trim();

        const email =
            document.getElementById("email").value.trim();

        const phone =
            document.getElementById("phone").value.trim();

        const password =
            document.getElementById("password").value;

        const confirmPassword =
            document.getElementById("confirmPassword").value;

        const referralCode =
            document.getElementById("referralCode").value.trim();

        const terms =
            document.getElementById("terms");


        /* ===========================
           CHECK PASSWORD
        ============================ */

        if (password !== confirmPassword) {

            alert("Passwords do not match.");

            return;

        }


        /* ===========================
           CHECK TERMS
        ============================ */

        if (!terms.checked) {

            alert(
                "Please agree to the Terms & Conditions before creating your account."
            );

            return;

        }


        /* ===========================
           SEND REGISTRATION
        ============================ */

        try {

            const response = await fetch(
                "https://raptora-website.onrender.com/api/auth/register",
                {

                    method: "POST",

                    headers: {

                        "Content-Type":
                            "application/json"

                    },

                    body: JSON.stringify({

                        name: name,

                        username: username,

                        email: email,

                        phone: phone,

                        password: password,

                        referralCode: referralCode || null

                    })

                }
            );


            const data =
                await response.json();


            /* ===========================
               SERVER RESPONSE
            ============================ */

            alert(
                data.message ||
                "Registration completed."
            );


            /* ===========================
               SUCCESS
            ============================ */

            if (response.ok) {

                window.location.href =
                    "login.html";

            }

        }

        catch (error) {

            console.error(
                "Registration error:",
                error
            );

            alert(
                "Unable to connect to the server. Please try again."
            );

        }

    });
