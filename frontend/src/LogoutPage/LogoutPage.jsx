import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function LogoutPage() {

    const navigate = useNavigate();

    useEffect(() => {
        // remvoe jwt from storage and unauthenticate user
        localStorage.removeItem("main");

        // make it seem smoother and display the message below to allow user to understand
        setTimeout(() => {
            navigate("/");
        }, 750);
    }, []);

    return (
        <h1>Logging you out...</h1>
    )
};