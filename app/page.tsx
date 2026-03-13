import ChatInterface from "@/components/ChatInterface";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="h-[calc(100vh-80px)]">
        <ChatInterface />
      </main>
    </div>
  );
}
