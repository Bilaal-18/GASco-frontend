import userContext from "../context/UserContext";
import axios from "../config/config"
import { useReducer,useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {toast} from 'sonner';
const userReducer = (state,action) => {
    switch(action.type){
        case "LOGIN" : {
            return {...state,isLoggedIn:true,user:action.payload,serverErrors:"",loading:false}
        }
        case "LOGOUT" : {
            return {...state,isLoggedIn:false,user:null,loading:false}
        }
        case "SET_SERVER_ERROR" : {
            return {...state,serverErrors:action.payload}
        }
        default : {
            return {...state}
        }
    }
}
export default function AuthProvider(props){
    const navigate = useNavigate()
    const [userState ,userDispatch] = useReducer(userReducer,{
        user:null,
        isLoggedIn:false,
        serverErrors:"",
        loading:true,
    })

     useEffect(() => {
        if (localStorage.getItem("token")) {
            const fetchUser = async () => {
                try {
                    const response = await axios.get("/api/account", {
                        headers: {
                            Authorization: localStorage.getItem("token"),
                        },
                    });
                    userDispatch({ type: "LOGIN", payload: response.data });
                } catch (err) {
                    toast.error("something went wrong, please login again");
                    localStorage.removeItem("token");
                    userDispatch({ type: "LOGOUT" });
                    navigate("/login");
                }
            };
            fetchUser();
        }
    }, []);

    const handleRegister = async (formData, resetForm) => {
        try {
            const toastId = toast.loading("Registering...");
            const response = await axios.post("/api/register", formData);
            console.table(response.data);
            await setTimeout(() => {
                toast.dismiss(toastId);
                toast.success("Registered successfully!");
                resetForm();
                navigate("/login");
            }, 2000);
        } catch (err) {
            toast.dismiss();
            console.error(
                "Backend validation errors:",
                err?.response?.data?.error
            );
            const errorMessage = Array.isArray(err?.response?.data?.error)
                ? err.response.data.error.map((e) => e.message).join(", ")
                : err?.response?.data?.error || "Registration failed";
            toast.error(errorMessage);
        }
    };

    const handleLogin = async (formData, resetForm) => {
        try {
            const toastId = toast.loading("Logging in...");
            const response = await axios.post("/api/login", formData);
            localStorage.setItem("token",response.data.token);
            const userResponse = await axios.get("/api/account", {
                headers: { Authorization: localStorage.getItem("token") },
            });
            userDispatch({ type: "LOGIN", payload: userResponse.data });
            console.table(userResponse.data);

            if (!userResponse.data) {
                toast.dismiss(toastId);
                toast.error("Failed to fetch account details");
                return;
}
            await setTimeout(() => {
                toast.dismiss(toastId);
                toast.success("Logged in successfully!");
                resetForm();
                if (userResponse.data.role === "admin") {
                    navigate("/admin");
                } else if (userResponse.data.role === "agent") {
                    navigate("/agent/dashboard");
                } else if (userResponse.data.role === "customer") {
                    navigate("/customer/dashboard");
                }
            }, 2000);
        } catch (err) {
            toast.dismiss();
            const errorMessage = err?.response?.data?.error || "Login failed";
            toast.error(errorMessage);
        }
    };

    const handleProfileUpdate = async (formData) => {
        try {
            console.log(formData);
            const response = await axios.put("/api/account", formData, {
                headers: { Authorization: localStorage.getItem("token") },
            });
            userDispatch({ type: "LOGIN", payload: response.data });
            console.log(response.data);
            toast.success("profile updated!");
        } catch (err) {
            const errorMessage =
                err?.response?.data?.error || "Profile Update failed";
            toast.error(errorMessage);
        }
    };

    const handleLogout = () => {
        localStorage.removeItem("token");
        userDispatch({ type: "LOGOUT" });
        toast.info("Logout success!");
    };

    return (
        <userContext.Provider
            value={{
                ...userState,
                handleLogin,
                handleRegister,
                handleLogout,
                handleProfileUpdate,
                
            }}
        >
            {props.children}
        </userContext.Provider>
    );
}