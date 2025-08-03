import React from 'react';
import { Bot, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

interface ChatMessageProps {
  message: {
    sender: 'user' | 'bot';
    text: string;
  };
}

const ChatMessage: React.FC<ChatMessageProps> = ({ message }) => {
  const isUser = message.sender === 'user';

  return (
    <div className={`flex items-start gap-3 my-4 ${isUser ? 'justify-end' : ''}`}>
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground">
          <Bot size={20} />
        </div>
      )}
      <div
        className={`max-w-[80%] p-3 rounded-2xl ${
          isUser
            ? 'bg-primary text-primary-foreground rounded-br-none'
            : 'bg-muted rounded-bl-none'
        }`}
      >
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <ReactMarkdown
            components={{
              a: ({ node, ...props }) => <a {...props} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline" />,
              table: ({ node, ...props }) => <table {...props} className="table-auto w-full" />,
              thead: ({ node, ...props }) => <thead {...props} className="bg-muted" />,
              th: ({ node, ...props }) => <th {...props} className="px-4 py-2 text-left" />,
              td: ({ node, ...props }) => <td {...props} className="border px-4 py-2" />,
            }}
          >
            {message.text}
          </ReactMarkdown>
        </div>
      </div>
      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-muted flex items-center justify-center">
          <User size={20} />
        </div>
      )}
    </div>
  );
};

export default ChatMessage;
