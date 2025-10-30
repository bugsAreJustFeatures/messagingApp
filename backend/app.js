// allow use of enironment variables through dotenv 
import { config } from "dotenv";
config({ path: "./database/.env" }); // path to the env file

// library/file imports
import express from "express"; // import express server
import cors from "cors"; // import cors
import { createServer } from "http"; // needed for socket.io
import { Server } from "socket.io"; // this is the server that creates the persistant connection
import router from "./routes/routes.js"; // import routes
import { fetchMessagesFunc, joinChat, sendMessageFunc } from "./controllers/webSocketController.js"; // import functions that deal with web sockets

// variable declaration
const PORT = process.env.PORT || 3000; // choose between either the env.PORT or localhost:3000
const app = express(); // initialise the server in express
const httpServer = createServer(app) // wrap express with HTTP server
const frontendUrl = 'https://messaging-app-exi.pages.dev';

// attach socket.io to HTTP server and allow listening
const io = new Server(httpServer, {
  cors: {
    origin: frontendUrl, // match react (frontend) port
    methods: ["GET", "POST"], // limit the methods allowed
    credentials: true,
  },
});  

// handle socket connections
io.on("connection", (socket) => {
  // listens for emits for joinChat - when a user opens a chat
  socket.on("joinChat", ({chatName}) => {
    joinChat(socket, chatName);
  });

  // listens for emits for fetchMessgaes - this happens on mount and after sending message
  socket.on("fetchMessages", (data) => {
    fetchMessagesFunc(socket, data);
  });

  // listen for sending messages
  socket.on("sendMessage", async (data) => {
    const result = await sendMessageFunc(data); // await for the send message function to occur
    if (!result) {
      console.error("Could not send message"); // something went wrong
      return;
    } else {
      // this emits to the room and everyone in it to refetch messages after someone sent one
      io.to(data.chatName).emit("fetchNewMessages");
    }
  });

  // debug
  socket.on("disconnect", () => {
    console.log("socket disconnection")
  })

});

// --Express middleware-- //
// allow cors
app.use(cors({
    origin: frontendUrl,
    credentials: true,
}));

//allow json reading across routes and between frontend and backend such as through forms
app.use(express.json());

// tell express where to find routes and what to append the routes onto
app.use("/api", router);

// get correct port number for server to listen for requests
httpServer.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});