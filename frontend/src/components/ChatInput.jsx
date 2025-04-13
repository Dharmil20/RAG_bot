import { useState, useRef, useCallback, useEffect } from "react";
import { FiSend } from "react-icons/fi";
import { FaRegStopCircle } from "react-icons/fa";
import FileUploadButton from "./FileUploadButton";
import { motion, AnimatePresence } from "framer-motion";
import { useMediaQuery } from "react-responsive";
import useWebSocket, { ReadyState } from 'react-use-websocket';
import { parseLines } from '../utils/textFormat';

export default function ChatInput({ onSendMessage }) {
  const [message, setMessage] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [animating, setAnimating] = useState(false);
  const [currentPlaceholder, setCurrentPlaceholder] = useState(0);
  const [botResponse, setBotResponse] = useState("");

  // WebSocket setup
  const { sendMessage, lastMessage, readyState } = useWebSocket('ws://localhost:8000/ws', {
    onOpen: () => console.log('WebSocket Connected'),
    onClose: () => console.log('WebSocket Disconnected'),
    onMessage: (event) => {
      const formattedText = parseLines(event.data);
      setBotResponse(prev => prev + formattedText);
      onSendMessage("", (prevText) => prevText + formattedText, true);
    },
    shouldReconnect: (closeEvent) => true,
  });

  // Check connection status
  const connectionStatus = {
    [ReadyState.CONNECTING]: 'Connecting',
    [ReadyState.OPEN]: 'Open',
    [ReadyState.CLOSING]: 'Closing',
    [ReadyState.CLOSED]: 'Closed',
    [ReadyState.UNINSTANTIATED]: 'Uninstantiated',
  }[readyState];

  // Check if device is mobile
  const isMobile = useMediaQuery({ maxWidth: 768 });


  // Responsive placeholders
  const placeholders = isMobile
    ? [
        "Credits per semester?",
        "Full form of DJSCE?",
        "Marks for continuous assessment?",
        "Sem V assessment marks?",
        "Subjects in sem V?",
      ]
    : [
        "How many credits does one semester contain?",
        "What is the full form of DJSCE?",
        "How many marks are allotted for continuous assessment?",
        "How many marks are allotted for continuous assessment for sem V?",
        "How many subjects are there in sem v and which are they?",
      ];

  // Placeholder cycling animation
  const intervalRef = useRef(null);
  const startAnimation = useCallback(() => {
    intervalRef.current = setInterval(() => {
      setCurrentPlaceholder((prev) => (prev + 1) % placeholders.length);
    }, 3000);
  }, [placeholders.length]);

  const handleVisibilityChange = () => {
    if (document.visibilityState !== "visible" && intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    } else if (document.visibilityState === "visible") {
      startAnimation();
    }
  };

  useEffect(() => {
    startAnimation();
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, [placeholders]);

  // Vanishing animation setup
  const canvasRef = useRef(null);
  const inputRef = useRef(null);
  const newDataRef = useRef([]);

  const draw = useCallback(() => {
    if (!inputRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = 800;
    canvas.height = 60;
    ctx.clearRect(0, 0, 800, 60);
    const computedStyles = getComputedStyle(inputRef.current);

    const fontSize = parseFloat(computedStyles.getPropertyValue("font-size"));
    ctx.font = `${fontSize * 2}px ${computedStyles.fontFamily}`;
    ctx.fillStyle = "#FFF";
    ctx.fillText(message, 16, 40);

    const imageData = ctx.getImageData(0, 0, 800, 60);
    const pixelData = imageData.data;
    const newData = [];

    for (let t = 0; t < 60; t++) {
      let i = 4 * t * 800;
      for (let n = 0; n < 800; n++) {
        let e = i + 4 * n;
        if (
          pixelData[e] !== 0 &&
          pixelData[e + 1] !== 0 &&
          pixelData[e + 2] !== 0
        ) {
          newData.push({
            x: n,
            y: t,
            color: [
              pixelData[e],
              pixelData[e + 1],
              pixelData[e + 2],
              pixelData[e + 3],
            ],
          });
        }
      }
    }

    newDataRef.current = newData.map(({ x, y, color }) => ({
      x,
      y,
      r: 1,
      color: `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${color[3]})`,
    }));
  }, [message]);

  useEffect(() => {
    draw();
  }, [message, draw]);

  const animate = (start) => {
    const animateFrame = (pos = 0) => {
      requestAnimationFrame(() => {
        const newArr = [];
        for (let i = 0; i < newDataRef.current.length; i++) {
          const current = newDataRef.current[i];
          if (current.x < pos) {
            newArr.push(current);
          } else {
            if (current.r <= 0) {
              current.r = 0;
              continue;
            }
            current.x += Math.random() > 0.5 ? 1 : -1;
            current.y += Math.random() > 0.5 ? 1 : -1;
            current.r -= 0.05 * Math.random();
            newArr.push(current);
          }
        }
        newDataRef.current = newArr;
        const ctx = canvasRef.current?.getContext("2d");
        if (ctx) {
          ctx.clearRect(pos, 0, 800, 60);
          newDataRef.current.forEach((t) => {
            const { x: n, y: i, r: s, color: color } = t;
            if (n > pos) {
              ctx.beginPath();
              ctx.rect(n, i, s, s);
              ctx.fillStyle = color;
              ctx.strokeStyle = color;
              ctx.stroke();
            }
          });
        }
        if (newDataRef.current.length > 0) {
          animateFrame(pos - 8);
        } else {
          setMessage("");
          setAnimating(false);
        }
      });
    };
    animateFrame(start);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!message.trim() || isSending || animating || readyState !== ReadyState.OPEN) return;
  
    // Start vanish animation
    setAnimating(true);
    draw();
  
    const maxX = newDataRef.current.reduce(
      (prev, current) => (current.x > prev ? current.x : prev),
      0
    );
    animate(maxX);
  
    try {
      setIsSending(true);
      const userMsg = message.trim();
      
      // Send the user message to display
      onSendMessage(userMsg);
      
      // Reset bot response
      setBotResponse("");
      
      // Create a new empty bot message that will be updated
      // Important: always create a new bot message for each user query
      onSendMessage("", "", true);
      
      // Send the message via WebSocket
      sendMessage(userMsg);
    } catch (error) {
      console.error("Error sending message:", error);
      onSendMessage("", "Sorry, I couldn't process your request.", true);
    } finally {
      setIsSending(false);
    }
  };

  return (
    <div className="bg-[#1e1e1e] text-gray-300 p-3 rounded-full w-full max-w-[800px] mx-auto relative">
      <form onSubmit={handleSubmit} className="w-full">
        <div className="flex items-center justify-between relative">
          <canvas
            className={`absolute pointer-events-none text-base transform scale-50 top-[25%] left-4 origin-top-left filter invert dark:invert-0 ${
              !animating ? "opacity-0" : "opacity-100"
            }`}
            ref={canvasRef}
          />

          {/* Input without placeholder - we'll handle placeholder separately */}
          <input
            type="text"
            placeholder=""
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            className={`bg-transparent text-gray-200 w-full outline-none text-base mx-5 ${
              animating ? "text-transparent" : ""
            }`}
            disabled={isSending || animating}
            ref={inputRef}
          />

          <div className="flex items-center gap-2">
            <FileUploadButton disabled={isSending || animating} />
            <button
              type="submit"
              disabled={!message.trim() || isSending || animating}
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

        {/* Custom placeholder animation - fixed to avoid overlapping */}
        {!message && !animating && (
          <div className="absolute top-0 left-0 right-0 bottom-0 flex items-center pointer-events-none">
            <AnimatePresence mode="wait">
              <motion.p
                initial={{
                  y: 5,
                  opacity: 0,
                }}
                key={`current-placeholder-${currentPlaceholder}`}
                animate={{
                  y: 0,
                  opacity: 0.7,
                }}
                exit={{
                  y: -15,
                  opacity: 0,
                }}
                transition={{
                  duration: 0.3,
                  ease: "linear",
                }}
                className="text-sm sm:text-base font-normal text-gray-400 ml-8 truncate"
              >
                {placeholders[currentPlaceholder]}
              </motion.p>
            </AnimatePresence>
          </div>
        )}
      </form>
    </div>
  );
}