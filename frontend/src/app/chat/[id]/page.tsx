import { Chat } from '@/components/chat';

export default async function ChatPage({ params }: { params: { id: string } }) {
  const { id } = await params;

  return (
    <main className="flex flex-col h-full">
      <Chat id={id} />
    </main>
  );
}