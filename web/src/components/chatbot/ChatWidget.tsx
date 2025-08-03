import React, { useState, useRef, useEffect } from 'react';
import {
  Bot, Send, X, Loader2, Maximize, Minimize,
} from 'lucide-react';
import ChatMessage from './ChatMessage';
import { chatbotService } from '@/utils/services/chatbotService';

interface Message {
  sender: 'user' | 'bot';
  text: string;
}

interface ChatWidgetProps {
  onClose: () => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

const ChatWidget: React.FC<ChatWidgetProps> = ({ onClose, isFullscreen, onToggleFullscreen }) => {
  const [messages, setMessages] = useState<Message[]>([
    {
      sender: 'bot',
      text: "Hello! I'm the AI Bot. How can I help you research today?",
    },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;

    const userMessage: Message = { sender: 'user', text: inputValue };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsLoading(true);

    const result = await chatbotService.sendMessage(userMessage.text);

    let botResponseText: string;
    if (result.error) {
      botResponseText = `Sorry, an error occurred: ${result.error}`;
    } else {
      // The actual response might be nested or need formatting
      if (typeof result.response === 'string') {
        botResponseText = result.response;
      } else {
        // Pretty-print JSON for non-string responses
        botResponseText = `\`\`\`json\n${JSON.stringify(result.response, null, 2)}\n\`\`\``;
      }
    }

    const botMessage: Message = { sender: 'bot', text: botResponseText };
    setMessages((prev) => [...prev, botMessage]);
    setIsLoading(false);
  };

  return (
    <div className={`flex flex-col bg-card border border-border/20 shadow-xl rounded-lg ${isFullscreen ? 'h-full w-full' : 'h-[600px] w-[400px]'}`}>
      <div className="flex items-center justify-between p-4 border-b border-border/20">
        <div className="flex items-center gap-2">
          <Bot className="text-primary" />
          <h3 className="font-semibold">Our AI</h3>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={onToggleFullscreen} className="p-1 hover:bg-muted rounded-full">
            {isFullscreen ? <Minimize size={16} /> : <Maximize size={16} />}
          </button>
          <button onClick={onClose} className="p-1 hover:bg-muted rounded-full">
            <X size={18} />
          </button>
        </div>
      </div>
      <div className="flex-1 p-4 overflow-y-auto">
        {messages.map((msg, index) => (
          <ChatMessage key={index} message={msg} />
        ))}
        {isLoading && (
          <div className="flex justify-center my-4">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSendMessage} className="p-4 border-t border-border/20">
        <div className="relative">
          <input
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            placeholder="Ask me anything..."
            className="w-full pr-10 p-2 border border-border rounded-lg bg-background focus:ring-2 focus:ring-primary focus:outline-none"
            disabled={isLoading}
          />
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-primary disabled:text-muted-foreground"
            disabled={isLoading || !inputValue.trim()}
          >
            <Send size={20} />
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatWidget;
