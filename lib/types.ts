import type { ModelId } from "./plans";
import type { PersonalityId } from "./personalities";

export type Role = "user" | "assistant" | "system";

export interface AttachedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  content: string;
  kind: "text" | "image";
  autoConverted?: boolean;
}

export interface Message {
  id: string;
  role: Role;
  content: string;
  attachments?: AttachedFile[];
}

export interface Chat {
  id: string;
  title: string;
  messages: Message[];
  modelId: ModelId;
  personality: PersonalityId;
  createdAt: number;
  /* 🕵️ چت مخفی */
  ephemeral?: boolean;
  expiresAt?: number;
}