import React from 'react';
import { useNavigate } from 'react-router-dom';
import ChatWidget from '@/components/chatbot/ChatWidget';

const ChatbotPage: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="fixed inset-0 bg-background z-50 flex items-center justify-center">
      <div className="w-full h-full md:w-3/4 md:h-5/6 md:max-w-4xl">
        <ChatWidget
          onClose={() => navigate(-1)} // Go back to the previous page
          isFullscreen
          onToggleFullscreen={() => navigate(-1)} // Minimize brings you back
        />
      </div>
    </div>
  );
};

export default ChatbotPage;
