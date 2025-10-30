import { useState } from "react";
import { useNavigate } from "react-router-dom";

import styles from "./RegisterPage.module.css"

const api = `${import.meta.env.VITE_API_PROXY}/api`;


export default function RegisterPage() {

    const [validationErrors, setValidationErrors] = useState([]); // holds the errors from the register form after checking in the backend

    const navigate = useNavigate();

    async function handleRegisterForm(e) {
        // prevent default form behaviour
        e.preventDefault();

        const username = e.target.registerUsername.value;
        const password = e.target.registerPassword.value;
        const confirmPassword = e.target.registerConfirmPassword.value;

        try {
            const response = await fetch(`${api}/register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",

                },
                body: JSON.stringify({
                    username,
                    password,
                    confirmPassword,
                }),
            });

            // something went wrong
            if (!response.ok) {
                // read response
                const data = await response.json();
                // the form was not filled out correctly
                if (data.validationErrors) {
                    setValidationErrors(data.validationErrors);
                    return;
                } else {
                    // unknown error internally
                    // console.error("Could not register user, issue with API!");
                };
            };

            // user was registered so send them to login page
            navigate("/login")
        } catch (err) {
            // console.error("Unknown error when registering new user: ", err);
        };
    };

    return (
        <div className="pageWrapper">
            <div id={styles.registerContentWrapper}>

                <h2>Register</h2>

                {validationErrors && (
                    <div id={styles.validationErrorWrapper}>
                        <ul id={styles.validationErrorListWrapper}>
                            {validationErrors.map((err, index) => (
                                <li key={index} id={styles.validationMessageWrapper}>
                                    <p>{err.msg}</p>
                                </li>
                                ))
                            }
                        </ul>
                    </div>
                )}
                                
                <div id={styles.registerFormWrapper}>
                    <form onSubmit={(e) => handleRegisterForm(e)}>
                        <label htmlFor="registerUsername">Username:</label>
                        <input type="text" name="registerUsername" id={styles.registerUsername} required placeholder="required" defaultValue={"abc"}/>

                        <label htmlFor="registerPassword">Enter A Password:</label>
                        <input type="password" name="registerPassword" id={styles.registerPassword} required placeholder="required" defaultValue={"abc"}/>

                        <label htmlFor="registerConfirmPassword">Confirm Password:</label>
                        <input type="password" name="registerConfirmPassword" id={styles.registerConfirmPassword} required placeholder="required" defaultValue={"abc"}/>

                        <button type="submit">Create Account</button>
                    </form>
                </div>
            </div>
        </div>
    )
};