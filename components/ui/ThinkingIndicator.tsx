"use client"
import { Brain } from 'lucide-react'
import "~/app/globals.css"

const ThinkingIndicator = ({ thinkingTime }: { thinkingTime: number }) => (
  <div className="flex items-center gap-2 text-sm my-2 text-gray-400 animate-bounce">
    <Brain size={20} className="h-4 w-4 text-gray-400 cursor-pointer hover:text-gray-200" />
    <span>
      Thinking... {thinkingTime ? `Thinking for ${thinkingTime.toFixed(2)} seconds` : ''}
    </span>
  </div>
);

export default ThinkingIndicator