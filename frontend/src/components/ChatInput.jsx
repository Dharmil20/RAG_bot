import { useState } from "react";
import { FiPlus } from "react-icons/fi";
import FileUploadButton from "./FileUploadButton";

function ChatInput() {
  const [message, setMessage] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Message submitted:", message);
    setMessage("");
  };

  return (
    <div className="bg-[#1e1e1e] text-gray-300 p-4 rounded-lg w-full max-w-[800px] mx-auto flex">
      <form onSubmit={handleSubmit}>
        <div className="flex items-center relative">
          <input
            type="text"
            placeholder="Ask anything"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className="bg-transparent text-gray-200 w-full py-2 px-3 outline-none text-base"
          />
          <FileUploadButton></FileUploadButton>
          <div className="w-10 h-10 bg-red"></div>
        </div>
      </form>
    </div>
  );
}

export default ChatInput;
