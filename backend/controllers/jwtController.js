import { PrismaClient } from "../database/generated/prisma/index.js";
const prisma = new PrismaClient();

import jwt from "jsonwebtoken";

// this calls next() so is used as midddleware
function checkJwtMiddleware(req, res, next) {

    const bearerToken = req.headers.authorization; // get the authorization header

    // check the header is there
    if (bearerToken) {
        const token = bearerToken.split(" ")[1]; // get the jwt from the bearer token in header
    
        // decrypt the token to check its valid
        jwt.verify(token, process.env.JWT_SECRET, async (err, user) => {
            // jwt was invalid 
            if (err) {
                return res.status(403).json({ msg: "JWT was invalid" });
            };
    
            // valid jwt - find user in db and send to frontend
            try {
                const findUser = await prisma.users.findFirst({
                    where: {
                        id: user.id,
                    },
                });

                // check that user was found
                if (!findUser) {
                    return res.status(401).json({ msg: "No user could be found and authenticated" });
                };

                // found user
                req.user = user;
                next();
                
            } catch (err) {
                return res.status(500).json({ err });
            };
        });
    } else {
        // no jwt 
        return res.status(401).json({ msg: "No JWT could be found" });
    };
};

// this send a response to frontend so is a route handler
function checkJwtRouteHandler(req, res, next) {

    const bearerToken = req.headers.authorization; // get the authorization header

    // check the header is there
    if (bearerToken) {
        const token = bearerToken.split(" ")[1]; // get the jwt from the bearer token in header
    
        // decrypt the token to check its valid
        jwt.verify(token, process.env.JWT_SECRET, async (err, user) => {
            // jwt was invalid 
            if (err) {
                return res.status(403).json({ msg: "JWT was invalid" });
            };
    
            // valid jwt - find user in db and send to frontend
            try {
                const findUser = await prisma.users.findFirst({
                    where: {
                        id: user.sub,
                    },
                    select: {
                        username: true,
                    },
                });
                // check that user was found
                if (!findUser) {
                    return res.status(401).json({ msg: "No user could be found and authenticated" });
                };

                // found user
                return res.status(200).json({ msg: "Valid Jwt", username: findUser.username });                
                
            } catch (err) {
                return res.status(500).json({ err });
            };
        });
    } else {
        // no jwt 
        return res.status(401).json({ msg: "No JWT could be found" });
    };
};

export {
    checkJwtMiddleware,
    checkJwtRouteHandler,


}