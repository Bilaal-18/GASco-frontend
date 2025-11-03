import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Bot, X, Send, MessageCircle } from "lucide-react";
import { toast } from "sonner";

const AIBookingChatbot = ({ bookings, stats }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "bot",
      content: "Hello! I'm your booking assistant. I can help you with:\n• Daily booking counts (today, yesterday, or specific dates)\n• Booking status information\n• Customer details\n• Payment information\n• Delivery status\n• Detailed booking information\n\nTry asking:\n• 'How many bookings today?'\n• 'Show pending bookings'\n• 'Bookings on 15-01-2024'\n• 'Details for yesterday'\n• 'Payment summary'",
    },
  ]);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const messagesContainerRef = useRef(null);

  // Scroll to bottom when messages change or typing state changes
  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
    // Also try scrolling the container directly
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  };

  useEffect(() => {
    if (isOpen) {
      // Small delay to ensure DOM is updated
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

  const processQuery = (query) => {
    const lowerQuery = query.toLowerCase().trim();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Parse date from query (e.g., "yesterday", "2024-01-15", "last week")
    let targetDate = null;
    let filteredBookings = bookings;

    // Check for specific date mentions
    if (lowerQuery.includes("yesterday")) {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      targetDate = yesterday;
    } else if (lowerQuery.includes("today") || lowerQuery.includes("this day")) {
      targetDate = today;
    } else {
      // Try to extract date from query (format: YYYY-MM-DD or DD-MM-YYYY or DD/MM/YYYY)
      const datePatterns = [
        /\b(\d{4}-\d{2}-\d{2})\b/, // YYYY-MM-DD
        /\b(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})\b/, // DD-MM-YYYY or DD/MM/YYYY
        /\b(\d{1,2})[-\/](\d{1,2})[-\/](\d{2})\b/, // DD-MM-YY or DD/MM/YY
      ];

      for (const pattern of datePatterns) {
        const match = query.match(pattern);
        if (match) {
          try {
            if (match[1]?.includes("-") && match[1].length === 10) {
              // YYYY-MM-DD format
              targetDate = new Date(match[1]);
            } else if (match[3]) {
              // DD-MM-YYYY format
              const day = parseInt(match[1]);
              const month = parseInt(match[2]) - 1;
              const year = parseInt(match[3]);
              targetDate = new Date(year, month, day);
            } else if (match[2]) {
              // DD-MM-YY format (assume 20XX)
              const day = parseInt(match[1]);
              const month = parseInt(match[2]) - 1;
              const year = 2000 + parseInt(match[3]);
              targetDate = new Date(year, month, day);
            }
            if (targetDate) {
              targetDate.setHours(0, 0, 0, 0);
              break;
            }
          } catch (e) {
            // Invalid date, continue
          }
        }
      }
    }

    // Filter bookings by date if specified
    if (targetDate) {
      filteredBookings = bookings.filter((booking) => {
        const bookingDate = new Date(booking.createdAt || booking.created_at);
        bookingDate.setHours(0, 0, 0, 0);
        return bookingDate.getTime() === targetDate.getTime();
      });
    } else {
      // Default to today's bookings if no date specified
      filteredBookings = bookings.filter((booking) => {
        const bookingDate = new Date(booking.createdAt || booking.created_at);
        bookingDate.setHours(0, 0, 0, 0);
        return bookingDate.getTime() === today.getTime();
      });
    }

    const dateLabel = targetDate
      ? targetDate.toLocaleDateString("en-GB", {
          day: "numeric",
          month: "short",
          year: "numeric",
        })
      : "today";

    // Filter today's bookings (for backward compatibility)
    const todayBookings = bookings.filter((booking) => {
      const bookingDate = new Date(booking.createdAt || booking.created_at);
      bookingDate.setHours(0, 0, 0, 0);
      return bookingDate.getTime() === today.getTime();
    });

    // Total bookings (supports date queries)
    if (
      lowerQuery.includes("how many") ||
      lowerQuery.includes("total") ||
      lowerQuery.includes("count") ||
      lowerQuery.includes("number")
    ) {
      if (lowerQuery.includes("booking") || targetDate || !lowerQuery.includes("customer")) {
        return `You have **${filteredBookings.length}** bookings on ${dateLabel}.\n\nBreakdown:\n• Pending: ${filteredBookings.filter((b) => b.status === "pending").length}\n• Confirmed: ${filteredBookings.filter((b) => b.status === "confirmed").length}\n• Delivered: ${filteredBookings.filter((b) => b.status === "delivered").length}`;
      }
    }

    // Pending bookings
    if (
      lowerQuery.includes("pending") ||
      lowerQuery.includes("waiting") ||
      lowerQuery.includes("not delivered")
    ) {
      const pendingBookings = filteredBookings.filter(
        (b) => b.status === "pending" || b.status === "confirmed"
      );
      if (pendingBookings.length === 0) {
        return `Great news! You have **no pending bookings** on ${dateLabel}. All bookings are delivered! 🎉`;
      }
      let response = `You have **${pendingBookings.length} pending bookings** on ${dateLabel}:\n\n`;
      pendingBookings.slice(0, 5).forEach((booking, idx) => {
        const createdAt = new Date(booking.createdAt || booking.created_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
        response += `${idx + 1}. **${booking.customer?.username || "Unknown"}** - ${booking.cylinder?.cylinderType || "N/A"} (Qty: ${booking.quantity || 0}) - Status: ${booking.status} - Time: ${createdAt}\n`;
      });
      if (pendingBookings.length > 5) {
        response += `\n...and ${pendingBookings.length - 5} more pending bookings.`;
      }
      return response;
    }

    // Delivered bookings
    if (
      lowerQuery.includes("delivered") ||
      lowerQuery.includes("completed") ||
      lowerQuery.includes("done")
    ) {
      const deliveredBookings = filteredBookings.filter(
        (b) => b.status === "delivered"
      );
      if (deliveredBookings.length === 0) {
        return `You have **no delivered bookings** on ${dateLabel} yet.`;
      }
      let response = `You have **${deliveredBookings.length} delivered bookings** on ${dateLabel}:\n\n`;
      deliveredBookings.slice(0, 5).forEach((booking, idx) => {
        const amount =
          (booking.cylinder?.price || 0) * (booking.quantity || 0);
        const createdAt = new Date(booking.createdAt || booking.created_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
        response += `${idx + 1}. **${booking.customer?.username || "Unknown"}** - ${booking.cylinder?.cylinderType || "N/A"} (Qty: ${booking.quantity || 0}) - ₹${amount.toLocaleString()} - Time: ${createdAt}\n`;
      });
      if (deliveredBookings.length > 5) {
        response += `\n...and ${deliveredBookings.length - 5} more delivered bookings.`;
      }
      return response;
    }

    // Payment related queries
    if (
      lowerQuery.includes("payment") ||
      lowerQuery.includes("paid") ||
      lowerQuery.includes("amount") ||
      lowerQuery.includes("money") ||
      lowerQuery.includes("collected")
    ) {
      const paidBookings = filteredBookings.filter(
        (b) => b.paymentStatus === "paid"
      );
      const pendingPayments = filteredBookings.filter(
        (b) => b.paymentStatus === "pending"
      );

      const totalCollected = paidBookings.reduce(
        (sum, b) =>
          sum + (b.cylinder?.price || 0) * (b.quantity || 0),
        0
      );
      const totalPending = pendingPayments.reduce(
        (sum, b) =>
          sum + (b.cylinder?.price || 0) * (b.quantity || 0),
        0
      );

      return `**Payment Summary for ${dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1)}:**\n\n💰 Collected: ₹${totalCollected.toLocaleString()} (${paidBookings.length} bookings)\n⏳ Pending: ₹${totalPending.toLocaleString()} (${pendingPayments.length} bookings)\n\n**Total Amount:** ₹${(totalCollected + totalPending).toLocaleString()}`;
    }

    // Status overview
    if (
      lowerQuery.includes("status") ||
      lowerQuery.includes("overview") ||
      lowerQuery.includes("summary")
    ) {
      const statusCounts = {
        pending: filteredBookings.filter((b) => b.status === "pending").length,
        confirmed: filteredBookings.filter((b) => b.status === "confirmed")
          .length,
        delivered: filteredBookings.filter((b) => b.status === "delivered")
          .length,
      };

      return `**${dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1)}'s Booking Status Overview:**\n\n📋 Total Bookings: ${filteredBookings.length}\n⏳ Pending: ${statusCounts.pending}\n✅ Confirmed: ${statusCounts.confirmed}\n🚚 Delivered: ${statusCounts.delivered}\n\n**Payment Status:**\n💰 Paid: ${filteredBookings.filter((b) => b.paymentStatus === "paid").length}\n💳 Pending Payment: ${filteredBookings.filter((b) => b.paymentStatus === "pending").length}`;
    }

    // Customer queries
    if (
      lowerQuery.includes("customer") ||
      lowerQuery.includes("who") ||
      lowerQuery.includes("name")
    ) {
      if (filteredBookings.length === 0) {
        return `No bookings found for ${dateLabel}.`;
      }
      let response = `**${dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1)}'s Customers (${filteredBookings.length}):**\n\n`;
      filteredBookings.slice(0, 10).forEach((booking, idx) => {
        const createdAt = new Date(booking.createdAt || booking.created_at).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
        response += `${idx + 1}. **${booking.customer?.username || "Unknown"}** - ${booking.cylinder?.cylinderType || "N/A"} x${booking.quantity || 0} - ${booking.status} - ${createdAt}\n`;
      });
      if (filteredBookings.length > 10) {
        response += `\n...and ${filteredBookings.length - 10} more customers.`;
      }
      return response;
    }

    // Cylinder type queries
    if (
      lowerQuery.includes("cylinder") ||
      lowerQuery.includes("type") ||
      lowerQuery.includes("gas")
    ) {
      const cylinderTypes = {};
      filteredBookings.forEach((booking) => {
        const type = booking.cylinder?.cylinderType || "Unknown";
        cylinderTypes[type] = (cylinderTypes[type] || 0) + (booking.quantity || 0);
      });

      if (Object.keys(cylinderTypes).length === 0) {
        return `No cylinder bookings found for ${dateLabel}.`;
      }

      let response = `**Cylinder Types Sold on ${dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1)}:**\n\n`;
      Object.entries(cylinderTypes).forEach(([type, qty]) => {
        response += `• ${type}: ${qty} cylinder(s)\n`;
      });
      return response;
    }

    // Detailed booking information for specific date
    if (
      lowerQuery.includes("details") ||
      lowerQuery.includes("list all") ||
      lowerQuery.includes("show all") ||
      (targetDate && filteredBookings.length > 0)
    ) {
      if (filteredBookings.length === 0) {
        return `No bookings found for ${dateLabel}.`;
      }
      let response = `**All Booking Details for ${dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1)} (${filteredBookings.length}):**\n\n`;
      filteredBookings.slice(0, 10).forEach((booking, idx) => {
        const createdAt = new Date(booking.createdAt || booking.created_at);
        const time = createdAt.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
        const amount = (booking.cylinder?.price || 0) * (booking.quantity || 0);
        response += `${idx + 1}. **${booking.customer?.username || "Unknown"}**\n   • Cylinder: ${booking.cylinder?.cylinderType || "N/A"}\n   • Quantity: ${booking.quantity || 0}\n   • Status: ${booking.status}\n   • Payment: ${booking.paymentStatus}\n   • Amount: ₹${amount.toLocaleString()}\n   • Time: ${time}\n\n`;
      });
      if (filteredBookings.length > 10) {
        response += `\n...and ${filteredBookings.length - 10} more bookings.`;
      }
      return response;
    }

    // Help
    if (
      lowerQuery.includes("help") ||
      lowerQuery.includes("what can") ||
      lowerQuery.includes("how to")
    ) {
      return `I can help you with:\n\n📊 **Booking Information:**\n• "How many bookings today?"\n• "Bookings on 15-01-2024" (any date)\n• "Show pending bookings"\n• "What's the status?"\n• "Details for yesterday"\n\n💰 **Payment Info:**\n• "Payment status"\n• "Amount collected"\n• "Pending payments"\n\n👥 **Customer Details:**\n• "List customers"\n• "Who booked today?"\n\n📦 **Products:**\n• "What cylinders were sold?"\n• "Cylinder types today"\n\nJust ask me anything about your bookings!`;
    }

    // Default response
    return `I understand you're asking about bookings. Here's what I know:\n\n📋 **Today's Bookings:** ${todayBookings.length}\n💰 **Stats Available:** Payment status, delivery status, customer info\n\nTry asking:\n• "How many bookings today?" or "Bookings on [date]"\n• "Show pending bookings"\n• "Payment summary"\n• "List customers"\n• "Details for yesterday"\n\nType "help" for more options!`;
  };

  const handleSend = () => {
    if (!input.trim() || isTyping) return;

    const userMessage = input.trim();
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setInput("");
    setIsTyping(true);
    
    // Scroll to bottom when user sends message
    setTimeout(() => {
      scrollToBottom();
    }, 50);

    // Simulate AI thinking
    setTimeout(() => {
      const botResponse = processQuery(userMessage);
      setMessages((prev) => [
        ...prev,
        { role: "bot", content: botResponse },
      ]);
      setIsTyping(false);
      // Scroll to bottom and refocus input after response
      setTimeout(() => {
        scrollToBottom();
        if (inputRef.current) {
          inputRef.current.focus();
        }
      }, 200);
    }, 800);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const formatMessage = (content) => {
    // Format markdown-like text
    const lines = content.split("\n");
    return lines.map((line, idx) => {
      if (line.trim().startsWith("**") && line.trim().endsWith("**")) {
        return (
          <strong key={idx} className="font-bold text-blue-600">
            {line.replace(/\*\*/g, "")}
          </strong>
        );
      }
      if (line.trim().startsWith("•")) {
        return (
          <div key={idx} className="ml-2 flex items-start">
            <span className="mr-2">•</span>
            <span>{line.replace("•", "").trim()}</span>
          </div>
        );
      }
      if (line.trim().match(/^\d+\./)) {
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
      {/* Floating Button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 w-14 h-14 rounded-full shadow-lg bg-blue-600 hover:bg-blue-700 text-white z-50 flex items-center justify-center"
          title="Open AI Assistant"
        >
          <Bot className="w-6 h-6" />
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <Card className="fixed bottom-6 right-6 w-96 h-[600px] shadow-2xl z-50 flex flex-col">
          <CardHeader className="bg-blue-600 text-white flex flex-row items-center justify-between pb-3">
            <div className="flex items-center gap-2">
              <Bot className="w-5 h-5" />
              <CardTitle className="text-lg">Booking Assistant</CardTitle>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsOpen(false)}
              className="text-white hover:bg-blue-700 h-8 w-8 p-0"
            >
              <X className="w-4 h-4" />
            </Button>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
            {/* Messages */}
            <div 
              ref={messagesContainerRef}
              className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50"
              style={{ maxHeight: '100%' }}
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
                        : "bg-white border border-gray-200 text-gray-800"
                    }`}
                  >
                    {msg.role === "bot" ? (
                      <div className="text-sm whitespace-pre-line">
                        {formatMessage(msg.content)}
                      </div>
                    ) : (
                      <div className="text-sm">{msg.content}</div>
                    )}
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

            {/* Input */}
            <div className="border-t p-3 bg-white">
              <div className="flex gap-2">
                <Input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={isTyping ? "Bot is typing..." : "Ask about today's bookings..."}
                  className="flex-1"
                  autoFocus
                />
                <Button
                  onClick={handleSend}
                  disabled={!input.trim() || isTyping}
                  className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </>
  );
};

export default AIBookingChatbot;

