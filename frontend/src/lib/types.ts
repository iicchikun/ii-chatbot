/**
 * AI SDK UI Messages. They are used in the client and to communicate between the frontend and the API routes.
 */
export interface Message {
  /**
    A unique identifier for the message.
     */
  id: string;

  /**
    The timestamp of the message.
     */
  createdAt?: Date;

  /**
    Text content of the message. Use parts when possible.
     */
  content: string;

  /**
    The 'data' role is deprecated.
     */
  role: "system" | "user" | "assistant";

  /**
   * Metadata for attached files (optional)
   */
  fileAttachment?: FileAttachment;

  /**
   * Flag to indicate if this message used web search
   */
  usedWebSearch?: boolean;

  /**
   * Web search sources (when search is used)
   */
  searchSources?: SearchSource[];

  /**
   * Ollama model used for this response
   */
  model?: string;

  /**
   * The parts of the message. Use this for rendering the message in the UI.
   *
   * Assistant messages can have text, reasoning and tool invocation parts.
   * User messages can have text parts.
   */
  // note: optional on the Message type (which serves as input)
  parts?: Array<TextUIPart | FileAttachmentUIPart>;
}

/**
 * A text part of a message.
 */
export type TextUIPart = {
  type: "text";

  /**
   * The text content.
   */
  text: string;
};

/**
 * File attachment metadata
 */
export interface FileAttachment {
  /**
   * The name of the attached file
   */
  fileName: string;
  
  /**
   * The size of the file in bytes
   */
  fileSize: number;
  
  /**
   * The type of the file (e.g. 'application/pdf')
   */
  fileType: string;
}

/**
 * A file attachment part of a message
 */
export type FileAttachmentUIPart = {
  type: "file_attachment";
  
  /**
   * File attachment metadata
   */
  fileAttachment: FileAttachment;
};

/**
 * Search parameters for internet search
 */
export interface SearchParams {
  /**
   * Whether to search the internet
   */
  searchInternet: boolean;
}

/**
 * Search source information
 */
export interface SearchSource {
  /**
   * Title of the search result
   */
  title: string;
  
  /**
   * URL link to the source
   */
  link: string;
}
