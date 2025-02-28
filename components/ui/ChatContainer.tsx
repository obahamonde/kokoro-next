"use client"
import { useState, useEffect } from "react";
import { useChat, useAudio } from "~/hooks";
import InputArea from "./InputArea";
import AudioPanel from "./AudioPanel";
import MessageList from "./MessageList";
import "~/app/globals.css"
const ChatContainer = () => {
  const { messages, sendMessage, setMessages, isLoading, isThinking, messagesEndRef } = useChat();
  const audio = useAudio(sendMessage);
  const [content, setContent] = useState("");
  const [editMode, setEditMode] = useState<boolean>(false);
  const [editIndex, setEditIndex] = useState<number | null>(null);
  const [lastContent, setLastContent] = useState("");
  
  useEffect(() => {
    if (messages.length > 0){
    const lastMessage = messages[messages.length - 1];
    if (lastMessage?.role === "assistant" && typeof lastMessage.content === "string") {
    
      const plainContent = lastMessage.content.replace(/<think>[\s\S]*?<\/think>/g, "");
      setLastContent(plainContent)
      if (plainContent && audio.isPanelOpen) {
        audio.speakResponse(plainContent);
      }
    else {
      const plainContent = JSON.stringify(lastMessage.content)
      setLastContent(plainContent) 
       if (plainContent && audio.isPanelOpen) {
          audio.speakResponse(plainContent);
        }
    }
   }
  }
}
, [messages]);


  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Fixed refresh function: only removes the last exchange
  const handleRefresh = async () => {
    const indexOf = editIndex? editIndex-2 : -2
    const plainContent = typeof content === "string" ? content : JSON.stringify(content);
    setMessages(prev => [...prev.slice(0,indexOf)])
    await sendMessage(plainContent);
  };

  const handleEdit = (index: number) => {
    const messageContent = messages[index].content;
    typeof messageContent === 'string' 
      ? setContent(messageContent) 
      : setContent(JSON.stringify(messageContent));
    setEditMode(true);
    setEditIndex(index);
  };

  const handleSendMessage = async () => {
    if (editMode && editIndex !== null) {
      const updatedMessages = messages.map((msg, index) =>
        index === editIndex ? { ...msg, content: content } : msg
      );
      setMessages(updatedMessages);
      setEditMode(false);
      setEditIndex(null);
    } else {
      await sendMessage(content);
    }
    setContent("");
  };

  const onDeleteMessage = async () => {
    const indexOf = editIndex? editIndex-2 : -2
    setMessages(prev => [...prev.slice(0, indexOf)])
  };

  return (
    <div className="flex flex-col h-full w-full overflow-hidden"> {/* Added overflow-hidden */}
      {audio.audioPlayerRef ? (<AudioPanel 
        isOpen={audio.isPanelOpen}
        onClose={audio.togglePanel}
        isRecording={audio.isRecording}
        isPlaying={audio.isPlaying}
        startRecording={audio.startRecording}
        stopRecording={audio.stopRecording}
        speakResponse={audio.speakResponse}
        lastResponse={lastContent}
        userWaveform={audio.userWaveform}
        aiWaveform={audio.aiWaveform}
        audioPlayerRef={audio.audioPlayerRef}
        error={audio.audioError || ""}
      />) : (<></>)}
      <div className="flex-1 w-full overflow-y-auto overflow-x-hidden"> {/* Added overflow-x-hidden */}
        <MessageList 
          onDeleteMessage={onDeleteMessage}
          messages={messages}
          isThinking={isThinking}
          isLoading={isLoading}
          onEditMessage={handleEdit}
          onRefreshMessage={handleRefresh}
          editMode={editMode}
          editIndex={editIndex}
          content={content}
          setContent={setContent}
          
        />
      </div>
      
      <InputArea
        content={content}
        setContent={setContent}
        isLoading={isLoading}
        onSendMessage={handleSendMessage}
        isRecording={audio.isRecording}
        isPanelOpen={audio.isPanelOpen}
        togglePanel={audio.togglePanel}
      />
      
      <div ref={messagesEndRef} />
    </div>
  );
};

export default ChatContainer;