import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import { Provider } from "react-redux";
import "./index.css";
import App from "./App.jsx";
import AuthProvider from "./components/AuthProvider";
import { Toaster } from "sonner";
import { store } from "./store/store";


createRoot(document.getElementById("root")).render(
    <BrowserRouter>
        <Provider store={store}>
            <AuthProvider>
                <App/>
                <Toaster position="top-right" richColors />
            </AuthProvider>
        </Provider>
    </BrowserRouter>
);