// import prisma ORM
import { PrismaClient } from "../database/generated/prisma/index.js";
const prisma = new PrismaClient();

// import bcrypt
import { hash, compare } from "bcrypt";

//import jwt 
import jwt from "jsonwebtoken";

// import express validator
import { validationResult, body } from "express-validator";

// validation for forms using express validator
const registerValidation = [
    body("username")
        .trim()
        .isAlphanumeric().withMessage("Username can only contain numbers and letters")
        .isLength({ min: 3, max: 15 }).withMessage("Username can only be 3 - 15 characters long")
        .custom(async (username) => { // custom test to check if username is taken
            const usernameExists = await prisma.users.findFirst({
                where: {
                    username,
                },
            });
            // flip boolean to make it so if a user exists i throw error and fail the validation which will trigger the validation err and send a message to the frontend otherwise if the username is not already in use, allow it
            if (usernameExists) {
                throw new Error("Username already exists")
            } else {
                return true;
            };
        }),
    body("password")
        .trim()
        .matches(/^[^\s]+$/).withMessage("Password cannot contain spaces") // this allows letters numbers and symbols but not spaces
        .isLength({ min: 3, max: 20 }).withMessage("Password can only be between 3 and 30 characters long."),
    body("confirmPassword")
        .trim()
        .custom((confirmPassword, { req }) => {
            if (confirmPassword == req.body.password) {
                return true;
            } else {
                return false;
            };
        }).withMessage("Passwords do not match"),
];

const changeUsernameValidation = [
    body("newUsername")
        .trim()
        .isAlphanumeric().withMessage("Username can only contain numbers and letters")
        .isLength({ min: 3, max: 15 }).withMessage("Username can only be 3 - 15 characters long")
        .custom(async (username) => { // custom test to check if username is taken
            const usernameExists = await prisma.users.findFirst({
                where: {
                    username,
                },
            });
            // flip boolean to make it so if a user exists i throw error and fail the validation which will trigger the validation err and send a message to the frontend otherwise if the username is not already in use, allow it
            if (usernameExists) {
                throw new Error("Username already exists")
            } else {
                return true;
            };
        }),
];

async function getFetchChats(req, res, next) {
    const userId = req.user.sub; // get current user id
    let userChats = []; // holds the chats that the user is in - stays in backend
    let chats = []; // holds the chats with only the id of chat and usernames - will send to frontend


    // try to get all the chats of the user and send to frontend
    try {
        userChats = await prisma.chats.findMany({
            where: {
                users: {
                    some: {
                        userId,
                    },
                },
            },
        });

        // check if user has no chats else continue
        if (userChats.length == 0) {
            return res.status(200).json({ msg: "No chats" });
        };

    } catch (err) {
        return res.status(500).json({ err });
    };

    // try to find all the users in each chat that the user is in
    try {
        
        // loop through each chat
        for (let i = 0; i < userChats.length; i++) {

            // find the users in the chat im currently on
            const usersInChat = await prisma.chat_users.findMany({
                where: {
                    chatId: userChats[i].id,
                },
            });

            // get usernames of users that are in this chat and return only the username
            const users = await prisma.users.findMany({
                where: {
                    AND: [
                        {
                            id: {
                                in: usersInChat.map((user) => user.userId),
                            },
                        }, 
                        {
                            id: {
                                notIn: [userId],
                            },
                        },
                    ],
                },  
                select: {
                    username: true,
                },
            });

            // push the chatName along with the list of users in the chat
            chats.push({ chatName: userChats[i].name, users: users.map((user) => user.username) });

        };  

        // all went well
        return res.status(200).json({ msg: "Chats were found", chats })

    } catch (err) {
        return res.status(500).json({ err });
    };
};



async function getFetchMessages(req, res, next) {
    const chatName = req.params.chatName;
    const currentUserId = req.user.sub;
    let chat = [];
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
            return res.status(500).json({ msg: "Could not find a chat with the name provided." });
        };

    } catch (err) {
        return res.status(500).json({ msg: "Error occured whilst trying to find the chat", err });
    };

    // try to fetch all messagesof a chat wiht the chatName provided above
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
            return res.status(200).json({ msg: "Chat has no messages.", chatMessages: [] });
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

        return res.status(200).json({ msg: "Chat has messages.", currentUserMessages, otherUserMessages });
    } catch (err) {
        return res.status(500).json({ err });
    };
};

async function postLogin(req, res, next) {
    const username = req.body.username;
    const password = req.body.password;

    // find user in db with provided username from user
    try {
        const user = await prisma.users.findFirst({
            where: {
                username,
            },
        });

        // check there was a user
        if (!user) {
            return res.status(401).json({ msg: "No user could be found" });
        };

        // a user was found so continue with login process

        // compare passwords
        const match = await compare(password, user.password);

        // password did not match
        if (!match) {
            return res.status(401).json({ msg: "Password is incorrect" });
        };

        // everything was good so issue jwt

        const accessToken = jwt.sign(
            { sub: user.id },
            process.env.JWT_SECRET,
            { expiresIn: "1d" },
        );

        return res.status(200).json({ accessToken });
    } catch (err) {
        return res.status(500).json({ msg: "Error occured whilst checking user details. ", err });
    };

};

