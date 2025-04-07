// App.jsx
import { useState } from 'react';
import ChatInput from "./components/ChatInput";
import { BackgroundLines } from "./components/ui/BackgroundLines";

function App() {
  const [messages, setMessages] = useState([]);

  const handleSendMessage = (userMessage, botResponse) => {
    setMessages(prev => [
      ...prev,
      { sender: 'user', text: userMessage },
      { sender: 'bot', text: botResponse }
    ]);
  };

  return (
    <>
      <div className="flex flex-col">
        <BackgroundLines className="flex items-center justify-center w-full flex-col px-4">
          {/* Message display area */}
          <div className="w-full max-w-2xl mb-4 space-y-2">
            {messages.map((msg, i) => (
              <div 
                key={i} 
                className={`p-3 rounded-lg ${msg.sender === 'user' 
                  ? 'bg-blue-500 text-white ml-auto' 
                  : 'bg-gray-200 text-gray-800 mr-auto'}`}
              >
                {msg.text}
              </div>
            ))}
          </div>
          
          <ChatInput onSendMessage={handleSendMessage} />
        </BackgroundLines>
      </div>
    </>
  );
}

export default App;