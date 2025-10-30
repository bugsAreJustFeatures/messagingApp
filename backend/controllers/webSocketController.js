// import prisma ORM
import { PrismaClient } from "../database/generated/prisma/index.js";
const prisma = new PrismaClient();

import jwt from "jsonwebtoken"; // import jwt

async function fetchMessages(data) {
    const chatName = data.chatName; // extract the chatName
    const mainJwt = data.mainJwt; // extract the main jwt
    let currentUserId; // id of user that is fetching the messages
    let chat = []; // holds data about the chat

    // decode the jwt and extract the id of the user (stored as sub in jwt)
    jwt.verify(mainJwt, process.env.JWT_SECRET, async (err, user) => {
        if (err) { // invalid jwt
            return err;
        } else {
            currentUserId = user.sub;
        };
    });

    // try to find the chatId of a chat wiht the chatName provided above
    try {
        chat = await prisma.chats.findFirst({
            where: {
                name: chatName,
            },
            select: {
                id: true,
            },
        });

        // check it exists
        if (chat.length == 0) {
            return null;
        };

    } catch (err) {
        console.error("Unexpected error: ", err);
        return err;
    };

    // try to fetch all messages of chat with the chatName provided above
    try {
        const chatMessages = await prisma.messages.findMany({
            where: {
                chatId: chat.id,
            },
            orderBy: {
                creation_time: "asc",
            },
        });

        // check if theres any messages
        if (chatMessages.length == 0) {
            return chatMessages;
        };

        // there are messages so split currentUser and other user chats up to display on frontend properly
        const currentUserMessages = [];
        const otherUserMessages = [];

        chatMessages.map((msg) => {
            if (msg.userId == currentUserId) { // is a currentUser message
                currentUserMessages.push({
                    username: msg.username,
                    message: msg.message_content,
                    creation: msg.creation_time, 
                });
            } else { // another user made this message
                otherUserMessages.push({
                    username: msg.username,
                    message: msg.message_content,
                    creation: msg.creation_time, 
                });
            };
        });

        return {
            currentUserMessages,
            otherUserMessages,
        };

    } catch (err) {
        console.error(err);
        return err;
    };
};

async function sendMessage(data) {
    const chatName = data.chatName; // extract the chatName
    const mainJwt = data.mainJwt; // extract the main jwt
    let currentUserId; // id of user that is fetching the messages
    let currentUser = []; // holds data about user
    let chat = []; // holds data about the chat

    // decode the jwt and extract the id of the user (stored as sub in jwt)
    jwt.verify(mainJwt, process.env.JWT_SECRET, async (err, user) => {
        if (err) { // invalid jwt
            return err;
        } else {
            currentUserId = user.sub;
        };
    });

    // try to find username of currentUser
    try {
        currentUser = await prisma.users.findFirst({
            where: {
                id: currentUserId,
            },
            select: {
                username: true,
            },
        });

        // check if the user was found
        if (currentUser.length == 0) {
            return currentUser;
        };
    } catch (err) {
        console.error(err);
        return err;
    };

    // try to find the chat and get the chatId
    try {
        chat = await prisma.chats.findFirst({
            where: {
                name: chatName,
            },
            select: {
                id: true,
            },
        });

        if (chat.length == 0) {
            return chat;
        };
    } catch (err) {
        console.error(err);
        return err;
    };

    // try to add message to database
    try {

        const addMessage = await prisma.messages.create({
            data: {
                message_content: data.message,
                username: currentUser.username,
                chatId: chat.id,
                userId: currentUserId,
            },
        });

        if (!addMessage) {
            return null;
        };

        // went well
        return {
            msg: addMessage.message_content,
            success: true,
        };
    } catch (err) {
        console.error(err);
        return err;

    };
};

function joinChat (socket, chatName) {
    socket.join(chatName); // join the chat with the chatName as the room name
    // console.log(`${socket.id} joined room ${chatName}`); // used to debug
};

async function fetchMessagesFunc (socket, data) {
    const result = await fetchMessages(data); // get the new messages
    if (!result) {
      console.error("could not fetch messages");
      return null; // something went wrong
    };
    
    socket.emit("foundMessages", result); // have found the messages so emit to listeners
};

async function sendMessageFunc(data) {
    const result = await sendMessage(data); // store message in db
    if (!result.success) { // something went wrong when trying to send message
      console.error("could not send message");
      return {
        success: false,
      };
    } else {
        return {
            success: true,
        };
    };
};

function disconnect () { // only use to debug
    // console.log("User disconnected: ", socket.id);
};

export {
    fetchMessages, 
    sendMessage,
    joinChat,
    fetchMessagesFunc,
    sendMessageFunc,
    disconnect,
};



