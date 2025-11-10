import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { chatService } from '@/services/chatService';
import ConversationList from '@/components/common/ConversationList';
import ChatInterface from '@/components/common/ChatInterface';
import ProfileModal from '@/components/common/ProfileModal';
import toast from 'react-hot-toast';

const SitterMessages = () => {
  const { user, isAuthenticated } = useAuthStore();
  const navigate = useNavigate();
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isMobileView, setIsMobileView] = useState(window.innerWidth < 768);
  const [profileUserId, setProfileUserId] = useState(null);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);

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
        <h2 className="text-2xl font-bold text-[#3e2d2e] mb-3">Please log in to view messages</h2>
        <p className="text-[#6d6d6d] mb-6">You need to be logged in to chat with pet owners</p>
        <button
          onClick={() => navigate('/sitter/profile')}
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
      // Filter to only show conversations where current user is the sitter
      const data = await chatService.getConversations(user.id, 'sitter');
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

  const handleSendMessage = async ({ content, file }) => {
    if (!selectedConversation) return;

    try {
      let attachmentUrl = null;
      let metadata = null;

      // Upload file if present
      if (file) {
        // Dynamically import the file upload service
        const { fileUploadService } = await import('@/services/fileUploadService');

        const uploadResult = await fileUploadService.uploadFile(
          file,
          selectedConversation.id
        );

        if (!uploadResult.success) {
          toast.error(uploadResult.error || 'Failed to upload file');
          throw new Error(uploadResult.error);
        }

        attachmentUrl = uploadResult.url;
        metadata = uploadResult.metadata;
      }

      // Send message with optional attachment
      await chatService.sendMessage({
        conversationId: selectedConversation.id,
        senderId: user.id,
        content: content || '', // Allow empty content if there's an attachment
        attachmentUrl,
        metadata,
      });
      // Don't manually update messages - real-time subscription handles it
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
      throw error;
    }
  };

  const handleBack = () => {
    setSelectedConversation(null);
  };

  const handleProfileClick = (userId) => {
    setProfileUserId(userId);
    setIsProfileModalOpen(true);
  };

  const handleCloseProfileModal = () => {
    setIsProfileModalOpen(false);
    setProfileUserId(null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#fef5f6] to-[#fcf3f3] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#fb7678]"></div>
      </div>
    );
  }

  // Mobile view: show either conversation list or chat interface
  if (isMobileView) {
    if (selectedConversation) {
      return (
        <div className="h-screen bg-gradient-to-br from-[#fef5f6] to-[#fcf3f3] flex flex-col">
          <div className="flex-1 overflow-hidden">
            <ChatInterface
              conversation={selectedConversation}
              messages={messages}
              currentUserId={user?.id}
              onSendMessage={handleSendMessage}
              onBack={handleBack}
              onProfileClick={handleProfileClick}
            />
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-[#fef5f6] to-[#fcf3f3] p-2 sm:p-4">
        <div className="bg-white rounded-xl shadow-lg overflow-hidden border border-gray-200 max-h-[calc(100vh-2rem)] flex flex-col">
          <div className="bg-gradient-to-r from-[#fb7678] to-[#ffa8aa] px-6 py-5 flex-shrink-0">
            <h2 className="text-2xl font-bold text-white flex items-center gap-3">
              <div className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
              </div>
              Messages
            </h2>
            <p className="text-white/90 mt-1 text-sm">
              Chat with pet owners
            </p>
          </div>
          <div className="overflow-y-auto flex-1">
            <ConversationList
              conversations={conversations}
              onSelectConversation={handleSelectConversation}
              selectedConversationId={selectedConversation?.id}
            />
          </div>
        </div>
      </div>
    );
  }

  // Desktop view: show both side by side
  return (
    <div className="min-h-screen bg-gradient-to-br from-[#fef5f6] to-[#fcf3f3] px-4 sm:px-6 lg:px-8 py-6">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-gray-200">
          <div className="grid grid-cols-3 h-[calc(100vh-12rem)]">
            {/* Conversation List */}
            <div className="col-span-1 border-r border-gray-200 flex flex-col overflow-hidden">
              <div className="bg-gradient-to-r from-[#fb7678] to-[#ffa8aa] px-6 py-5 flex-shrink-0">
                <h2 className="text-xl font-bold text-white flex items-center gap-2">
                  <div className="w-8 h-8 bg-white/20 backdrop-blur-sm rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                    </svg>
                  </div>
                  Messages
                </h2>
              </div>
              <div className="flex-1 overflow-y-auto">
                <ConversationList
                  conversations={conversations}
                  onSelectConversation={handleSelectConversation}
                  selectedConversationId={selectedConversation?.id}
                />
              </div>
            </div>

            {/* Chat Interface */}
            <div className="col-span-2 min-h-0">
              <ChatInterface
                conversation={selectedConversation}
                messages={messages}
                currentUserId={user?.id}
                onSendMessage={handleSendMessage}
                onBack={handleBack}
                onProfileClick={handleProfileClick}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Profile Modal */}
      <ProfileModal
        userId={profileUserId}
        isOpen={isProfileModalOpen}
        onClose={handleCloseProfileModal}
      />
    </div>
  );
};

export default SitterMessages;
