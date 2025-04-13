import { useEffect, useRef, useState } from "react";
import ChatInput from "./components/ChatInput";
import { BackgroundBeams } from "./components/ui/BackgroundBeams";
import { BackgroundGradient } from "./components/ui/background-gradient";

function App() {
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);
  
  const handleSendMessage = (userMessage, botResponseOrUpdater = "", isUpdate = false) => {
    setMessages((prev) => {
      // If this is a user message, always add it as a new message
      const newMessages = [...prev];
      
      if (userMessage) {
        newMessages.push({ sender: "user", text: userMessage });
        
        // If we have a bot response, add it as a new message too
        if (botResponseOrUpdater && typeof botResponseOrUpdater === 'string' && !isUpdate) {
          newMessages.push({ sender: "bot", text: botResponseOrUpdater });
        }
        return newMessages;
      }
      
      // If this is an update to an existing bot message
      if (isUpdate) {
        // Find the last bot message
        const lastBotIndex = newMessages.length - 1;
        
        if (lastBotIndex >= 0 && newMessages[lastBotIndex].sender === "bot") {
          // If botResponseOrUpdater is a function, use it to update the message
          if (typeof botResponseOrUpdater === 'function') {
            newMessages[lastBotIndex] = {
              ...newMessages[lastBotIndex],
              text: botResponseOrUpdater(newMessages[lastBotIndex].text)
            };
          } else {
            // Otherwise use it directly as the new text
            newMessages[lastBotIndex] = {
              ...newMessages[lastBotIndex],
              text: botResponseOrUpdater
            };
          }
        } else if (botResponseOrUpdater) {
          // If no bot message exists yet but we have a response, add it
          const newText = typeof botResponseOrUpdater === 'function' 
            ? botResponseOrUpdater("") 
            : botResponseOrUpdater;
          newMessages.push({ sender: "bot", text: newText });
        }
        return newMessages;
      } else {
        // Add new bot message (not an update)
        if (botResponseOrUpdater && typeof botResponseOrUpdater === 'string') {
          newMessages.push({ sender: "bot", text: botResponseOrUpdater });
        }
        return newMessages;
      }
    });
  };
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  return (
    <div className="relative flex flex-col h-screen bg-black text-white">
      {/* Header with logo */}
      <div className="w-full px-4 py-3 border-t border-gray-800 bg-[#0e0e0e] flex justify-center z-10">
        <div className="w-full max-w-md">
          <a href="https://www.djsce.ac.in/">
            <img
              src="/src/assets/djsce_logo.png"
              alt="DJSCE Logo"
              className="w-full h-auto object-contain"
            />
          </a>
        </div>
      </div>

      {/* Background beams (positioned absolutely behind content) */}
      <div className="absolute inset-0 -z-0 overflow-hidden">
        <BackgroundBeams />
      </div>

      {/* Message container */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-2 max-w-2xl w-full mx-auto z-10">
        {messages.length === 0 ? (
          <div className="text-center text-gray-500 mt-20"></div>
        ) : (
          messages.map((msg, i) => (
            <div
              key={i}
              className={`p-3 rounded-lg max-w-[80%] break-words backdrop-blur-sm ${
                msg.sender === "user"
                  ? "bg-[#1e1e1e]/80 text-white ml-auto"
                  : "bg-[#0e0e0e]/80 text-white border border-gray-600/50 mr-auto rounded-md bg-clip-padding backdrop-filter backdrop-blur-sm bg-opacity-10 "
              }`}
            >
              {msg.text}
            </div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Chat Input at bottom with proper BackgroundGradient */}
      <div className="w-full px-2 py-4 border-t border-gray-800 bg-[#0e0e0e]/80 backdrop-blur-sm z-10">
        <div className="max-w-[800px] mx-auto">
          <BackgroundGradient className="rounded-full">
            <div className="bg-[#1e1e1e] p-1 rounded-full relative z-10">
              <ChatInput onSendMessage={handleSendMessage} />
            </div>
          </BackgroundGradient>
        </div>
      </div>
    </div>
  );
}

export default App;