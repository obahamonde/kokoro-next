"use client"
import { RefreshCcw, Edit, Trash2Icon } from "lucide-react";
import "~/app/globals.css"
interface MessageActionsProps {
  index: number;
  onEditMessage: (index: number) => void;
  onRefreshMessage: () => void;
  onDeleteMessage: () => void; // Added onDeleteMessage function prop for deleting a message.
}

const MessageActions: React.FC<MessageActionsProps> = ({
  index,
  onEditMessage,
  onRefreshMessage,
  onDeleteMessage
}) => {
  return (
    <div className="flex flex-row gap-2">
      <Trash2Icon onClick={onDeleteMessage} className="h-4 w-4 text-gray-400 cursor-pointer hover:text-gray-200 cursor-pointer"/>
      <RefreshCcw onClick={onRefreshMessage} className="h-4 w-4 text-gray-400 cursor-pointer hover:text-gray-200 cursor-pointer" />
      <Edit onClick={() => onEditMessage(index)} className="h-4 w-4 text-gray-400 cursor-pointer hover:text-gray-200 cursor-pointer" />
    </div>
  );
};

export default MessageActions;