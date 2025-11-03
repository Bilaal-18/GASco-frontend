import { Navigate } from "react-router-dom";
import { toast } from "sonner";


export default function PrivateRoute(props){
    const id = localStorage.getItem("token");
    if(id){
        return props.children;
    }else{
        //toast.error("First login First");
        return <Navigate to="/login" replace/>;
    }
}