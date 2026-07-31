document.getElementById("loginForm").addEventListener("submit", async function(e) {

    e.preventDefault();

    const email = document.getElementById("email").value.trim();

    const password = document.getElementById("password").value;


    try {

        const response = await fetch(
            "https://raptora-website-1.onrender.com/api/auth/login",
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    email: email,
                    password: password
                })
            }
        );


        const data = await response.json();


        console.log("Server Response:", data);


        if (response.ok) {

            localStorage.setItem("token", data.token);

            localStorage.setItem("name", data.name);

            localStorage.setItem("email", data.email);

            localStorage.setItem("phone", data.phone);


            alert("Login Successful");


            window.location.href = "dashboard.html";

        }

        else {

            alert(data.message || "Login Failed");

        }


    } catch(error) {

        console.log("Error:", error);

        alert("Backend connection failed.");

    }

});
