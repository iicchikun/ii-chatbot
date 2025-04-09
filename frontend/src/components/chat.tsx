"use client";

import { ChatInput } from "@/components/chat-input";
import { streamChat } from "@/lib/clients/streamChatClient";
import { Message } from "@/lib/types";
import { fillMessageParts, generateUUID } from "@/lib/utils";
import { useCallback, useEffect, useRef, useState } from "react";
import useSWR from "swr";
import ChatMessage from "./chat-message";

export function Chat({ id }: { id: string }) {
  // Input state and handlers.
  const initialInput = "";
  const [inputContent, setInputContent] = useState<string>(initialInput);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [searchInternet, setSearchInternet] = useState<boolean>(false);
  const [selectedModel, setSelectedModel] = useState<string>("deepseek-r1:latest");

  // Store the chat state in SWR, using the chatId as the key to share states.
  const { data: messages, mutate } = useSWR<Message[]>([id, "messages"], null, {
    fallbackData: [],
  });

  // Keep the latest messages in a ref.
  const messagesRef = useRef<Message[]>(messages || []);
  useEffect(() => {
    messagesRef.current = messages || [];
  }, [messages]);

  const setMessages = useCallback(
    (messages: Message[] | ((messages: Message[]) => Message[])) => {
      if (typeof messages === "function") {
        messages = messages(messagesRef.current);
      }

      const messagesWithParts = fillMessageParts(messages);
      mutate(messagesWithParts, false);
      messagesRef.current = messagesWithParts;
    },
    [mutate]
  );

  // Append function
  const append = useCallback(
    async (message: Message) => {
      return new Promise<string | null | undefined>((resolve) => {
        setMessages((draft) => {
          const lastMessage = draft[draft.length - 1];

          if (
            lastMessage?.role === "assistant" &&
            message.role === "assistant"
          ) {
            // Append to the last assistant message
            const updatedMessage = {
              ...lastMessage,
              content: lastMessage.content + message.content,
            };

            resolve(updatedMessage.content); // Resolve with the updated content
            return [...draft.slice(0, -1), updatedMessage];
          } else {
            // Add a new message
            resolve(message.content); // Resolve with the new content
            return [...draft, message];
          }
        });
      });
    },
    [setMessages]
  );

  // Append function
  const appendAndTrigger = useCallback(
    async (message: Message) => {
      const inputContent: string = message.content;
      await append(message);
      return await streamChat({ inputContent, setIsLoading, append });
    },
    [setIsLoading, append]
  );

  // handlers
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInputContent(e.target.value);
  };

  const handleSubmit = useCallback(
    async (event?: { preventDefault?: () => void }) => {
      event?.preventDefault?.();

      if (!inputContent) return;

      // Create file attachment metadata if a file is attached
      let fileAttachment;
      if (selectedFile) {
        fileAttachment = {
          fileName: selectedFile.name,
          fileSize: selectedFile.size,
          fileType: selectedFile.type,
        };
      }

      // Create user message with attachment and search metadata
      const newMessage: Message = {
        id: generateUUID(),
        content: inputContent,
        role: "user",
        fileAttachment,
        usedWebSearch: searchInternet,
      };
      append(newMessage);

      setInputContent("");

      // Reset the file after sending if any
      if (selectedFile) {
        setSelectedFile(null);
      }

      await streamChat({ 
        inputContent,
        searchInternet, 
        selectedFile,
        selectedModel,
        setIsLoading, 
        append 
      });
    },
    [inputContent, setInputContent, setIsLoading, append, searchInternet, selectedFile, setSelectedFile, selectedModel]
  );

  // handle form submission functionality
  const onSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    handleSubmit(e);
  };

  return (
    <div className="flex flex-col w-full max-w-3xl pt-14 pb-60 mx-auto stretch">
      <ChatMessage isLoading={isLoading} messages={messages} />

      <ChatInput
        chatId={id}
        userInput={inputContent}
        handleInputChange={handleInputChange}
        handleSubmit={onSubmit}
        isLoading={isLoading}
        messages={messages}
        appendAndTrigger={appendAndTrigger}
        searchInternet={searchInternet}
        setSearchInternet={setSearchInternet}
        selectedFile={selectedFile}
        setSelectedFile={setSelectedFile}
        selectedModel={selectedModel}
        setSelectedModel={setSelectedModel}
      />
    </div>
  );
}
