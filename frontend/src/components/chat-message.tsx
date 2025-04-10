"use client";

import CodeDisplayBlock from "@/components/code-display-block";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Message, SearchSource } from "@/lib/types";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import { CheckIcon, CopyIcon, ExternalLinkIcon, GlobeIcon, PaperclipIcon, SearchIcon } from "lucide-react";
import { marked } from "marked";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Button } from "./ui/button";
import { Card } from "./ui/card";
import { AILogo, UserIcon } from "./ui/icons";

interface ChatMessageProps {
  messages: Message[] | undefined;
  isLoading: boolean;
}

export default function ChatMessage({ messages, isLoading }: ChatMessageProps) {
  const [copiedMessageId, setCopiedMessageId] = useState<number | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "end" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  if (messages === undefined || messages.length === 0) {
    return (
      <div className="w-full h-full flex justify-center items-center">
        <div className="flex flex-col gap-4 items-center"></div>
      </div>
    );
  }

  const copyResponseToClipboard = (code: string, messageId: number) => {
    navigator.clipboard.writeText(code);
    setCopiedMessageId(messageId);
    toast.success("Code copied to clipboard!");
    setTimeout(() => {
      setCopiedMessageId(null);
    }, 1500);
  };

  return (
    <div
      id="scroller"
      className="w-full overflow-y-scroll overflow-x-hidden h-full justify-end"
      style={{ height: "calc(100vh - 200px)" }}
    >
      <div className="w-full flex flex-col overflow-x-hidden overflow-y-hidden min-h-full justify-end">
        {messages.map((message, index) => (
          <motion.div
            key={index}
            layout
            initial={{ opacity: 0, scale: 1, y: 20, x: 0 }}
            animate={{ opacity: 1, scale: 1, y: 0, x: 0 }}
            exit={{ opacity: 0, scale: 1, y: 20, x: 0 }}
            transition={{
              opacity: { duration: 0.1 },
              layout: {
                type: "spring",
                bounce: 0.3,
                duration: messages.indexOf(message) * 0.05 + 0.2,
              },
            }}
            className={cn(
              "flex flex-col gap-2 p-4 whitespace-pre-wrap",
              message.role === "user" ? "items-end" : "items-start"
            )}
          >
            <div className="flex gap-3 items-center">
              {message.role === "user" && (
                <div className="flex items-end w-full gap-3">
                  <div className="flex flex-col gap-2 w-full">
                    <span
                      className="bg-accent p-3 rounded-md w-full max-w-xs sm:max-w-2xl overflow-x-auto"
                      dangerouslySetInnerHTML={{
                        __html: marked.parse(message.content),
                      }}
                    />
                    
                    {/* File attachment indicator */}
                    {message.fileAttachment && (
                      <div className="flex gap-2 items-center">
                        <Badge variant="outline" className="flex gap-1 items-center py-1">
                          <PaperclipIcon size={12} />
                          <span>File: {message.fileAttachment.fileName}</span>
                        </Badge>
                      </div>
                    )}
                    
                    {/* Web search indicator */}
                    {message.usedWebSearch && (
                      <div className="flex gap-2 items-center">
                        <Badge variant="outline" className="flex gap-1 items-center py-1">
                          <SearchIcon size={12} />
                          <span>Web search enabled</span>
                        </Badge>
                      </div>
                    )}
                  </div>

                  <Avatar className="flex justify-center items-center overflow-hidden w-12 h-12 rounded-full border-2 border-primary dark:border-white bg-transparent">
                    <UserIcon className="text-primary dark:text-white" />
                  </Avatar>
                </div>
              )}

              {message.role === "assistant" && (
                <div className="flex items-end gap-2 w-full max-w-3xl">
                  {isLoading &&
                    messages.indexOf(message) === messages.length - 1 ? (
                    <Avatar className="flex justify-center items-center overflow-hidden w-12 h-12 rounded-full border-2 border-primary dark:border-white bg-transparent">
                      <AILogo
                        className="object-contain text-primary dark:text-white"
                        width={28}
                        height={28}
                      />
                    </Avatar>
                  ) : (
                    <Avatar className="flex justify-center items-center overflow-hidden w-12 h-12 rounded-full border-2 border-primary dark:border-white bg-transparent">
                      <AILogo
                        className="object-contain text-primary dark:text-white"
                        width={28}
                        height={28}
                      />
                    </Avatar>
                  )}

                  <div className="flex flex-col gap-3 w-full">
                    {message.model && (
                      <div className="flex items-center">
                        <Badge variant="outline" className="text-xs">{message.model}</Badge>
                      </div>
                    )}
                  
                    {/* Display search sources if available */}
                    {message.searchSources && message.searchSources.length > 0 && (
                      <div className="flex flex-col gap-2 mb-2">
                        <div className="flex items-center gap-1">
                          <GlobeIcon size={14} className="text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">Sources:</span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {message.searchSources.map((source: SearchSource, idx: number) => (
                            <Card key={idx} className="p-2 text-xs flex flex-col gap-1 overflow-hidden">
                              <p className="font-medium truncate">{source.title}</p>
                              <a 
                                href={source.link} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-blue-500 hover:underline flex items-center gap-1 truncate"
                              >
                                <ExternalLinkIcon size={10} />
                                <span className="truncate">{source.link}</span>
                              </a>
                            </Card>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <span className="p-3 rounded-md max-w-full sm:max-w-full overflow-x-auto">
                    {/* Check if the message content contains a code block */}
                    {message.content.split("```").map((part, index) => {
                      if (index % 2 === 0) {
                        return (
                          <span
                            key={index}
                            dangerouslySetInnerHTML={{
                              __html: marked.parse(part),
                            }}
                          />
                        );
                      } else {
                        // Extract language from the code block (assuming first word is the lang)
                        const lines = part.split("\n");
                        const firstLine = lines[0].trim();
                        const detectedLang = /^[a-zA-Z]+$/.test(firstLine) ? firstLine : "plaintext"; // Default to 'plaintext' if no lang is specified
                        const codeContent = detectedLang === "plaintext" ? part : lines.slice(1).join("\n");

                        return (
                          <pre className="whitespace-pre-wrap" key={index}>
                            <CodeDisplayBlock code={codeContent} lang={detectedLang} />
                          </pre>
                        );
                      }
                    })}

                    {isLoading &&
                      messages.indexOf(message) === messages.length - 1 && (
                        <span className="animate-pulse" aria-label="Typing">
                          ...
                        </span>
                      )}

                    {/* Copy button inside the response container */}
                    {!isLoading && (
                      <Button
                        onClick={() =>
                          copyResponseToClipboard(message.content, index)
                        }
                        variant="ghost"
                        size="icon"
                        className="h-5 w-5"
                      >
                        {copiedMessageId === index ? (
                          <CheckIcon className="w-4 h-4 scale-100 transition-all" />
                        ) : (
                          <CopyIcon className="w-4 h-4 scale-100 transition-all" />
                        )}
                      </Button>
                    )}
                    </span>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        ))}
        {isLoading && (
          <div className="flex pl-4 pb-4 gap-2 items-center">
            <div className="bg-accent p-3 rounded-md max-w-xs sm:max-w-2xl overflow-x-auto">
              <div className="flex gap-1">
                <span className="size-1.5 rounded-full bg-slate-700 motion-safe:animate-[bounce_1s_ease-in-out_infinite] dark:bg-slate-300"></span>
                <span className="size-1.5 rounded-full bg-slate-700 motion-safe:animate-[bounce_0.5s_ease-in-out_infinite] dark:bg-slate-300"></span>
                <span className="size-1.5 rounded-full bg-slate-700 motion-safe:animate-[bounce_1s_ease-in-out_infinite] dark:bg-slate-300"></span>
              </div>
            </div>
          </div>
        )}
      </div>

      <div id="anchor" ref={bottomRef} className="my-4"></div>
    </div>
  );
}
