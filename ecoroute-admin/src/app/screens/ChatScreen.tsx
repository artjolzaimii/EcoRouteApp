import { useState } from "react";
import { useNavigate, useParams } from "react-router";
import { motion } from "motion/react";
import {
  ArrowLeft,
  Send,
  BadgeCheck,
  Star,
  Image as ImageIcon,
  Smile,
} from "lucide-react";

const sellerProfiles: Record<string, {
  name: string;
  avatar: string;
  rating: number;
  verified: boolean;
  status: string;
}> = {
  "EcoGear Store": {
    name: "EcoGear Store",
    avatar: "🏪",
    rating: 4.8,
    verified: true,
    status: "online",
  },
  "GreenLife Co": {
    name: "GreenLife Co",
    avatar: "🌿",
    rating: 4.9,
    verified: true,
    status: "online",
  },
  "Local Brew Network": {
    name: "Local Brew Network",
    avatar: "☕",
    rating: 4.6,
    verified: true,
    status: "away",
  },
};

const initialMessages = [
  {
    id: 1,
    sender: "seller",
    message: "Hi! Thanks for your interest. How can I help you today?",
    time: "10:23 AM",
  },
  {
    id: 2,
    sender: "user",
    message: "Hi! I'm interested in the Premium Bike Lock. Is it still available?",
    time: "10:24 AM",
  },
  {
    id: 3,
    sender: "seller",
    message:
      "Yes, it's in stock! We have 15 units available right now. Would you like to know more about it?",
    time: "10:25 AM",
  },
  {
    id: 4,
    sender: "user",
    message: "Great! Can I negotiate on the price?",
    time: "10:26 AM",
  },
  {
    id: 5,
    sender: "seller",
    message:
      "Sure! The listed price is 1200 points. What were you thinking?",
    time: "10:27 AM",
  },
];

export default function ChatScreen() {
  const navigate = useNavigate();
  const { sellerName } = useParams();
  const [messages, setMessages] = useState(initialMessages);
  const [newMessage, setNewMessage] = useState("");

  const seller = sellerProfiles[decodeURIComponent(sellerName || "")] || sellerProfiles["EcoGear Store"];

  const handleSend = () => {
    if (!newMessage.trim()) return;

    setMessages([
      ...messages,
      {
        id: messages.length + 1,
        sender: "user",
        message: newMessage,
        time: new Date().toLocaleTimeString("en-US", {
          hour: "numeric",
          minute: "2-digit",
        }),
      },
    ]);
    setNewMessage("");

    // Simulate seller response
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: prev.length + 1,
          sender: "seller",
          message:
            "Thanks for your message! I'll get back to you shortly.",
          time: new Date().toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
          }),
        },
      ]);
    }, 1500);
  };

  return (
    <div className="h-screen w-full max-w-[430px] mx-auto bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white px-6 pt-6 pb-4 shadow-sm">
        <div className="flex items-center gap-3">
          <motion.button
            onClick={() => navigate(-1)}
            whileTap={{ scale: 0.95 }}
            className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700" />
          </motion.button>

          <div className="flex items-center gap-3 flex-1">
            <div className="relative">
              <div className="w-12 h-12 bg-gradient-to-br from-emerald-100 to-emerald-200 rounded-full flex items-center justify-center text-2xl">
                {seller.avatar}
              </div>
              {seller.status === "online" && (
                <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full" />
              )}
            </div>

            <div className="flex-1">
              <div className="flex items-center gap-1.5">
                <span className="text-gray-900 font-bold text-base">
                  {seller.name}
                </span>
                {seller.verified && (
                  <BadgeCheck
                    className="w-4 h-4 text-emerald-600"
                    fill="currentColor"
                  />
                )}
              </div>
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 text-yellow-500" fill="currentColor" />
                  <span className="text-gray-600 text-xs font-semibold">
                    {seller.rating}
                  </span>
                </div>
                <span className="text-gray-400 text-xs">•</span>
                <span className="text-emerald-600 text-xs font-semibold capitalize">
                  {seller.status}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
        {messages.map((msg) => (
          <motion.div
            key={msg.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`flex ${msg.sender === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[75%] ${
                msg.sender === "user"
                  ? "bg-emerald-600 text-white"
                  : "bg-white text-gray-900"
              } rounded-2xl px-4 py-3 shadow-sm`}
            >
              <p className="text-sm leading-relaxed">{msg.message}</p>
              <span
                className={`text-xs mt-1 block ${
                  msg.sender === "user" ? "text-emerald-100" : "text-gray-400"
                }`}
              >
                {msg.time}
              </span>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Quick Actions */}
      <div className="px-6 py-3 bg-white border-t border-gray-100">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {["Is this available?", "Can you negotiate?", "When can I pick it up?"].map(
            (quick) => (
              <button
                key={quick}
                onClick={() => setNewMessage(quick)}
                className="bg-gray-100 text-gray-700 text-xs font-semibold px-3 py-2 rounded-full whitespace-nowrap active:bg-gray-200"
              >
                {quick}
              </button>
            )
          )}
        </div>
      </div>

      {/* Input */}
      <div className="bg-white border-t border-gray-200 px-6 py-4 safe-area-bottom">
        <div className="flex items-end gap-3">
          <button className="w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center flex-shrink-0 active:bg-gray-200">
            <ImageIcon className="w-5 h-5 text-gray-600" />
          </button>

          <div className="flex-1 bg-gray-100 rounded-2xl px-4 py-2 flex items-center gap-2">
            <input
              type="text"
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && handleSend()}
              placeholder="Type a message..."
              className="flex-1 bg-transparent outline-none text-gray-900 placeholder-gray-500"
            />
            <button className="active:scale-95">
              <Smile className="w-5 h-5 text-gray-400" />
            </button>
          </div>

          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleSend}
            disabled={!newMessage.trim()}
            className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
              newMessage.trim()
                ? "bg-emerald-600 active:bg-emerald-700"
                : "bg-gray-300"
            }`}
          >
            <Send
              className={`w-5 h-5 ${newMessage.trim() ? "text-white" : "text-gray-500"}`}
            />
          </motion.button>
        </div>
      </div>
    </div>
  );
}
