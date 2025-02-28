"use client"
import { KeyboardEvent, useEffect, useRef, useState } from "react";
import { Send, Copy, Brain, RefreshCcw, Edit, Mic } from "lucide-react";
import { useChat, useAudio } from "~/hooks"
import ReactMarkdown from "react-markdown";
import AudioPanel from "~/components/ui/AudioPanel";
import "~/app/globals.css"
const UiChat = () => {
  const { messages, sendMessage, setMessages, isLoading, isThinking, messagesEndRef } = useChat();
  const audio = useAudio(sendMessage);

  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const [content, setContent] = useState("");
  const [showThinking, setShowThinking] = useState(false);
  const [thinkingTime, setThinkingTime] = useState<number>(0);
  const thinkingStartTime = useRef<number | null>(null);
  const [editMode, setEditMode] = useState<boolean>(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [lastMessage, setLastMessage] = useState("")
  // Effect to speak the AI's latest response
  useEffect(() => {
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.role === "assistant" && typeof lastMessage.content === "string") {
      // Extract text content without thinking tags
      const plainContent = lastMessage.content.replace(/<think>[\s\S]*?<\/think>/g, "");
      if (plainContent && audio.isPanelOpen) {
        audio.speakResponse(plainContent);
      }
    }
  }, [messages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);
  useEffect(() => {
    setLastMessage(messagesEndRef && messagesEndRef.current ? messagesEndRef.current.innerText : "")
    setShowThinking(false);
  }, [showThinking]);

  const copyToClipBoard = async (text: string) => {
    await navigator.clipboard.writeText(text);
  };

  const handleKeyDown = async (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (editMode && editIndex !== null) {
        const updatedMessages = messages.map((msg, index) =>
          index === editIndex ? { ...msg, content: content } : msg
        );
        setMessages(updatedMessages);
        setEditMode(false);
        setEditIndex(null);
        setContent("");
      } else {
        if (content.trim()) {
          await sendMessage(content);
          setContent("");
        }
      }
    }
  };

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = "24px";
      inputRef.current.style.height = `${inputRef.current.scrollHeight}px`;
    }
  }, [content]);

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

  // Fixed refresh function
  const handleRefresh = async (index?: number) => {
    // If index is provided, use it; otherwise use the appropriate message for refresh
    const targetIndex = typeof index === 'number' 
      ? index 
      : (editIndex !== null ? editIndex : messages.length - 1);
    
    // Find the nearest user message before the target
    let userMessageIndex = targetIndex;
    while (userMessageIndex >= 0 && messages[userMessageIndex]?.role !== 'user') {
      userMessageIndex--;
    }
    
    if (userMessageIndex < 0) return; // No user message found
    
    // Get the user message content
    const userMessage = messages[userMessageIndex];
    const userMessageContent = typeof userMessage.content === 'string' 
      ? userMessage.content 
      : JSON.stringify(userMessage.content);
    
    // Remove all messages from the user message onward
    setMessages(prev => prev.slice(0, userMessageIndex));
    
    // Reset states
    setThinkingTime(0);
    setShowThinking(false);
    setEditMode(false);
    setEditIndex(null);
    
    // Set temporary content
    setContent(userMessageContent);
    
    // Wait a frame to ensure React updates the state
    setTimeout(() => {
      // Send the message to regenerate the response
      sendMessage(userMessageContent);
      // Clear input
      setContent("");
    }, 0);
  };

  const handleEdit = (index: number) => {
    const msgContent = messages[index].content;
    typeof msgContent === 'string' ? setContent(msgContent) : setContent(JSON.stringify(msgContent));
    setEditMode(true);
    setEditIndex(index);
  };

  useEffect(() => {
    const latestMessage = messages[messages.length - 1];
    if (latestMessage?.role === "assistant" && typeof latestMessage.content === "string") {
      const hasOpenThinkTag = /<think>[\s\S]*?/.test(latestMessage.content);
      if (!hasOpenThinkTag && thinkingStartTime.current) {
        const elapsedTime = (Date.now() - thinkingStartTime.current) / 1000;
        setThinkingTime(elapsedTime);
        thinkingStartTime.current = null;
      }
    }
  }, [messages]);

  // Start thinking timer when isThinking changes to true
  useEffect(() => {
    if (isThinking && !thinkingStartTime.current) {
      thinkingStartTime.current = Date.now();
    }
  }, [isThinking]);

  return (
    <div className="flex flex-col items-center justify-center w-full">
      <AudioPanel 
        isOpen={audio.isPanelOpen}
        onClose={audio.togglePanel}
        isRecording={audio.isRecording}
        isPlaying={audio.isPlaying}
        startRecording={audio.startRecording}
        stopRecording={audio.stopRecording}
        speakResponse={audio.speakResponse}
        lastResponse={(messages.length > 0 && messages[messages.length - 1]?.role === "assistant" && typeof messages[messages.length - 1].content === "string")
          ? typeof lastMessage.replace(/<think>[\s\S]*?<\/think>/g, "")
          : ""}
        userWaveform={audio.userWaveform}
        aiWaveform={audio.aiWaveform}
        audioPlayerRef={audio.audioPlayerRef}
        error={audio.audioError}
      />
      
      <div className="flex-1 overflow-y-auto p-4 w-full max-w-5xl mx-auto">
        {messages.map((msg, index) => {
          let processedContent = typeof msg.content === 'string' ? msg.content : JSON.stringify(msg.content);
          let thinkingContent: string[] = [];

          if (typeof msg.content === "string" && msg.role === "assistant") {
            const processed = processMessageContent(msg.content);
            processedContent = processed.processedContent;
            thinkingContent = processed.thinkingContent;
          }

          return (
            <div
              key={index}
              className={`flex m-4 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              <div
                className={`max-w-[80%] rounded-lg p-4 ${
                  msg.role === "user"
                    ? "bg-gray-600 text-white"
                    : "bg-gray-500 text-white justify-start"
                } break-words overflow-hidden`}
              >
                {typeof msg.content === "string" ? (
                  msg.role === "user" ? (
                    <div className="flex flex-col items-end gap-2">
                      <div className="text-right break-words whitespace-pre-wrap w-full">
                        {editMode && editIndex === index 
                          ? (<input type='text' className="chat-input w-full" value={content} onChange={(e) => setContent(e.target.value)} />)
                          : msg.content
                        }
                      </div>
                      <div className="flex flex-row gap-2">
                        <RefreshCcw onClick={() => handleRefresh(index)} className="h-4 w-4 text-gray-400 cursor-pointer hover:text-gray-200 cursor-pointer" />
                        <Edit onClick={() => handleEdit(index)} className="h-4 w-4 text-gray-400 cursor-pointer hover:text-gray-200 cursor-pointer" />
                      </div>
                    </div>
                  ) : (
                    <div className="w-full break-words whitespace-pre-wrap">
                      {isThinking && index === messages.length - 1 ? (
                        <div className="flex items-center gap-2 text-sm my-2 text-gray-400 animate-bounce">
                          <Brain size={20} className="h-4 w-4 text-gray-400 cursor-pointer hover:text-gray-200" />
                          <span>Thinking... {thinkingTime ? `Thinking for ${thinkingTime.toFixed(2)} seconds` : ''}</span>
                        </div>
                      ) : (
                        processedContent.split(/{{THINKING_SECTION_(\d+)}}/).map((part, idx) => {
                          if (idx % 2 === 0) {
                            return (
                            <div  className="break-words whitespace-pre-wrap">
                              <ReactMarkdown
                                key={`content-${idx}`}
                               
                                components={{
                                  code: ({ node, className, children, ...props }) => {
                                    const match = /language-(\w+)/.exec(className || '');
                                    return match ? (
                                      <div className="bg-gray-800 rounded my-2 overflow-x-auto text-#cf0 w-full">
                                        <pre className="p-4 text-sm w-full">
                                          <code className={`${className} w-full block text-left`} {...props}>
                                            {children}
                                          </code>
                                          <div className="flex justify-end">
                                            <Copy
                                              className="h-4 w-4 text-gray-400 cursor-pointer hover:text-gray-200 cursor-pointer"
                                              onClick={() => copyToClipBoard(children?.toString() || "")}
                                            />
                                          </div>
                                        </pre>
                                      </div>
                                    ) : (
                                      <code className="bg-gray-700 px-1 py-0.5 rounded text-sm" {...props}>
                                        {children}
                                      </code>
                                    );
                                  },
                                  p: ({ children }) => {
                                    const childText = children?.toString() || "";
                                    const isShortHeading = childText.length < 100 && !childText.includes("\n");

                                    return isShortHeading ?
                                      <p className="mb-2 text-left">{children}</p> :
                                      <p className="mb-2 text-left">{children}</p>;
                                  },
                                  ul: ({ children }) => <ul className="list-disc pl-5 mb-2 text-left">{children}</ul>,
                                  ol: ({ children }) => <ol className="list-decimal pl-5 mb-2 text-left">{children}</ol>,
                                  a: ({ href, children }) => (
                                    <a
                                      href={href}
                                      className="text-blue-300 hover:underline"
                                      target="_blank"
                                      rel="noopener noreferrer"
                                    >
                                      {children}
                                    </a>
                                  ),
                                  blockquote: ({ children }) => (
                                    <blockquote className="bg-gray-700 p-4 my-4 border-l-4 border-gray-300 text-left">
                                      {children}
                                    </blockquote>
                                  )
                                }}
                              >
                                {part}
                              </ReactMarkdown>
                            </div>
                            );
                          } else {
                            const thinkIndex = parseInt(part, 10);
                            const thinkContent = thinkingContent[thinkIndex];

                            if (thinkContent) {
                              return (
                                <div key={`think-${idx}`} className="relative">
                                  {showThinking ? (
                                    <div className="bg-gray-700 p-6 text-left rounded-md my-2 text-gray-300 border-l-4 border-gray-500 thinking-animation">
                                      {thinkingTime ? (
                                        <div className="flex items-center gap-2 text-sm my-2 cursor-pointer"
                                          onClick={() => setShowThinking(!showThinking)}
                                        >
                                          <Brain size={20} className="h-4 w-4 text-gray-400 cursor-pointer hover:text-gray-200" />
                                          <span>Thought for {thinkingTime.toFixed(2)} seconds</span>
                                        </div>
                                      ) : (
                                        <div className="flex items-center my-2 cursor-pointer"
                                          onClick={() => setShowThinking(!showThinking)}
                                        >
                                          <Brain size={20} className="h-4 w-4 text-gray-400 cursor-pointer hover:text-gray-200" />
                                        </div>
                                      )}

                                    <div className="break-words whitespace-pre-wrap">
                                      <ReactMarkdown >
                                        {thinkContent}
                                      </ReactMarkdown>
                                    </div>
                                    </div>
                                  ) : (
                                    <div
                                      className="flex items-center gap-2 text-sm my-2 cursor-pointer"
                                      onClick={() => setShowThinking(true)}
                                    >
                                      <Brain size={16} className={isLoading ? 'animate-pulse text-white' : 'h-4 w-4 text-gray-400 cursor-pointer hover:text-gray-200'} />
                                      <span>Click to reveal thought process</span>
                                    </div>
                                  )}
                                </div>
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
        })}
        <div ref={messagesEndRef} />
      </div>
      <div className="p-4 bottom-0 fixed w-full bg-gray-900/80 border-t border-gray-800">
        <div className="relative max-w-4xl mx-auto w-full">
          <textarea
            ref={inputRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Message..."
            className="chat-input w-full"
            rows={1}
          />
          
          {/* Voice chat button */}
          <button
            onClick={audio.togglePanel}
            className={`absolute right-12 bottom-2 p-1 rounded-md ${
              audio.isPanelOpen
                ? "text-blue-500"
                : "text-gray-600 hover:bg-gray-100"
            }`}
            aria-label="Voice chat"
          >
            <Mic size={22} className={audio.isRecording ? "text-red-500 animate-pulse" : ""} />
          </button>
          
          {/* Send message button */}
          <button
            onClick={() => {
              if (content.trim()) {
                sendMessage(content);
                setContent("");
              }
            }}
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
    </div>
  );
};

export default UiChat