import { useEffect, useState } from "react";
import { Outlet, Link, useLocation } from "react-router-dom";

import styles from "./Header.module.css";
import icon from "../assets/chat-bubble.png";

const api = `${import.meta.env.VITE_API_PROXY}/api`;


export default function Header() {

    // state variables 
    const [loggedIn, setLoggedIn] = useState(false); // to know what links to show 
    const [username, setUsername] = useState(null); // holds the users database to show when theyre logged in

    // global component variables
    const location = useLocation();

    useEffect(() => {
        async function checkAuth() {
            try {
                const response = await fetch(`${api}/checkAuth`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${localStorage.getItem("main")}`,
                    },
                });

                // check response

                const data = await response.json();
                // user is logged in
                if (response.status == 200) {

                    setUsername(data.username); // update state with username
                    setLoggedIn(true);

                } else if (response.status == 401 || response.status == 403) { // user is not logged in
                    setLoggedIn(false);

                } else { // an error occured
                    setLoggedIn(false);
                    console.error("Something went wrong whilst checking user credentials.");

                };
            } catch (err) {
                throw new Error("Unexpected error occured: ", err);
            };
        };

        checkAuth();
    }, [location]);

    return (
        <>
            <div id={styles.wrapper}>
                <div id={styles.logoAndName}>

                    <div id={styles.logoWrapper}>
                        <img alt="brand logo" src={icon} id={styles.headerLogo} />
                    </div>

                    <div id={styles.logoNameWrapper}>
                        <Link to={"/"} id={styles.logoName} className={styles.headerLinks}>ouiMessage</Link>
                    </div>

                    
                    
                </div>

                <div id={styles.links}>
                    {loggedIn ? (
                        <>
                            <Link to={"/my-chats"} className={styles.headerLinks}>My Chats</Link>
                            <Link to={`/users/${username}`} className={styles.headerLinks}>{username}</Link>
                            <Link to={"/logout"} className={styles.headerLinks}>Logout</Link>
                            
                            <Link to={"/settings"} className={styles.headerLinks}>Settings</Link>
                        </>
                        
                    ) : (
                        <>
                            <Link to={"/login"} className={styles.headerLinks}>Login</Link> 
                            <Link to={"/register"} className={styles.headerLinks}>Register</Link> 
                        </>
                        
                    )} 
                        <Link to={"/contact"} className={styles.headerLinks}>Contact Us</Link>
                </div>

            </div>

            <Outlet/>

        </>
        
    );
};