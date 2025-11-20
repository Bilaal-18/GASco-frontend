import axios from "@/config/config";
import UserContext from "@/context/UserContext";
import { useContext } from "react";
import { toast } from "sonner";

/**
 * Simple Razorpay Payment Hook
 * Use this hook to handle payments for both customers and agents
 * 
 * Example usage:
 * const { handlePayment } = useRazorpayPayment();
 * await handlePayment({
 *   amount: 1000,
 *   bookingId: "123", // for customer payments
 *   paymentType: "customer", // or "agent"
 *   totalDue: 5000, // for agent payments
 *   description: "Payment description"
 * });
 */
export default function useRazorpayPayment() {
    const { user } = useContext(UserContext);

    const handlePayment = async (paymentData) => {
        return new Promise(async (resolve) => {
            try {
                // Check if Razorpay is loaded
                if (!window.Razorpay) {
                    toast.error("Razorpay SDK not loaded. Please refresh the page.");
                    return resolve(false);
                }

                // Get token
                const token = localStorage.getItem("token");
                if (!token) {
                    toast.error("Please login to make payment");
                    return resolve(false);
                }

                // Extract payment data
                const { amount, bookingId, paymentType, totalDue, description } = paymentData;

                // Validate amount
                if (!amount || amount <= 0) {
                    toast.error("Invalid payment amount");
                    return resolve(false);
                }

                // Step 1: Create Razorpay order
                const orderResponse = await axios.post(
                    "/api/payment/create-order",
                    {
                        amount: amount,
                        bookingId: bookingId,
                        paymentType: paymentType || "customer",
                        description: description || "Payment via Razorpay",
                    },
                    {
                        headers: {
                            Authorization: token,
                        },
                    }
                );

                const orderData = orderResponse.data;

                // Check if order was created successfully
                if (!orderData || !orderData.orderId || !orderData.key) {
                    toast.error(orderData?.error || "Failed to create payment order");
                    return resolve(false);
                }

                const { orderId, key, amount: orderAmount } = orderData;

                // Step 2: Setup Razorpay options
                const options = {
                    key: key,
                    amount: orderAmount,
                    currency: "INR",
                    name: "GASCo",
                    description: description || "Payment via Razorpay",
                    order_id: orderId,
                    prefill: {
                        name: user?.username || user?.agentname || user?.name || "",
                        email: user?.email || "",
                        contact: user?.phoneNo || "",
                    },
                    handler: async function (response) {
                        try {
                            // Step 3: Verify payment with backend
                            const verifyResponse = await axios.post(
                                "/api/payment/verify",
                                {
                                    razorpay_order_id: response.razorpay_order_id,
                                    razorpay_payment_id: response.razorpay_payment_id,
                                    razorpay_signature: response.razorpay_signature,
                                    bookingId: bookingId,
                                    paymentType: paymentType || "customer",
                                    amount: amount,
                                    totalDue: totalDue,
                                    description: description || "Payment via Razorpay",
                                },
                                {
                                    headers: {
                                        Authorization: token,
                                    },
                                }
                            );

                            if (verifyResponse.data.success) {
                                toast.success("Payment successful!");
                                return resolve(true);
                            } else {
                                toast.error(verifyResponse.data.error || "Payment verification failed");
                                return resolve(false);
                            }
                        } catch (error) {
                            console.error("Payment verification error:", error);
                            toast.error(error?.response?.data?.error || "Payment verification failed");
                            return resolve(false);
                        }
                    },
                    modal: {
                        ondismiss: function () {
                            toast.info("Payment cancelled");
                            return resolve(false);
                        },
                    },
                };

                // Step 4: Open Razorpay payment window
                const razorpay = new window.Razorpay(options);

                // Handle payment failures
                razorpay.on("payment.failed", function (response) {
                    console.error("Payment failed:", response);
                    toast.error(response.error?.description || "Payment failed. Please try again.");
                    return resolve(false);
                });

                razorpay.on("error", function (error) {
                    console.error("Razorpay error:", error);
                    toast.error("Payment gateway error. Please try again.");
                    return resolve(false);
                });

                // Open payment window
                razorpay.open();
            } catch (error) {
                console.error("Payment error:", error);
                toast.error(error?.response?.data?.error || error?.message || "Payment failed");
                return resolve(false);
            }
        });
    };

    return { handlePayment };
}
