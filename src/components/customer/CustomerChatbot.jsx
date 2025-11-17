import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Bot, X } from "lucide-react";
import { toast } from "sonner";
import axios from "@/config/config";

// Detect if input is Manglish using Gemini AI
const detectManglish = async (text) => {
  try {
    const token = localStorage.getItem("token");
    if (!token) return false;

    const response = await axios.post(
      "/api/translate/detect",
      { text },
      { headers: { Authorization: token } }
    );
    return response.data?.isManglish || false;
  } catch (error) {
    console.error("Detection error:", error);
    // Fallback: simple heuristic check
    const manglishIndicators = ["entha", "ningalude", "ente", "ippo", "ini", "aayittilla", "varum", "kannu"];
    const words = text.toLowerCase().split(/\s+/);
    return words.some(word => manglishIndicators.includes(word));
  }
};

// Translate Manglish to English using Gemini AI
const translateManglishToEnglish = async (text) => {
  try {
    const token = localStorage.getItem("token");
    if (!token) return text;

    const response = await axios.post(
      "/api/translate/manglish-to-english",
      { text },
      { headers: { Authorization: token } }
    );
    return response.data?.translated || text;
  } catch (error) {
    console.error("Translation error (Manglish to English):", error);
    toast.error("Translation failed. Using original text.");
    return text;
  }
};

// Translate English to Manglish using Gemini AI
const translateEnglishToManglish = async (text) => {
  try {
    const token = localStorage.getItem("token");
    if (!token) return text;

    const response = await axios.post(
      "/api/translate/english-to-manglish",
      { text },
      { headers: { Authorization: token } }
    );
    return response.data?.translated || text;
  } catch (error) {
    console.error("Translation error (English to Manglish):", error);
    toast.error("Translation failed. Using original text.");
    return text;
  }
};

