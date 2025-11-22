export enum Sender {
  USER = 'user',
  AI = 'ai',
}

export interface Message {
  id: string;
  sender: Sender;
  text: string;
  attachments?: Attachment[];
  isThinking?: boolean;
  groundingMetadata?: GroundingMetadata;
}

export interface Attachment {
  type: 'image' | 'text';
  content: string; // Base64 for images, string for text
  mimeType: string;
  name: string;
}

export interface GroundingMetadata {
  searchEntryPoint?: {
    renderedContent?: string;
  };
  groundingChunks?: Array<{
    web?: {
      uri: string;
      title: string;
    };
  }>;
}

export enum AppStep {
  WELCOME = 'WELCOME',
  OFFER_COLLECTION = 'OFFER_COLLECTION',
  PROFILE_COLLECTION = 'PROFILE_COLLECTION',
  ANALYSIS = 'ANALYSIS',
}

export interface OfferData {
  id: string;
  description: string;
  files: Attachment[];
}

export interface UserProfile {
  description: string;
  files: Attachment[];
}