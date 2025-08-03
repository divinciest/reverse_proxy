import React, { useState } from 'react';
import { Bot, X } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ChatWidget from './ChatWidget';

const ChatBubble: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navigate = useNavigate();

  const handleToggleFullscreen = () => {
    navigate('/chat');
    setIsOpen(false);
  };

  return (
    <>
      <div className="fixed bottom-5 right-5 z-50">
        {/* Chat bubble toggle */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="flex items-center justify-center w-16 h-16 bg-primary text-primary-foreground rounded-full shadow-lg hover:bg-primary/90 transition-transform transform hover:scale-110"
          aria-label="Toggle chat"
        >
          {isOpen ? <X size={30} /> : <Bot size={30} />}
        </button>
      </div>

      {/* Chat Widget Modal for Desktop */}
      <div
        className={`hidden md:block fixed bottom-24 right-5 z-40 transition-all duration-300 ease-in-out ${
          isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
        }`}
      >
        <ChatWidget
          onClose={() => setIsOpen(false)}
          isFullscreen={false}
          onToggleFullscreen={handleToggleFullscreen}
        />
      </div>

      {/* Fullscreen Chat Modal for Mobile */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 bg-background z-50">
          <ChatWidget
            onClose={() => setIsOpen(false)}
            isFullscreen
            onToggleFullscreen={() => {
              // Already fullscreen on mobile, this could be a no-op
            }}
          />
        </div>
      )}
    </>
  );
};

export default ChatBubble;
