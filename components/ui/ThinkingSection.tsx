"use client"
import ReactMarkdown from "react-markdown";
import { Brain } from "lucide-react"
import "~/app/globals.css"

const ThinkingSection = ({ 
  thinkContent, 
  thinkingTime, 
  showThinking, 
  setShowThinking, 
  isLoading 
}: { 
  thinkContent: string, 
  thinkingTime: number, 
  showThinking: boolean, 
  setShowThinking: (show: boolean) => void, 
  isLoading: boolean 
}) => {

  if (showThinking) {
    return (
      <div className="bg-gray-700 p-6 text-left rounded-md my-2 text-gray-300 border-l-4 border-gray-500 thinking-animation max-w-full overflow-auto">
        {thinkingTime ? (
          <div 
            className="flex items-center gap-2 text-sm my-2"
            onClick={() => setShowThinking(false)}
          >
            <Brain size={20} className="h-4 w-4 text-gray-400 cursor-pointer hover:text-gray-200" />
            <span>Thought for {thinkingTime.toFixed(2)} seconds</span>
          </div>
        ) : (
          <div 
            className="flex items-center my-2"
            onClick={() => setShowThinking(false)}
          >
            <Brain size={20} className="h-4 w-4 text-gray-400 cursor-pointer hover:text-gray-200" />
          </div>
        )}
      <div  className="break-words whitespace-pre-wrap">
        <ReactMarkdown>
          {thinkContent}
        </ReactMarkdown>
      </div>
      </div>
    );
  }
  
  return (
    <div
      className="flex items-center gap-2 text-sm my-2 cursor-pointer"
      onClick={() => setShowThinking(true)}
    >
      <Brain 
        size={16} 
        className={isLoading ? 'animate-pulse text-white' : 'h-4 w-4 text-gray-400 cursor-pointer hover:text-gray-200'} 
      />
      <span>Click to reveal thought process</span>
    </div>
  );
};

export default ThinkingSection