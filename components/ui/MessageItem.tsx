"use client"
import { useState, useEffect, useRef } from "react";
import { ChatCompletionMessageParam } from "openai/resources";
import MessageActions from "./MessageActions";
import ThinkingSection from "./ThinkingSection";
import MarkdownRenderer from "./MarkdownRenderer";
import ThinkingIndicator from "./ThinkingIndicator";
import "~/app/globals.css"
interface MessageItemProps {
  message: ChatCompletionMessageParam;
  index: number;
  isThinking: boolean;
  isLoading: boolean;
  onEditMessage: (index: number) => void;
  onRefreshMessage: () => void;
  thinkingTime: number;
  setThinkingTime: (time: number) => void;
  editMode: boolean;
  content: string;
  setContent: (content: string) => void;
  onDeleteMessage: () => void;
}

const MessageItem: React.FC<MessageItemProps> = ({
  message,
  index,
  isThinking,
  isLoading,
  onEditMessage,
  onRefreshMessage,
  thinkingTime,
  setThinkingTime,
  editMode,
  content,
  setContent,
  onDeleteMessage
}) => {
  const [showThinking, setShowThinking] = useState(false);
  const thinkingStartTime = useRef<number | null>(null);

  // Process message content
  const processMessageContent = (content: string) => {
    const thinkRegex = /<think>([\s\S]*?)<\/think>/g;
    const thinkingContent = [];
    let match;
    let lastIndex = 0;
    let processedContent = "";

    while ((match = thinkRegex.exec(content)) !== null) {
      processedContent += content.substring(lastIndex, match.index);
      if (match[1].trim()) {
        thinkingContent.push(match[1]);
        processedContent += `{{THINKING_SECTION_${thinkingContent.length - 1}}}`;
      }
      lastIndex = match.index + match[0].length;
    }

    processedContent += content.substring(lastIndex);
    return { processedContent, thinkingContent };
  };

  const copyToClipBoard = async (text: string) => {
    await navigator.clipboard.writeText(text);
  };

  // Effect to track thinking time
  useEffect(() => {
    if (message.role === "assistant" && typeof message.content === "string") {
      const hasOpenThinkTag = /<think>[\s\S]*?/.test(message.content);
      if (hasOpenThinkTag && !thinkingStartTime.current) {
        thinkingStartTime.current = Date.now();
      } else if (!hasOpenThinkTag && thinkingStartTime.current) {
        const elapsedTime = (Date.now() - thinkingStartTime.current) / 1000;
        setThinkingTime(elapsedTime);
        thinkingStartTime.current = null;
      }
    }
  }, [message, setThinkingTime]);

  let processedContent = typeof message.content === 'string' ? message.content : JSON.stringify(message.content);
  let thinkingContent: string[] = [];

  if (typeof message.content === "string" && message.role === "assistant") {
    const processed = processMessageContent(message.content);
    processedContent = processed.processedContent;
    thinkingContent = processed.thinkingContent;
  }

  return (
    <div className={`flex m-4  bg-gray-500 w-full ${message.role === "user" ? "text-right" : "text-left"}`}>
      <div
        className={`min-w-[100%] rounded-xl sh-md p-4 ${
          message.role === "user"
            ? "bg-gray-600 text-white"
            : "bg-gray-500 text-white justify-start"
        }`}
      >
        {typeof message.content === "string" ? (
          message.role === "user" ? (
            <div className="col-end gap-2 ">
              {editMode ? (
                <input 
                  type='text' 
                  className="chat-input" 
                  value={content} 
                  onChange={(e) => setContent(e.target.value)} 
                />
              ) : message.content}
              <MessageActions 
                index={index} 
                onEditMessage={onEditMessage} 
                onRefreshMessage={onRefreshMessage}
                onDeleteMessage={onDeleteMessage}
              />
            </div>
          ) : (
            <div>
              {isThinking ? (
                <ThinkingIndicator thinkingTime={thinkingTime} />
              ) : (
                processedContent.split(/{{THINKING_SECTION_(\d+)}}/).map((part, idx) => {
                  if (idx % 2 === 0) {
                    return (
                      <MarkdownRenderer 
                        key={`content-${idx}`} 
                        content={part}
                        onCopy={copyToClipBoard}
                      />
                    );
                  } else {
                    const thinkIndex = parseInt(part, 10);
                    const thinkContent = thinkingContent[thinkIndex];

                    if (thinkContent) {
                      return (
                        <ThinkingSection
                          key={`think-${idx}`}
                          thinkContent={thinkContent}
                          thinkingTime={thinkingTime}
                          showThinking={showThinking}
                          setShowThinking={setShowThinking}
                          isLoading={isLoading}
                        />
                      );
                    }
                    return null;
                  }
                })
              )}
            </div>
          )
        ) : ""}
      </div>
    </div>
  );
};

export default MessageItem;