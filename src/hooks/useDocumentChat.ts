import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export const useDocumentChat = (summaryId: string | null) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sendMessage = async (userMessage: string) => {
    if (!summaryId || !userMessage.trim()) return;

    setIsLoading(true);
    setError(null);

    // Add user message
    const newUserMessage: ChatMessage = {
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, newUserMessage]);

    try {
      const { data, error: functionError } = await supabase.functions.invoke(
        'chat-with-documents',
        {
          body: {
            summaryId,
            messages: [...messages, newUserMessage].map(m => ({
              role: m.role,
              content: m.content,
            })),
          },
        }
      );

      if (functionError) {
        throw new Error(functionError.message);
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to get response');
      }

      // Add assistant response
      const assistantMessage: ChatMessage = {
        role: 'assistant',
        content: data.message,
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, assistantMessage]);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Une erreur est survenue';
      setError(errorMessage);
      console.error('Error sending message:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const reset = () => {
    setMessages([]);
    setError(null);
  };

  return {
    messages,
    isLoading,
    error,
    sendMessage,
    reset,
  };
};
