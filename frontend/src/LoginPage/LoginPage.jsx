import { useNavigate } from "react-router-dom";

import styles from "./LoginPage.module.css"
import { useState } from "react";

const api = `${import.meta.env.VITE_API_PROXY}/api`;


export default function LoginPage() {

    // state variables
    const [formError, setFormError] = useState(false); // check user has filled out form correctly

    const navigate = useNavigate();

    async function handleLoginForm(e) {
        // prevent default form behaviour
        e.preventDefault();

        const username = e.target.loginUsername.value;
        const password = e.target.loginPassword.value;

        try {
            const response = await fetch(`${api}/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    username,
                    password,
                }),
            });

            // check response
            if (!response.ok) {

                if (response.status == 401) { // user is unauthorized - wrong password or username
                setFormError(true);
            };
            } else { // all was good
                // read response and get jwt to store in local storage
                const data = await response.json();
                localStorage.setItem("main", data.accessToken);

                // send user to home page
                navigate("/");
            };

        } catch (err) {
            // console.error("Unknown error occured when trying to log user in: ", err);
        };
    };

    return (

        <div className="pageWrapper">
            <div id={styles.registerContentWrapper}>
                {formError && (
                    <div id={styles.formErrorWrapper}>
                        <ul>
                            <li>
                                <p>
                                    Username or password was incorrect
                                </p>
                            </li>
                        </ul>
                    </div>
                )}

                <div id={styles.loginFormWrapper}>
                    <h2>Login</h2>
                    <form onSubmit={(e) => handleLoginForm(e)}> 
                        <label htmlFor="loginUsername">Username:</label>
                        <input type="text" name="loginUsername" id={styles.loginUsername} required />

                        <label htmlFor="loginPassword">Password:</label>
                        <input type="password" name="loginPassword" id={styles.loginPassword} required />  
                        
                        <button type="submit">Login</button>
                    </form>
                </div>
            </div>
        </div>
    )
};