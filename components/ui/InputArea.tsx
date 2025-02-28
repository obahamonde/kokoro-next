"use client"
import { useRef, useEffect, KeyboardEvent } from "react";
import { Send, Mic } from "lucide-react";
import "~/app/globals.css"
interface InputAreaProps {
  content: string;
  setContent: (content: string) => void;
  isLoading: boolean;
  onSendMessage: () => void;
  isRecording: boolean;
  isPanelOpen: boolean;
  togglePanel: () => void;
}

const InputArea: React.FC<InputAreaProps> = ({
  content,
  setContent,
  isLoading,
  onSendMessage,
  isRecording,
  isPanelOpen,
  togglePanel
}) => {
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "24px";
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
    }
  }, [content]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      onSendMessage();
    }
  };

  return (
    <div className="p-4 bottom-0 fixed w-full bg-gray-900 border-t border-gray-800">
      <div className="max-w-3xl mx-auto w-full relative"> {/* Changed to 3xl for consistency */}
        <textarea
          ref={inputRef}
          value={content}
          onChange={(e) => setContent(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Message..."
          className="w-full h-full z-50 resize-none rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2 pr-12 text-gray-800 dark:text-gray-500 min-h-[24px] max-h-32 overflow-y-hidden outline-none focus:bg-gray-100"
          rows={1}
        />
        
        {/* Voice chat button */}
        <button
          onClick={togglePanel}
          className={`absolute right-12 bottom-2 p-1 rounded-md ${
            isPanelOpen
              ? "text-blue-500"
              : "text-gray-600 hover:bg-gray-100"
          }`}
          aria-label="Voice chat"
        >
          <Mic size={22} className={isRecording ? "text-red-500 animate-pulse" : ""} />
        </button>
        
        {/* Send message button */}
        <button
          onClick={onSendMessage}
          disabled={isLoading}
          className={`absolute right-2 bottom-2 p-1 rounded-md ${
            isLoading
              ? "text-gray-400 cursor-not-allowed"
              : "text-gray-600 hover:bg-gray-100"
          }`}
          aria-label="Send message"
        >
          <Send size={22} />
        </button>
      </div>
    </div>
  );
};

export default InputArea;