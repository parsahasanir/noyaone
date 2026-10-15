import { Suspense } from "react";
import Sidebar from "@/components/Sidebar";
import ChatArea from "@/components/ChatArea";

export default function ChatPage() {
  return (
    <div className="flex h-screen w-full overflow-hidden">
      <Suspense fallback={null}>
        <Sidebar />
      </Suspense>
      <Suspense fallback={null}>
        <ChatArea />
      </Suspense>
    </div>
  );
}