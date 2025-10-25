import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { chatService } from '@/services/chatService';
import ConversationList from '@/components/common/ConversationList';
import ChatInterface from '@/components/common/ChatInterface';
import toast from 'react-hot-toast';

const OwnerMessages = () => {
  const { user, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);

  // If not authenticated, show login prompt
  if (!isAuthenticated) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh]">
        <svg
          className="w-24 h-24 text-gray-300 mb-6"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z"
          />
        </svg>
        <h2 className="text-2xl font-bold text-gray-900 mb-3">Please log in to view messages</h2>
        <p className="text-gray-600 mb-6">You need to be logged in to chat with pet sitters</p>
        <button
          onClick={() => navigate('/owner/profile')}
          className="px-6 py-3 bg-primary-600 text-white rounded-lg font-medium hover:bg-primary-700 transition-colors"
        >
          Log In
        </button>
      </div>
    );
  }

  // Load conversations
  useEffect(() => {
    if (!user?.id) return;

    loadConversations();
  }, [user?.id]);

  // Load messages when conversation is selected
  useEffect(() => {
    if (!selectedConversation?.id) {
      setMessages([]);
      return;
    }

    loadMessages(selectedConversation.id);
    markMessagesAsRead(selectedConversation.id);

    // Subscribe to new messages in this conversation
    const subscription = chatService.subscribeToMessages(
      selectedConversation.id,
      (newMessage) => {
        setMessages((prev) => [...prev, newMessage]);
        markMessagesAsRead(selectedConversation.id);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [selectedConversation?.id, user?.id]);

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      setIsMobileView(window.innerWidth < 768);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const loadConversations = async () => {
    try {
      setIsLoading(true);
      const data = await chatService.getConversations(user.id);
      setConversations(data);
    } catch (error) {
      console.error('Error loading conversations:', error);
      toast.error('Failed to load conversations');
    } finally {
      setIsLoading(false);
    }
  };

  const loadMessages = async (conversationId) => {
    try {
      const data = await chatService.getMessages(conversationId);
      setMessages(data);
    } catch (error) {
      console.error('Error loading messages:', error);
      toast.error('Failed to load messages');
    }
  };

  const markMessagesAsRead = async (conversationId) => {
    try {
      await chatService.markAsRead(conversationId, user.id);
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const handleSelectConversation = (conversation) => {
    setSelectedConversation(conversation);
  };

  const handleSendMessage = async (content) => {
    if (!selectedConversation) return;

    try {
      const newMessage = await chatService.sendMessage({
        conversationId: selectedConversation.id,
        senderId: user.id,
        content,
      });

      setMessages((prev) => [...prev, newMessage]);
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      throw error;
    }
  };

  const handleBack = () => {
    setSelectedConversation(null);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  // Mobile view: show either conversation list or chat interface
  if (isMobileView) {
    if (selectedConversation) {
      return (
        <div className="h-[calc(100vh-8rem)]">
          <ChatInterface
            conversation={selectedConversation}
            messages={messages}
            currentUserId={user?.id}
            onSendMessage={handleSendMessage}
            onBack={handleBack}
          />
        </div>
      );
    }

    return (
      <div className="bg-white rounded-lg shadow">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">Messages</h2>
          <p className="text-sm text-gray-600 mt-1">
            Chat with your pet sitters
          </p>
        </div>
        <ConversationList
          conversations={conversations}
          onSelectConversation={handleSelectConversation}
          selectedConversationId={selectedConversation?.id}
        />
      </div>
    );
  }

  // Desktop view: show both side by side
  return (
    <div className="bg-white rounded-lg shadow overflow-hidden">
      <div className="grid grid-cols-3 h-[calc(100vh-8rem)]">
        {/* Conversation List */}
        <div className="col-span-1 border-r border-gray-200 overflow-y-auto">
          <div className="p-4 border-b border-gray-200 bg-gray-50">
            <h2 className="text-lg font-bold text-gray-900">Messages</h2>
          </div>
          <ConversationList
            conversations={conversations}
            onSelectConversation={handleSelectConversation}
            selectedConversationId={selectedConversation?.id}
          />
        </div>

        {/* Chat Interface */}
        <div className="col-span-2">
          <ChatInterface
            conversation={selectedConversation}
            messages={messages}
            currentUserId={user?.id}
            onSendMessage={handleSendMessage}
            onBack={handleBack}
          />
        </div>
      </div>
    </div>
  );
};

export default OwnerMessages;
