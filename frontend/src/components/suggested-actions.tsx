"use client";

import { Message } from "@/lib/types";
import { generateUUID } from "@/lib/utils";
import { motion } from "framer-motion";
import { memo } from "react";
import { Overview } from "./overview";
import { Button } from "./ui/button";

interface SuggestedActionsProps {
  chatId: string;
  appendAndTrigger: (message: Message) => Promise<void>;
}

function PureSuggestedActions({ chatId, appendAndTrigger }: SuggestedActionsProps) {
  const suggestedActions = [
    {
      title: "How to run",
      label: `Ollama model locally?`,
      action: `How to run Ollama model locally?`,
    },
    {
      title: "What are the benefits of",
      label: "RAG capabilities?",
      action: "What is RAG and what are the benefits of RAG capabilities?",
    },
    {
      title: "Help me write an essay",
      label: `about silicon valley`,
      action: `Help me write an essay about silicon valley`,
    },
    {
      title: "What is the weather",
      label: "in San Francisco?",
      action: "What is the weather in San Francisco?",
    },
  ];

  return (
    <div className="flex flex-col items-center gap-2 w-full max-w-3xl mx-auto p-4">
      {/* Overview Section */}
      <Overview />
      <div className="grid sm:grid-cols-2 gap-2 w-full">
        {suggestedActions.map((suggestedAction, index) => (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            transition={{ delay: 0.05 * index }}
            key={`suggested-action-${suggestedAction.title}-${index}`}
            className={index > 1 ? "hidden sm:block" : "block"}
          >
            <Button
              variant="ghost"
              onClick={async () => {
                window.history.replaceState({}, "", `/chat/${chatId}`);

                appendAndTrigger({
                  id: generateUUID(),
                  role: "user",
                  content: suggestedAction.action,
                });
              }}
              className="text-left border rounded-xl px-4 py-3.5 text-sm flex-1 gap-1 sm:flex-col w-full h-auto justify-start items-start"
            >
              <span className="font-medium">{suggestedAction.title}</span>
              <span className="text-muted-foreground">
                {suggestedAction.label}
              </span>
            </Button>
          </motion.div>
        ))}
      </div>
    </div>
  );
}

export const SuggestedActions = memo(PureSuggestedActions, () => true);
