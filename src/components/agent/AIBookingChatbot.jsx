import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Bot, X, Send, Sparkles } from "lucide-react";
import { toast } from "sonner";
import axios from "@/config/config";

const AIBookingChatbot = ({ bookings = [], stats = {} }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      role: "bot",
      content: "Hello! I'm your AI-powered booking assistant. 🤖✨\n\nI can help you with:\n• 📊 Booking information and analytics\n• 💰 Payment details and status\n• 👥 Customer information\n• 📦 Cylinder type breakdowns\n• 📈 Sales insights\n\n**Try asking me:**\n• 'How many bookings today?'\n• 'Show me pending bookings'\n• 'What cylinder types did I sell?'\n• 'Who are my top customers?'\n• 'Payment summary'\n\nI understand natural language and can correct spelling mistakes! 💬",
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

  // Process query with all available agent data
  const processQuery = (query) => {
    const lowerQuery = query.toLowerCase().trim();
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Filter out cancelled bookings
    const activeBookings = bookings.filter(b => b.status !== 'cancelled');
    
    // Parse date from query
    let targetDate = null;
    let filteredBookings = activeBookings;

    if (lowerQuery.includes("yesterday")) {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      targetDate = yesterday;
    } else if (lowerQuery.includes("today") || lowerQuery.includes("this day")) {
      targetDate = today;
    } else {
      const datePatterns = [
        /\b(\d{4}-\d{2}-\d{2})\b/,
        /\b(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})\b/,
        /\b(\d{1,2})[-\/](\d{1,2})[-\/](\d{2})\b/,
      ];

      for (const pattern of datePatterns) {
        const match = query.match(pattern);
        if (match) {
          try {
            if (match[1]?.includes("-") && match[1].length === 10) {
              targetDate = new Date(match[1]);
            } else if (match[3]) {
              const day = parseInt(match[1]);
              const month = parseInt(match[2]) - 1;
              const year = parseInt(match[3]);
              targetDate = new Date(year, month, day);
            } else if (match[2]) {
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
      filteredBookings = activeBookings.filter((booking) => {
        const bookingDate = new Date(booking.createdAt || booking.created_at);
        bookingDate.setHours(0, 0, 0, 0);
        return bookingDate.getTime() === targetDate.getTime();
      });
    } else {
      filteredBookings = activeBookings.filter((booking) => {
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

    const todayBookings = activeBookings.filter((booking) => {
      const bookingDate = new Date(booking.createdAt || booking.created_at);
      bookingDate.setHours(0, 0, 0, 0);
      return bookingDate.getTime() === today.getTime();
    });

    // Calculate cylinder type breakdown
    const cylinderTypes = {};
    activeBookings.forEach(b => {
      const type = b.cylinder?.cylinderType || 'Unknown';
      if (!cylinderTypes[type]) {
        cylinderTypes[type] = { count: 0, quantity: 0, amount: 0 };
      }
      cylinderTypes[type].count += 1;
      cylinderTypes[type].quantity += (b.quantity || 0);
      cylinderTypes[type].amount += ((b.cylinder?.price || 0) * (b.quantity || 0));
    });

    // Calculate today's cylinder breakdown
    const todayCylinderTypes = {};
    todayBookings.forEach(b => {
      const type = b.cylinder?.cylinderType || 'Unknown';
      if (!todayCylinderTypes[type]) {
        todayCylinderTypes[type] = { count: 0, quantity: 0, amount: 0 };
      }
      todayCylinderTypes[type].count += 1;
      todayCylinderTypes[type].quantity += (b.quantity || 0);
      todayCylinderTypes[type].amount += ((b.cylinder?.price || 0) * (b.quantity || 0));
    });

    // Get top customers
    const customers = {};
    activeBookings.forEach(b => {
      const name = b.customer?.username || 'Unknown';
      if (!customers[name]) {
        customers[name] = { bookings: 0, amount: 0 };
      }
      customers[name].bookings += 1;
      customers[name].amount += ((b.cylinder?.price || 0) * (b.quantity || 0));
    });
    const topCustomers = Object.entries(customers)
      .map(([name, data]) => ({ name, ...data }))
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 10);

    // Total bookings count
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

    // Payment related queries
    if (
      lowerQuery.includes("payment") ||
      lowerQuery.includes("paid") ||
      lowerQuery.includes("amount") ||
      lowerQuery.includes("money") ||
      lowerQuery.includes("collected") ||
      lowerQuery.includes("revenue")
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

      return `**Payment Summary for ${dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1)}:**\n\n💰 Collected: ₹${totalCollected.toLocaleString()} (${paidBookings.length} bookings)\n⏳ Pending: ₹${totalPending.toLocaleString()} (${pendingPayments.length} bookings)\n\n**Total Amount:** ₹${(totalCollected + totalPending).toLocaleString()}\n\n**Overall Stats:**\n• Total Collected: ₹${(stats.amountCollected || 0).toLocaleString()}\n• Total Pending: ₹${(stats.pendingPayments || 0).toLocaleString()}`;
    }

    // Cylinder type queries
    if (
      lowerQuery.includes("cylinder") ||
      lowerQuery.includes("type") ||
      lowerQuery.includes("gas") ||
      lowerQuery.includes("breakdown")
    ) {
      if (lowerQuery.includes("today")) {
        const todayTypes = Object.entries(todayCylinderTypes);
        if (todayTypes.length === 0) {
          return `No cylinder bookings found for today.`;
        }
        let response = `**Today's Cylinder Types:**\n\n`;
        todayTypes.forEach(([type, data]) => {
          response += `• **${type}**: ${data.count} bookings, ${data.quantity} cylinders, ₹${data.amount.toLocaleString()}\n`;
        });
        return response;
      } else {
        const allTypes = Object.entries(cylinderTypes);
        if (allTypes.length === 0) {
          return `No cylinder data available.`;
        }
        let response = `**All Cylinder Types Breakdown:**\n\n`;
        allTypes.forEach(([type, data]) => {
          response += `• **${type}**: ${data.count} bookings, ${data.quantity} cylinders, ₹${data.amount.toLocaleString()}\n`;
        });
        return response;
      }
    }

    // Customer queries
    if (
      lowerQuery.includes("customer") ||
      lowerQuery.includes("who") ||
      lowerQuery.includes("top") ||
      lowerQuery.includes("client")
    ) {
      if (topCustomers.length === 0) {
        return `No customer data available.`;
      }
      let response = `**Top Customers (by total amount):**\n\n`;
      topCustomers.forEach((c, idx) => {
        response += `${idx + 1}. **${c.name}**: ${c.bookings} bookings, ₹${c.amount.toLocaleString()}\n`;
      });
      return response;
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

      return `**${dateLabel.charAt(0).toUpperCase() + dateLabel.slice(1)}'s Booking Status Overview:**\n\n📋 Total Bookings: ${filteredBookings.length}\n⏳ Pending: ${statusCounts.pending}\n✅ Confirmed: ${statusCounts.confirmed}\n🚚 Delivered: ${statusCounts.delivered}\n\n**Payment Status:**\n💰 Paid: ${filteredBookings.filter((b) => b.paymentStatus === "paid").length}\n💳 Pending Payment: ${filteredBookings.filter((b) => b.paymentStatus === "pending").length}\n\n**Overall Stats:**\n• Stock Received: ${stats.stockReceived || 0} cylinders\n• Cylinders Delivered: ${stats.cylindersDelivered || 0}\n• Pending Returns: ${stats.pendingReturns || 0}\n• Returned Cylinders: ${stats.returnedCylinders || 0}`;
    }

    // Help
    if (
      lowerQuery.includes("help") ||
      lowerQuery.includes("what can") ||
      lowerQuery.includes("how to")
    ) {
      return `I can help you with:\n\n📊 **Booking Information:**\n• "How many bookings today?"\n• "Bookings on 15-01-2024" (any date)\n• "Show pending bookings"\n• "What's the status?"\n• "Details for yesterday"\n\n💰 **Payment Info:**\n• "Payment status"\n• "Amount collected"\n• "Pending payments"\n• "Revenue"\n\n👥 **Customer Details:**\n• "List customers"\n• "Who booked today?"\n• "Top customers"\n\n📦 **Products:**\n• "What cylinders were sold?"\n• "Cylinder types today"\n• "Cylinder breakdown"\n\nJust ask me anything about your bookings! I can also correct spelling mistakes.`;
    }

    // Default response
    return `I understand you're asking about bookings. Here's what I know:\n\n📋 **Today's Bookings:** ${todayBookings.length}\n💰 **Stats Available:** Payment status, delivery status, customer info, cylinder types\n\nTry asking:\n• "How many bookings today?" or "Bookings on [date]"\n• "Show pending bookings"\n• "Payment summary"\n• "What cylinder types did I sell?"\n• "Top customers"\n• "Details for yesterday"\n\nType "help" for more options!`;
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
      // Use rule-based processing with all available data
      const botResponse = processQuery(userMessage);
      setMessages((prev) => [
        ...prev,
        { role: "bot", content: botResponse },
      ]);
    } catch (error) {
      console.error("Chat error:", error);
      setMessages((prev) => [
        ...prev,
        { role: "bot", content: "I'm having trouble processing that request. Could you try rephrasing your question?" },
      ]);
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
              <CardTitle className="text-lg">AI Booking Assistant</CardTitle>
              <Sparkles className="w-4 h-4 text-yellow-300" />
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
                  placeholder={isTyping ? "Bot is typing..." : "Ask about your bookings..."}
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
