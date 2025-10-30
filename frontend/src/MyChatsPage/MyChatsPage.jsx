import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";

import styles from "./MyChatsPage.module.css";

const api = `${import.meta.env.VITE_API_PROXY}/api`;


export default function MyChatsPage() {

    // state variables
    const [loggedIn, setLoggedin] = useState(false); // whether user is signed in or not
    const [chats, setChats] = useState([]); // holds the user's chats
    const [isInputBox, setIsInputBox] = useState(false); // whether to show createe chat button or not
    const [chatMembers, setChatMembers] = useState(0); // amount of users are in the chat that is being made (if it is)

    // global component variables
    const navigate = useNavigate();

    // use effect that checks to see the status of the user on mount
    useEffect(() => {
        async function checkAuth() {
            try {
                const response = await fetch(`${api}/checkAuth`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${localStorage.getItem("main")}`
                    },
                });

                // user has a jwt that is valid so they are already logged in
                if (response.status == 200) {
                    setLoggedin(true);
                };
                
                if (!response.ok) {
                   if (response.status == 403) { // invalid jwt so send to login since they have logged in before
                        navigate("/login")
    
                    } else if (response.status == 401) {// no jwt so send to register page since they dont have a jwt and likely havent made an account yet
                        navigate("/register")

                    } else {
                        console.error("Unknown error occured");
                        return;
                    };
                };

            } catch (err) {
                throw new Error("Something went wrong: ", err);
            };
        };

        async function fetchChats() {
            try {
                const response = await fetch(`${api}/fetchChats`, {
                    method: "GET",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${localStorage.getItem("main")}`,
                    },
                });

                // read response
                const data = await response.json();
                
                if (!response.ok) {
                    console.error("Could not fetch chats");
                };
                //update state with fetched chats
                setChats(data.chats);

            } catch (err) {
                throw new Error(err);
            };
        };

        checkAuth();
        fetchChats();
    }, []);

    async function handleCreateChat(e) {
            // prevent default form
            e.preventDefault();

            // holds all usernames
            let usernames = [];
    
            // loop through all the input boxes that the user has made  
            for (let i = 0; i < chatMembers; i++) {
                const currentUsername = document.getElementsByClassName(styles.addUserInput)[i].value; // get the value of each input
                usernames.push(currentUsername); // push the usernames together
            };

            // reset number of members in chat
            setChatMembers(0);

            try {
                const response = await fetch(`${api}/createChat`, {
                    method: "POST",
                    headers: {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${localStorage.getItem("main")}`,
                    },
                    body: JSON.stringify({
                        usernames,
                    }),
                });
    
                // check response
    
                //read response
                const data = await response.json();
    
                // check response was ok
                if (!response.ok) {
                    console.error("Something went wrong with API response");
                    return;
                };
    
                // chat was made so take user to it
                navigate(`/my-chats/${data.chatName}`);
            } catch (err) {
                
                throw new Error(err);
            };
        };


    async function handleAddUser(e) {
        // prevent default form behaviour
        e.preventDefault();

        // get the parent form where i want to append the input field
        const parentForm = e.target.parentElement;

        // create label for input field
        const addUserLabel = document.createElement("label");
        addUserLabel.innerHTML = "Add User:";
        addUserLabel.id = styles.addUserLabel;
        addUserLabel.htmlFor = "addUserInput";
        parentForm.appendChild(addUserLabel);   
        
        // create input field and append it into the parent form
        const addUserInput = document.createElement("input");
        addUserInput.type = "text";
        addUserInput.name = "addUserInput";
        addUserInput.className = styles.addUserInput;
        parentForm.appendChild(addUserInput);

        // update state to show "create chat" button and update amount of users in the chat
        setIsInputBox(true);
        setChatMembers(current => current + 1);
    };

    return (
        <div className="pageWrapper">
            <div id={styles.myChatsWrapper}>
                {loggedIn && (
                    <div id={styles.loggedInWrapper}>

                        <div id={styles.createChatWrapper}>

                            <form onSubmit={(e) => {handleCreateChat(e)}} id={styles.createChatForm}>
                                
                                <div id={styles.addUserInputContainer}>
                                    <button onClick={(e) => {handleAddUser(e)}}>Add a User</button>
                                </div>

                                {isInputBox && (
                                    <button type="submit">Start chatting</button>
                                )}
                            </form>
                        </div>

                        {chats && (
                            <div id={styles.chatListWrapper}>
                                {chats.map((chat, index) => (
                                    <div key={index} className={`styles.chatWrapper`}> 
                                        <Link to={`/my-chats/${chat.chatName}`}>
                                            {chat.users}
                                        </Link>

                                    </div>
                                ))}
                            </div>
                        )}

                    </div>
                )}
            </div>
        </div>
    );
};