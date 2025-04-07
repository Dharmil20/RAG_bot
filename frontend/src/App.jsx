import { useEffect, useRef, useState } from "react";
import ChatInput from "./components/ChatInput";
import { BackgroundLines } from "./components/ui/BackgroundLines";

function App() {
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);

  const handleSendMessage = (userMessage, botResponse) => {
    setMessages((prev) => [
      ...prev,
      { sender: "user", text: userMessage },
      { sender: "bot", text: botResponse },
    ]);
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="flex flex-col h-screen bg-black text-white">
      {/* Message container */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-2 max-w-2xl w-full mx-auto">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-20"></div>
        ) : (
          messages.map((msg, i) => (
            <div
              key={i}
              className={`p-3 rounded-lg max-w-[80%] break-words ${
                msg.sender === "user"
                  ? "bg-[#1e1e1e] text-white ml-auto"
                  : "bg-transparent text-white border border-gray-600 mr-auto"
              }`}
            >
              {msg.text}
            </div>
          ))
        )}

        {/* Auto-scroll anchor */}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input at bottom */}
      <div className="w-full px-4 py-3 border-t border-gray-800 bg-[#0e0e0e]">
        <ChatInput onSendMessage={handleSendMessage} />
      </div>
    </div>
  );
}

export default App;
