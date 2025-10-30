

import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";

import styles from "./ProfilePage.module.css";

const api = `${import.meta.env.VITE_API_PROXY}/api`;


export default function ProfilePage() {

    // state variables
    const [changeUsernameMessage, setChangeUsernameMessages] = useState(null); // tell user the outcome of their request

    //global variables / hooks
    const navigate = useNavigate();
    const params = useParams();

    useEffect(() => {
        async function checkAuth() {
            const response = await fetch(`${api}/checkAuth`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "authorization": `Bearer ${localStorage.getItem("main")}`,
                },
            });

            // check response
            if (!response.ok) { // if response was not good (user is not signed in) then send to login page else continue 
                navigate("/login");
            };
        };

        checkAuth();
    }, []);

    useEffect(() => {
        async function fetchProfilePicture() {

        };

        fetchProfilePicture();
    }, []);

    async function handleChangeUsernameForm(e) {
        // prevent default form behaviour
        e.preventDefault();

        const newUsername = e.target.newUsernameInput.value;

        // try to changeUsername
        try {
            const response = await fetch(`${api}/changeUsername`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("main")}`,
                },
                body: JSON.stringify({
                    newUsername
                }),
            });

            // check response
            const data = await response.json();

            if (!response.ok) {
                console.error("API Error")
                setChangeUsernameMessages(data.msg);
            };

            // success
            setChangeUsernameMessages(data.msg);
        } catch (err) {
            console.error("Unexpected Error: ", err);
        };
    };
    
    async function handleDeleteProfileForm(e) {
        // prevent default form behaviour
        e.preventDefault();

        const username = params.username;

        // try to delete account
        try {
            const response = await fetch(`${api}/deleteAccount`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${localStorage.getItem("main")}`,
                },
                body: JSON.stringify({
                    username,
                }),
            });

            // check response
            if (!response.ok) {
                console.error("Could not delete account");
            };

            // remove jwt and other credentials to unauthorise user
            navigate("/logout");
        } catch (err) {
            console.error("Unexpected Error: ", err);
        };
    };

    return (
        <div className="pageWrapper">
            <div id={styles.profilePageWrapper}>

                <div id={styles.profilePictureSection}>

                    <div id={styles.profilePictureWrapper}>
                        <img alt="profile picture" />
                    </div>

                    <div id={styles.changeUsernameSection}>

                        {changeUsernameMessage && (
                            <ul>
                                {changeUsernameMessage.map((result) => (
                                    <div>
                                        {result.msg}
                                    </div>
                                ))}
                            </ul>
                        )}

                        <form onSubmit={(e) => handleChangeUsernameForm(e)} id={styles.changeUsernameForm}>
                            <label htmlFor="newUsernameInput">Enter a New Username:</label>
                            <input type="text" name="newUsernameInput" id={styles.newUsernameInput} required />

                            <button type="submit">Update Username</button>
                        </form>
                    </div>

                    <div id={styles.deleteProfileSection}>

                        <h2>DANGER</h2>

                        <form onSubmit={(e) => handleDeleteProfileForm(e)} id={styles.deleteProfileForm}>
                            <button type="submit">Delete Account</button>
                        </form>
                    </div>
                </div>
            </div>
        </div>
    )
};