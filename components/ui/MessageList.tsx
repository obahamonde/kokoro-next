"use client"
import { useState } from "react";
import { ChatCompletionMessageParam } from "openai/resources";
import MessageItem from "./MessageItem";
import "~/app/globals.css"
interface MessageListProps {
  messages: ChatCompletionMessageParam[];
  isThinking: boolean;
  isLoading: boolean;
  onEditMessage: (index: number) => void;
  onRefreshMessage: () => void;
  editMode: boolean;
  editIndex: number | null;
  content: string;
  setContent: (content: string) => void;
  onDeleteMessage: ()=> void;
}

const MessageList: React.FC<MessageListProps> = ({
  messages,
  isThinking,
  isLoading,
  onEditMessage,
  onRefreshMessage,
  editMode,
  editIndex,
  content,
  setContent,
  onDeleteMessage
}) => {
  const [thinkingTime, setThinkingTime] = useState<number>(0);
  
  return (
    <div className="w-full px-4 py-4"> {/* Full width with padding */}
      <div className="mx-auto w-full overflow-y-auto mb-24 overflow-x-hidden"> {/* Centered container with max width */}
        {messages.map((message, index) => (
          <MessageItem
            key={index}
            message={message}
            index={index}
            isThinking={isThinking && index === messages.length - 1}
            isLoading={isLoading}
            onEditMessage={onEditMessage}
            onRefreshMessage={onRefreshMessage}
            thinkingTime={thinkingTime}
            setThinkingTime={setThinkingTime}
            editMode={editMode && editIndex === index}
            content={content}
            setContent={setContent}
            onDeleteMessage={onDeleteMessage}
          />
        ))}
      </div>
    </div>
  );
};

export default MessageList;