const postRegister = [
    registerValidation,
    async (req, res, next) => {

    // get the result of the validation of this route
    const errors = validationResult(req).errors;

    // check if there were any errors, if so it will send them to the frontend and stop
    if (errors.length !== 0) {
        return res.status(400).json({ validationErrors: errors });
    };

    // no validation errors so carry on
    const username = req.body.username;
    const password = req.body.password;

    // check the username existance
    try {
        const alreadyExists = await prisma.users.findFirst({
            where: {
                username,
            },
        });

        // check if username is already existing
        if (alreadyExists) {
            return res.status(409).json({ msg: "Username already exists" });
        };

    } catch (err) {
        return res.status(500).json({ msg: "Error whilst trying to check user existance. ", err });
    };

    // register user
    try {
        // hash password
        const hashedPassword = await hash(password, 10);

        // add user to db
        const newUser = await prisma.users.create({
            data: {
                username,
                password: hashedPassword,
            },
        });

        // check user was registered
        if (!newUser) {
            return res.status(500).json({ msg: "Something went wrong whilst registering user." });

        } else { // all went well 
            return res.status(201).json({ msg: "User was registered successfully"});
        };
    } catch (err) {
        res.status(500).json({ msg: "Error whilst trying to register user.", err });
    };
}];

async function postCreateChat(req, res, next) {

    const usernames = req.body.usernames; // has an array of all usernames 
    const currentUserId = { id: req.user.sub }; // the user making the chat in the form that the prisma query below will be like so i can easily push into the array made below
    let chatUsers = [];
    
    // try to check users exist and add all their id's into an array if they do
    try {
        chatUsers = await prisma.users.findMany({
            where: {
                username: { in: usernames },
            },
            select: {
                id: true,
            },
        });

        // if one or more users doesnt exist
        if (chatUsers.length !== usernames.length) {
            return res.status(400).json({ msg: "One or more of the users could not be found." });
        } else { // all found so add the current user to it
            chatUsers.push(currentUserId)
        };

    } catch (err) {
        return res.status(500).json({ err });
    };

    // try to create a chat and put these users inside of it - updates both tables
    try {
        const createChat = await prisma.chats.create({
            data: {
                users: {
                    create: chatUsers.map(user => ({
                        user: {
                            connect: { id: user.id },
                        },
                    })),
                },
            },
        });

        if (!createChat) {
            return res.status(500).json({ msg: "Could not create chat." });
        };

        // all went well so return success and chat name
        return res.status(201).json({ msg: "Chat was created", chatName: createChat.name });
    } catch (err) {
        return res.status(500).json({ msg: "Error whilst making chat", err })
    };
};

async function postSendMessage(req, res, next) {
    const currentUserId = req.user.sub; // get the user who sent the message
    const message = req.body.message; // the message the user wants to send
    const chatName = req.body.chatName; // the name of the chat
    let currentUser = [];
    let chat = [];

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
            return res.status(401).json({  msg: "Could not find the user who send the message" })
        };
    } catch (err) {
        return res.status(500).json({ err });
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
            return res.status(401).json({ msg: "Could not find the chat the user is in" });
        };
    } catch (err) {
        return res.status(500).json({ err });
    };

    // try to add message to database
    try {
        const addMessage = await prisma.messages.create({
            data: {
                message_content: message,
                username: currentUser.username,
                chatId: chat.id,
                userId: currentUserId,
            }
        });

        if (!addMessage) {
            return res.status(500).json({ msg: "Something went wrong when trying to send message" });
        };
    } catch (err) {
        return res.status(500).json({ err });
    };
};  

const postChangeUsername = [
    changeUsernameValidation,
    async (req, res, next) => {

        const errors = validationResult(req);

        if (!errors.isEmpty()) {
            return res.status(409).json({ msg: errors.array() });
        };

        const newUsername = req.body.newUsername;
        const userId = req.user.sub;
    
        // try to change username in db
        try {
            const findUser = await prisma.users.update({
                where: {
                    id: userId,
                },
                data: {
                    username: newUsername,
                },
            });

            if (!findUser) {
                return res.status(500).json({ msg: "Could not find user in database" });
            };

            return res.status(201).json({ msg: [{ msg: "Username changed" }] });
        } catch (err) {
            return res.status(500).json({ err });
        };
    },
];

async function postDeleteAccount(req, res, next) {

    // -- NOTE -- //
    // This is just a soft delete
    // I just rename the user to "deleted"
    // and change password to a hashed one 
    // this then keeps all chats working and allows the chats to be preserved

    const userId = req.user.sub;
    const username = req.body.username;
    const deletedUsername = "deleted";
    const newPassword = await hash(process.env.DELETED_ACCOUNT_PASSWORD_HASHER, 10);
    
    //try to delete user from users table (rename them and edit password)
    try {
        const updateUser = await prisma.users.update({
            where: {
                id: userId,
            },
            data: {
                username: deletedUsername,
                password: newPassword,
            },
        });

        // check it worked
        if (!updateUser) {
            return res.status(404).json({ msg: "User could not be deleted"} );
        };

    } catch (err) {
        return res.status(500).json({ err });
    };

    // try to edit the stored username in messages table
    try {
        const updateMessages = await prisma.messages.updateMany({
            where: {
                username,
            },
            data: {
                username: deletedUsername,
            },
        });

        // check it worked
        if (!updateMessages) {
            return res.status(404).json({ msg: "User could not be deleted" });
        };

        return res.status(200).json({ msg: "Account has been deleted" });
    } catch (err) {
        return res.status(500).json({ err });
    }
};


export {
    getFetchChats,
    getFetchMessages,
    postLogin,
    postRegister,
    postCreateChat,
    postSendMessage,
    postChangeUsername,
    postDeleteAccount,
}