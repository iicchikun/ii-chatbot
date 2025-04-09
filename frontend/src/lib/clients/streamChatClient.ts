import { Message } from "@/lib/types";
import { generateUUID } from "@/lib/utils";
import { fetchEventSource } from "@microsoft/fetch-event-source";

const apiUrl =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000/chat/stream";

// Create a global controller that can be accessed by the stop function
let currentController: AbortController | null = null;

// Function to abort the current stream
export const abortStream = () => {
  if (currentController) {
    currentController.abort();
    currentController = null;
  }
};

export const streamChat = async ({
  inputContent,
  searchInternet,
  selectedFile,
  selectedModel,
  setIsLoading,
  append,
}: {
  inputContent: string;
  searchInternet?: boolean;
  selectedFile?: File | null;
  selectedModel?: string;
  setIsLoading: (isLoading: boolean) => void;
  append: (message: Message) => void;
}) => {
  // Create a new AbortController for this request
  if (currentController) {
    // If there's an existing controller, abort it first
    currentController.abort();
  }
  currentController = new AbortController();
  try {
    setIsLoading(true);
    
    // We don't need to create a separate message here as the user message is already created in chat.tsx
    // We just need to ensure we pass the file and search internet flag to the backend

    // Handle streaming response
    let endpoint = apiUrl;
    let body;
    // Use a more flexible type for headers
    let headers: Record<string, string> = {
      Accept: "text/event-stream",
      "Content-Type": "application/json",
    };
    
    // Determine which endpoint to use based on whether we have a file or need to search internet
    if (selectedFile || searchInternet) {
      endpoint = apiUrl.replace('/chat/stream', '/chat/stream-with-context');
      
      // Use FormData for file uploads and search internet
      body = new FormData();
      body.append('query', inputContent);
      
      if (selectedFile) {
        body.append('file', selectedFile);
      }
      
      if (searchInternet) {
        body.append('search_internet', searchInternet.toString());
      }
      
      // Add selected model if available
      if (selectedModel) {
        body.append('model', selectedModel);
      }
      
      console.log('Sending model in form data:', selectedModel);
      
      // Don't set Content-Type for FormData, let the browser set it with the boundary
      headers = { Accept: "text/event-stream" } as Record<string, string>;
    } else {
      // Standard JSON body for regular queries - include model in the body
      body = JSON.stringify({ 
        query: inputContent,
        model: selectedModel
      });
      
      console.log('Sending request with model in body:', selectedModel);
      console.log('Complete request payload:', body);
      
      // Log selected model from different parts to help debug
      console.log('Model check - selectedModel param:', selectedModel);
      console.log('Model check - parsed JSON:', JSON.parse(body).model);
    }
    
    await fetchEventSource(endpoint, {
      method: "POST",
      headers,
      body,
      signal: currentController.signal,
      onopen: async (res) => {
        if (res.ok && res.status === 200) {
          console.log("Connection made ", res);
        } else if (
          res.status >= 400 &&
          res.status < 500 &&
          res.status !== 429
        ) {
          console.log("Client side error ", res);
        }
        return Promise.resolve();
      },
      onmessage(event) {
        console.log(`${event.data}`);
        const data = JSON.parse(event.data);
        
        // Handle first chunk with search sources
        if (data["search_sources"] && Array.isArray(data["search_sources"])) {
          const searchSources = data["search_sources"];
          if (searchSources.length > 0) {
            const sourcesMessage: Message = {
              id: generateUUID(),
              content: "",
              role: "assistant",
              searchSources: searchSources,
              model: data["model"],
              parts: [{ type: "text", text: "" }],
            };
            append(sourcesMessage);
          }
          // If this chunk only contained search sources but no content, we don't need to create another message
          if (!data["content"]) return;
        }
        
        // Create or update message with content
        const content: Message = {
          id: generateUUID(),
          content: data["content"],
          role: "assistant",
          model: data["model"],
          parts: [{ type: "text", text: data["content"] }],
        };

        append(content);
      },
      onclose() {
        console.log("Connection closed by the server");
      },
      onerror(err) {
        console.log("There was an error from server", err);
      },
    });
  } catch (err: unknown) {
    if (err instanceof Error) {
      if (err.name === 'AbortError') {
        console.log('Request was aborted');
      } else {
        console.log(`Error when streaming services. Details: ${err.message}`);
      }
    } else {
      console.log(`Unknown error occurred: ${String(err)}`);
    }
  } finally {
    setIsLoading(false);
    // Reset the controller when done
    currentController = null;
  }
};
