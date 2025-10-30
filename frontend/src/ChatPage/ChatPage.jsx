import { useParams, useNavigate } from "react-router-dom";
import { useEffect, useState, useRef } from "react";
import { io } from "socket.io-client";

const base = import.meta.env.VITE_API_PROXY; // this is the backend base uri that is between api and client, used by web socket
const api = `${import.meta.env.VITE_API_PROXY}/api`; //  this is api uri used for fetching 
const socket = io(base, {
    transports: ["websocket"],
    withCredentials: true,
    reconnectionAttempts: 3,
    autoConnect: true,
});

// CSS Note //
//global css, define by className or id = "myClassOrId", this is from the import of App.css in the App.jsx and is passed down
import styles from "./ChatPage.module.css"; // module css, define with jsx object syntax classNmae or id = {styles.myClassOrId}

export default function ChatPage() {

    // state variables
    const [username, setUsername] = useState(null); //holds the currentUsers username
    const [currentUserMessages, setCurrentUserMessages] = useState([]) // holds all messages of the current user
    const [otherUserMessages, setOtherUserMessages] = useState([])// holds all messages from the other users
    const [messages, setMessages] = useState([]); // holds the final messages after sorting

    // ref variables go here
    const chatsRef = useRef(null); // lets me hold a reference of all the chats to know when to automatically put user onto the latest message (bottom of div)

    // global variables
    const params = useParams(); // get the chat name from react route param in react router url
    const navigate = useNavigate(); // send user to other routes

    // useEffect to check user is authenticated
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

                    // user has a jwt that is valid
                    if (response.status == 200) {
                        const data = await response.json();
                        setUsername(data.username);
                    };
                    
                    if (!response.ok) {
                        if (response.status == 403) { // invalid jwt so send to login since they have logged in before
                            navigate("/login");
        
                        } else if (response.status == 401) {// no jwt so send to register page since they dont have a jwt and likely havent made an account yet
                            navigate("/register");

                        } else {
                            console.error("Unknown error occured");
                            return;

                        };
                    };

                } catch (err) {
                    throw new Error("Something went wrong: ", err);
                };
            };

        checkAuth();
    }, []);

    // useEffect for connecting to socket
    useEffect(() => {
        socket.connect();

        socket.on("connect", () => {
            socket.emit("joinChat", { chatName: params.chatName });

                socket.emit("fetchMessages", {
                    chatName: params.chatName,
                    mainJwt: `${localStorage.getItem("main")}`,
                });
        });

        socket.on("foundMessages", (result) => {
            setCurrentUserMessages(result.currentUserMessages);
            setOtherUserMessages(result.otherUserMessages);
        });

        socket.on("fetchNewMessages", () => {
                socket.emit("fetchMessages", {
                    chatName: params.chatName,
                    mainJwt: `${localStorage.getItem("main")}`,
                });

                socket.on("foundMessages", (result) => {
                    setCurrentUserMessages(result.currentUserMessages);
                    setOtherUserMessages(result.otherUserMessages);
                });
        });

        return () => {
            socket.disconnect();
        }
    }, []);

    // useEffect for things that should happen on mount and when certain states change
    useEffect(() => {
        function displayChatMessages() {
            let otherUserIndex = 0; // counter to use for the index of display other user messages
            let currentUserIndex = 0;// counter to use for the index of display current user messages
            let results = []; // holds all the divs that i will then map through and display in jsx

            // while loop through the messages until every one has been displayed
            if (otherUserMessages || currentUserMessages) { // check that messages have been fetched
                while (otherUserIndex < otherUserMessages.length || currentUserIndex < currentUserMessages.length) {
                    
                    // check what message is older    
                    // check if either has reached the end of their messages
                    if (!currentUserMessages[currentUserIndex]) {
                        results.push(
                            <div className={styles.otherUserMessage}>
                                <div className={styles.messageCreationTime}>
                                    {otherUserMessages[otherUserIndex].creation}
                                </div>

                                <div className={styles.messageUsername}>
                                    {otherUserMessages[otherUserIndex].username}

                                </div>

                                <div className={styles.messageContent}>
                                    {otherUserMessages[otherUserIndex].message}

                                </div>
                            </div>
                        );
                        otherUserIndex++;
    
                    } else if (!otherUserMessages[otherUserIndex]) {
                        results.push(
                            <div className={styles.currentUserMessage}>
                                <div className={styles.messageCreationTime}>
                                    {currentUserMessages[currentUserIndex].creation}
                                </div>

                                <div className={styles.messageUsername}>
                                    You
                                </div>

                                <div className={styles.messageContent}>
                                    {currentUserMessages[currentUserIndex].message}

                                </div>
                            </div>
                        );
                        currentUserIndex++;
    
                    } else if (otherUserMessages[otherUserIndex].creation < currentUserMessages[currentUserIndex].creation) {// they both have messages left so check what ones are oldest
                        results.push(
                            <div className={styles.otherUserMessage}>
                                <div className={styles.messageCreationTime}>
                                    {otherUserMessages[otherUserIndex].creation}
                                </div>

                                <div className={styles.messageUsername}>
                                    {otherUserMessages[otherUserIndex].username}

                                </div>

                                <div className={styles.messageContent}>
                                    {otherUserMessages[otherUserIndex].message}

                                </div>
                            </div>
                        );
                        otherUserIndex++;
    
                    } else if (otherUserMessages[otherUserIndex].creation > currentUserMessages[currentUserIndex].creation) { // either currentUser's message is older or no other user has sent anymore messages
                        results.push(
                            <div className={styles.currentUserMessage}>
                                <div className={styles.messageCreationTime}>
                                    {currentUserMessages[currentUserIndex].creation}
                                </div>

                                <div className={styles.messageUsername}>
                                    You

                                </div>

                                <div className={styles.messageContent}>
                                    {currentUserMessages[currentUserIndex].message}

                                </div>
                            </div>
                        );
                        currentUserIndex++;
                    };
                };

                setMessages(results);
            };
        };

        displayChatMessages();
    }, [otherUserMessages, currentUserMessages])

    // useEffect that scrolls chat to latest message
    useEffect(() => {
        function goToLatestChat() {
            const chats = chatsRef.current; // set it to the DOM element

            // check if there is a DOM element, basically just checks if there are any chats
            if (chats) {
                chats.scrollTop = chats.scrollHeight;
            };
        };

        goToLatestChat();
    }, [messages])

    async function handleSendMessage(e) {
        // prevent default form 
        e.preventDefault();
        const message = e.target.sendMessageInput.value; // get message that user wants to send

        // create message object 
        const data = {
            message,
            chatName: params.chatName,
            creation: new Date().toISOString(),
            username: username,
            mainJwt: `${localStorage.getItem("main")}`,
        };

        // send the message with the data
        socket.emit("sendMessage", data);
        e.target.sendMessageInput.value = ""; // clear input box after sending message
    };

    return (
        <div className="pageWrapper">
            <div id={styles.chatWrapper}>
                <div id={styles.chatMessagesWrapper} ref={chatsRef}>
                    {messages && messages.map((msg, index) => (
                        <div className={styles.chatMessages} key={index}>
                            {msg}
                        </div>
                    ))}
                </div>

                <div id={styles.sendMessageFormWrapper}>
                    <form onSubmit={(e) => {handleSendMessage(e)}} id={styles.sendMessageForm}>
                        <input type="text" name="sendMessageInput" id={styles.sendMessageInput} placeholder="Send Message" required />

                        <button type="submit" id={styles.sendMessageButton}>
                            <p>&#10148;</p>
                        </button>
                    </form>
                </div>
            </div>

        </div>
    )
};