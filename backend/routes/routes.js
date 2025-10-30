import { Router } from "express";
const router = Router();

import { getFetchChats, getFetchMessages, postCreateChat, postLogin, postRegister, postSendMessage, postChangeUsername, postDeleteAccount } from "../controllers/routesController.js";

import { checkJwtMiddleware, checkJwtRouteHandler } from "../controllers/jwtController.js";

router.get("/fetchChats", checkJwtMiddleware, getFetchChats);

router.get("/fetchMessages/:chatName", checkJwtMiddleware, getFetchMessages);

router.post("/login", postLogin);

router.post("/register", postRegister);

router.post("/checkAuth", checkJwtRouteHandler);

router.post("/createChat", checkJwtMiddleware, postCreateChat);

router.post("/sendMessage", checkJwtMiddleware, postSendMessage);

router.post("/changeUsername", checkJwtMiddleware, postChangeUsername);

router.post("/deleteAccount", checkJwtMiddleware, postDeleteAccount);

export default router;