const CustomerChatbot = ({ bookings = [], summary = {} }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "bot",
      content: "Hello! I can help you with booking status, payment details, and delivery information. You can ask in English or Manglish.",
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const messagesContainerRef = useRef(null);

  // Scroll to bottom when messages change
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    }
  }, [messages, isOpen, isTyping]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  // Process query with customer booking data
  const processQuery = (query) => {
    const lowerQuery = query.toLowerCase().trim();
    const activeBookings = bookings.filter(b => b.status !== 'cancelled');

    // Booking status queries
    if (lowerQuery.includes("status") || lowerQuery.includes("booking status")) {
      if (activeBookings.length === 0) {
        return "You have no active bookings.";
      }
      
      const latestBooking = activeBookings[activeBookings.length - 1];
      const status = latestBooking.status || "pending";
      const cylinderName = latestBooking.cylinder?.cylinderName || "Gas Cylinder";
      const quantity = latestBooking.quantity || 0;
      
      return `Your latest booking status:\n\nBooking ID: ${latestBooking._id?.slice(-8)}\nCylinder: ${cylinderName}\nQuantity: ${quantity}\nStatus: ${status}\n\nYou can check all bookings in the "My Bookings" page.`;
    }

    // Payment queries
    if (lowerQuery.includes("payment") || lowerQuery.includes("paid") || lowerQuery.includes("amount")) {
      const paidBookings = activeBookings.filter(b => b.paymentStatus === "paid");
      const pendingPayments = activeBookings.filter(b => b.paymentStatus === "pending");
      
      const totalPaid = paidBookings.reduce(
        (sum, b) => sum + (b.cylinder?.price || 0) * (b.quantity || 0),
        0
      );
      const totalPending = pendingPayments.reduce(
        (sum, b) => sum + (b.cylinder?.price || 0) * (b.quantity || 0),
        0
      );

      return `Payment Summary:\n\n💰 Paid: ₹${totalPaid.toLocaleString()} (${paidBookings.length} bookings)\n⏳ Pending: ₹${totalPending.toLocaleString()} (${pendingPayments.length} bookings)\n\nTotal Spent: ₹${(totalPaid + totalPending).toLocaleString()}`;
    }

    // Delivery queries
    if (lowerQuery.includes("delivered") || lowerQuery.includes("delivery") || lowerQuery.includes("not delivered")) {
      const deliveredBookings = activeBookings.filter(b => b.status === "delivered");
      const pendingDeliveries = activeBookings.filter(b => b.status !== "delivered" && b.status !== "cancelled");
      
      if (deliveredBookings.length === 0 && pendingDeliveries.length > 0) {
        return `Your cylinders are not delivered yet. You have ${pendingDeliveries.length} booking(s) pending delivery.`;
      } else if (deliveredBookings.length > 0) {
        return `You have ${deliveredBookings.length} delivered booking(s). ${pendingDeliveries.length > 0 ? `You also have ${pendingDeliveries.length} booking(s) pending delivery.` : ""}`;
      } else {
        return "You have no bookings.";
      }
    }

    // Booking count queries
    if (lowerQuery.includes("how many") || lowerQuery.includes("total") || lowerQuery.includes("count")) {
      return `You have ${activeBookings.length} total booking(s).\n\n• Active: ${activeBookings.filter(b => b.status !== "delivered" && b.status !== "cancelled").length}\n• Delivered: ${activeBookings.filter(b => b.status === "delivered").length}\n• Completed: ${activeBookings.filter(b => b.status === "delivered" && b.paymentStatus === "paid").length}`;
    }

    // Help queries
    if (lowerQuery.includes("help") || lowerQuery.includes("what can")) {
      return `I can help you with:\n\n📊 Booking Status\n• "What is my booking status?"\n• "Show booking status"\n\n💰 Payment Information\n• "Payment status"\n• "How much did I pay?"\n\n🚚 Delivery Status\n• "Is my cylinder delivered?"\n• "Delivery status"\n\n📋 Booking Details\n• "How many bookings do I have?"\n• "Total bookings"\n\nYou can ask in English or Manglish!`;
    }

    // Default response
    return `I can help you with booking status, payment details, and delivery information. Try asking:\n\n• "What is my booking status?"\n• "Payment status"\n• "Is my cylinder delivered?"\n• "How many bookings do I have?"\n\nType "help" for more options!`;
  };

  const handleSend = async () => {
    if (!input.trim() || isTyping) return;

    const userMessage = input.trim();
    
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setInput("");
    setIsTyping(true);
    
    setTimeout(() => {
      scrollToBottom();
    }, 50);

    try {
      // Step 1: Detect if user message is Manglish using Gemini AI
      const isUserManglish = await detectManglish(userMessage);
      
      // Step 2: Translate user message to English for processing (if Manglish)
      const englishQuery = isUserManglish 
        ? await translateManglishToEnglish(userMessage)
        : userMessage;
      
      // Step 3: Process query in English (internal processing)
      const botResponseEnglish = processQuery(englishQuery);
      
      // Step 4: Translate response back to Manglish if user wrote in Manglish
      // IMPORTANT: If user typed in Manglish, response MUST be in Manglish
      let botResponse;
      if (isUserManglish) {
        // User typed in Manglish - translate English response to Manglish
        botResponse = await translateEnglishToManglish(botResponseEnglish);
        
        // Safety check: If translation failed or returned English, try again
        if (!botResponse || botResponse === botResponseEnglish) {
          console.warn("Translation may have failed, retrying...");
          botResponse = await translateEnglishToManglish(botResponseEnglish);
        }
      } else {
        // User typed in English - keep response in English
        botResponse = botResponseEnglish;
      }
      
      setMessages((prev) => [
        ...prev,
        { role: "bot", content: botResponse },
      ]);
    } catch (error) {
      console.error("Chat error:", error);
      // Try to detect language for error message
      try {
        const isUserManglish = await detectManglish(userMessage);
        const errorMsg = isUserManglish 
          ? "sadhanam process cheyyan pattunilla. kooduthal clear aayi chodichu nokku"
          : "I'm having trouble processing that request. Could you try rephrasing your question?";
        setMessages((prev) => [
          ...prev,
          { role: "bot", content: errorMsg },
        ]);
      } catch (detectError) {
        setMessages((prev) => [
          ...prev,
          { role: "bot", content: "I'm having trouble processing that request. Could you try rephrasing your question?" },
        ]);
      }
    } finally {
      setIsTyping(false);
      setTimeout(() => {
        scrollToBottom();
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 200);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatMessage = (content) => {
    const lines = content.split("\n");
    return lines.map((line, idx) => {
      if (line.trim().startsWith("•")) {
        return (
          <div key={idx} className="ml-2">
            {line}
          </div>
        );
      }
      return <div key={idx}>{line || "\u00A0"}</div>;
    });
  };

  return (
    <>
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg bg-blue-600 hover:bg-blue-700 text-white z-50 flex items-center justify-center"
        >
          <Bot className="w-6 h-6" />
        </Button>
      )}

      {isOpen && (
        <Card className="fixed bottom-6 right-6 w-96 h-[600px] shadow-2xl z-50 flex flex-col">
          <div className="bg-blue-600 text-white flex items-center justify-between p-3">
            <div className="font-semibold">Chat Assistant</div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-blue-700 h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
            <div 
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50"
            >
              {messages.map((msg, idx) => (
                <div
                  key={idx}
                  className={`flex ${
                    msg.role === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      msg.role === "user"
                        ? "bg-blue-600 text-white"
                        : "bg-white border border-gray-200"
                    }`}
                  >
                    <div className="text-sm whitespace-pre-line">
                      {msg.role === "bot" ? formatMessage(msg.content) : msg.content}
                    </div>
                  </div>
                </div>
              ))}

              {isTyping && (
                <div className="flex justify-start">
                  <div className="bg-white border border-gray-200 rounded-lg p-3">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.2s" }}
                      ></div>
                      <div
                        className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                        style={{ animationDelay: "0.4s" }}
                      ></div>
                    </div>
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>

            <div className="border-t p-3 bg-white">
              <div className="flex gap-2">
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={isTyping ? "Typing..." : "Ask about your bookings..."}
                  className="flex-1"
                />
                <Button
                  onClick={handleSend}
                  disabled={!input.trim() || isTyping}
                >
                  Send
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
};

export default CustomerChatbot;

