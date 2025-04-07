import { useState } from "react";
import { FiPlus, FiSend } from "react-icons/fi";
import { FaRegStopCircle } from "react-icons/fa";
import FileUploadButton from "./FileUploadButton";

function ChatInput({ onSendMessage }) {
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim()) return;

    try {
      setIsSending(true);
      const response = await fetch("http://localhost:8000/query", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question: message }),
      });

      if (!response.ok) throw new Error("Network response was not ok");

      const data = await response.json();
      onSendMessage(message, data.answer);
      setMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
      onSendMessage(message, "Sorry, I couldn't process your request.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="bg-[#1e1e1e] text-gray-300 p-3 rounded-full w-full max-w-[800px] mx-auto">
      <form onSubmit={handleSubmit} className="w-full">
        <div className="flex items-center justify-between relative">
          <input
            type="text"
            placeholder="Ask anything"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="bg-transparent text-gray-200 w-full outline-none text-base mx-5"
            disabled={isSending} // Disable input while sending
          />

          <div className="flex items-center gap-2">
            <FileUploadButton disabled={isSending} />
            <button
              type="submit"
              disabled={!message.trim() || isSending}
              className="p-1 rounded-full hover:bg-gray-700 disabled:opacity-50"
            >
              {isSending ? (
                <FaRegStopCircle className="text-3xl animate-pulse" />
              ) : (
                <FiSend className="text-2xl" />
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default ChatInput;