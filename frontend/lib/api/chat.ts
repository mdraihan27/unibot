import { apiRequest } from "./client";
import { TokenStorage } from "./tokenStorage";
import type { ApiResponse } from "./types";

export interface SourceCitation {
  source_file: string;
  page?: number | string | null;
  similarity_score?: number | null;
}

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  sources?: SourceCitation[];
  created_at: string;
}

export interface ConversationSummary {
  id: string;
  title: string;
  user_id?: string | null;
  is_pinned?: boolean;
  is_archived?: boolean;
  message_count: number;
  last_message_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ConversationDetail {
  id: string;
  title: string;
  user_id?: string | null;
  is_pinned?: boolean;
  is_archived?: boolean;
  message_count: number;
  last_message_at?: string | null;
  messages: ChatMessage[];
  created_at: string;
  updated_at: string;
}

export interface SendMessageResult {
  conversation_id: string;
  title: string;
  user_message: ChatMessage;
  assistant_message: ChatMessage;
}

export const ChatApi = {
  async listConversations(): Promise<ApiResponse<ConversationSummary[]>> {
    const token = TokenStorage.getAccess() ?? undefined;
    return apiRequest<ConversationSummary[]>("/chat/conversations", {
      method: "GET",
      token,
    });
  },

  async getConversation(
    conversationId: string
  ): Promise<ApiResponse<ConversationDetail>> {
    const token = TokenStorage.getAccess() ?? undefined;
    return apiRequest<ConversationDetail>(`/chat/conversations/${conversationId}`, {
      method: "GET",
      token,
    });
  },

  async createConversation(
    title?: string
  ): Promise<ApiResponse<ConversationDetail>> {
    const token = TokenStorage.getAccess() ?? undefined;
    return apiRequest<ConversationDetail>("/chat/conversations", {
      method: "POST",
      body: title ? { title } : {},
      token,
    });
  },

  async sendMessage(
    conversationId: string,
    message: string,
    topK = 6
  ): Promise<ApiResponse<SendMessageResult>> {
    const token = TokenStorage.getAccess() ?? undefined;
    return apiRequest<SendMessageResult>(
      `/chat/conversations/${conversationId}/messages`,
      {
        method: "POST",
        body: { message, top_k: topK },
        token,
      }
    );
  },

  async quickChat(
    message: string,
    conversationId?: string,
    topK = 6
  ): Promise<ApiResponse<SendMessageResult>> {
    const token = TokenStorage.getAccess() ?? undefined;
    return apiRequest<SendMessageResult>("/chat/quick", {
      method: "POST",
      body: { message, conversation_id: conversationId, top_k: topK },
      token,
    });
  },

  async updateConversation(
    conversationId: string,
    title?: string
  ): Promise<ApiResponse<ConversationDetail>> {
    const token = TokenStorage.getAccess() ?? undefined;
    return apiRequest<ConversationDetail>(
      `/chat/conversations/${conversationId}`,
      {
        method: "PATCH",
        body: { title },
        token,
      }
    );
  },

  async deleteConversation(
    conversationId: string
  ): Promise<ApiResponse<null>> {
    const token = TokenStorage.getAccess() ?? undefined;
    return apiRequest<null>(`/chat/conversations/${conversationId}`, {
      method: "DELETE",
      token,
    });
  },
};
