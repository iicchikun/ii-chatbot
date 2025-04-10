import { generateUUID } from "@/lib/utils";
import { redirect } from 'next/navigation';

export default function ChatRedirectPage() {
  const newChatId = generateUUID();
  redirect(`/chat/${newChatId}`);
}
