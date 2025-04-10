"use client";

import { SuggestedActions } from "@/components/suggested-actions";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { abortStream } from "@/lib/clients/streamChatClient";
import { Message } from "@/lib/types";
import { cn } from "@/lib/utils";
import { ArrowUp, Paperclip, Search, Server, Square } from "lucide-react";
import { useRef, useState } from "react";
import Textarea from "react-textarea-autosize";

interface ChatInputProps {
  chatId: string;
  userInput: string;
  handleInputChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  isLoading: boolean;
  messages: Message[] | undefined;
  appendAndTrigger: (message: Message) => Promise<void>;
  searchInternet?: boolean;
  setSearchInternet?: (value: boolean) => void;
  selectedFile?: File | null;
  setSelectedFile?: (file: File | null) => void;
  selectedModel?: string;
  setSelectedModel?: (model: string) => void;
}

export function ChatInput({
  chatId,
  userInput,
  handleInputChange,
  handleSubmit,
  isLoading,
  messages,
  appendAndTrigger,
  searchInternet = false,
  setSearchInternet = () => {},
  selectedFile = null,
  setSelectedFile = () => {},
  selectedModel = "",
  setSelectedModel = () => {},
}: ChatInputProps) {
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isComposing, setIsComposing] = useState(false);
  const [enterDisabled, setEnterDisabled] = useState(false);
  // Static list of available models
  const [availableModels] = useState<string[]>(['deepseek-r1:latest', 'gemma3:latest']);

  const model = selectedModel || "deepseek-r1:latest";
  const handleModelChange = (newModel: string) => {
    console.log('Model changed to:', newModel);
    setSelectedModel(newModel);
  };

  const handleCompositionStart = () => setIsComposing(true);

  const handleCompositionEnd = () => {
    setIsComposing(false);
    setEnterDisabled(true);
    setTimeout(() => {
      setEnterDisabled(false);
    }, 300);
  };
  
  const handleStop = () => {
    abortStream();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleFileButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleSearchInternetToggle = () => {
    setSearchInternet(!searchInternet);
  };

  const getFileDisplayName = () => {
    if (!selectedFile) return null;
    return selectedFile.name.length > 20
      ? selectedFile.name.substring(0, 17) + '...'
      : selectedFile.name;
  };

  return (
    <div
      className={cn(
        "mx-auto w-full",
        messages !== undefined && messages.length > 0
          ? "fixed bottom-0 left-0 right-0 bg-background"
          : "fixed bottom-6 left-0 right-0 top-6 flex flex-col items-center justify-center"
      )}
    >
      <form
        onSubmit={handleSubmit}
        className={cn(
          "max-w-3xl w-full mx-auto",
          messages !== undefined && messages.length > 0 ? "px-2 py-4" : "px-6"
        )}
      >
        {messages === undefined ||
          (messages.length === 0 && (
            <div className="mb-6">
              <SuggestedActions appendAndTrigger={appendAndTrigger} chatId={chatId} />
            </div>
          ))}
        <div className="relative flex flex-col w-full gap-2 bg-muted rounded-3xl border border-input">
          <Textarea
            ref={inputRef}
            name="input"
            rows={2}
            maxRows={5}
            tabIndex={0}
            onCompositionStart={handleCompositionStart}
            onCompositionEnd={handleCompositionEnd}
            placeholder="Ask a question..."
            spellCheck={false}
            value={userInput}
            className="resize-none w-full min-h-12 bg-transparent border-0 px-4 py-3 text-sm placeholder:text-muted-foreground focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            onChange={(e) => {
              handleInputChange(e);
            }}
            onKeyDown={(e) => {
              if (
                e.key === "Enter" &&
                !e.shiftKey &&
                !isComposing &&
                !enterDisabled
              ) {
                if (userInput.trim().length === 0) {
                  e.preventDefault();
                  return;
                }
                e.preventDefault();
                const textarea = e.target as HTMLTextAreaElement;
                textarea.form?.requestSubmit();
              }
            }}
          />

          {/* Bottom menu area */}
          <div className="flex items-center justify-between p-3">
            <div className="flex items-center gap-4">
              {/* File attachment */}
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      type="button"
                      size={"icon"}
                      variant={"ghost"}
                      className="rounded-full border border-primary dark:border-white p-2 flex items-center justify-center"
                      onClick={handleFileButtonClick}
                      disabled={isLoading}
                    >
                      <Paperclip size={18} className="text-primary dark:text-white" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Attach file (PDF, TXT)</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <input
                type="file"
                ref={fileInputRef}
                className="hidden"
                accept=".pdf,.txt"
                onChange={handleFileChange}
              />
              
              {/* Display selected file name */}
              {selectedFile && (
                <div className="text-xs text-muted-foreground flex items-center">
                  <span>{getFileDisplayName()}</span>
                  <Button
                    type="button"
                    size={"icon"}
                    variant={"ghost"}
                    className="h-5 w-5 ml-1"
                    onClick={() => setSelectedFile(null)}
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="12"
                      height="12"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M18 6 6 18" />
                      <path d="m6 6 12 12" />
                    </svg>
                  </Button>
                </div>
              )}

              {/* Search Internet toggle */}
              <div className="flex items-center space-x-2 p-[10px] rounded-md border border-border dark:border-gray-700 bg-background dark:bg-gray-900">
                <Switch
                  id="search-internet"
                  checked={searchInternet}
                  onCheckedChange={handleSearchInternetToggle}
                  disabled={isLoading}
                />
                <Label htmlFor="search-internet" className="text-xs text-muted-foreground flex items-center">
                  <Search size={14} className="mr-1" />
                  Search
                </Label>
              </div>
              
              {/* Model Selector */}
              {availableModels.length > 0 && (
                <div className="flex items-center space-x-2 px-2 py-1 rounded-md border border-border dark:border-gray-700 bg-background dark:bg-gray-900">
                  <Select value={model} onValueChange={handleModelChange} disabled={isLoading}>
                    <SelectTrigger className="h-8 w-[160px] text-xs border-0 bg-transparent focus:ring-0 focus:ring-offset-0">
                      <div className="flex items-center space-x-2">
                        <Server className="h-3.5 w-3.5" />
                        <SelectValue placeholder="Select model" />
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      {availableModels.map((modelName) => (
                        <SelectItem key={modelName} value={modelName}>
                          {modelName}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                type={isLoading ? "button" : "submit"}
                size={"icon"}
                variant={"ghost"}
                className={cn(
                  "rounded-full border border-primary dark:border-white p-2 flex items-center justify-center",
                  isLoading && "animate-pulse"
                )}
                disabled={(userInput.length === 0 && !selectedFile) && !isLoading}
                onClick={isLoading ? handleStop : undefined}
              >
                {isLoading ? 
                  <Square size={20} className="text-primary dark:text-white" /> : 
                  <ArrowUp size={20} className="text-primary dark:text-white" />
                }
              </Button>
            </div>
          </div>
        </div>
      </form>
    </div>
  );
}
