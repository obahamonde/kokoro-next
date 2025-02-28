import ChatContainer from "~/components/ui/ChatContainer";
import "~/app/globals.css"

export default function Home() {
  return (

      <main className="flex flex-col gap-8 flex flex-row items-start justify-start-2 items-center sm:items-start">
       <ChatContainer /> 
</main>
  );
}
