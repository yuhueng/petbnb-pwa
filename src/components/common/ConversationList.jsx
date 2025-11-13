import { formatDate } from '@/utils/helpers';
import { getInitials } from '@/utils/helpers';

/**
 * Format message preview based on message type
 * @param {Object} message - Last message object
 * @returns {Object} { text: string, icon: JSX.Element | null }
 */
const formatMessagePreview = (message) => {
  if (!message) {
    return { text: 'No messages yet', icon: null };
  }

  // Check for booking request
  if (message.metadata && (message.metadata.type === 'booking_request' || message.metadata.bookingId)) {
    return {
      text: 'Booking Request',
      icon: (
        <svg className="w-4 h-4 text-[#fb7678]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )
    };
  }

  // Check for attachment
  if (message.attachment_url) {
    const isImage = message.metadata && message.metadata.isImage;

    if (isImage) {
      return {
        text: message.content || 'Photo',
        icon: (
          <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        )
      };
    } else {
      return {
        text: message.content || (message.metadata?.fileName || 'Document'),
        icon: (
          <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        )
      };
    }
  }

  // Regular text message
  return {
    text: message.content || 'Sent a message',
    icon: null
  };
};

/**
 * Format timestamp for conversation list
 * Shows time for today, date for older messages
 * @param {string} timestamp - ISO timestamp
 * @returns {string} Formatted time/date
 */
const formatMessageTime = (timestamp) => {
  if (!timestamp) return '';

  const now = new Date();
  const messageDate = new Date(timestamp);
  const diffInMinutes = Math.floor((now - messageDate) / (1000 * 60));

  // Less than 1 minute ago
  if (diffInMinutes < 1) {
    return 'Just now';
  }

  // Less than 1 hour ago
  if (diffInMinutes < 60) {
    return `${diffInMinutes}m ago`;
  }

  // Less than 24 hours ago (same day)
  if (diffInMinutes < 1440 && now.getDate() === messageDate.getDate()) {
    const hours = messageDate.getHours();
    const minutes = messageDate.getMinutes();
    const ampm = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    const displayMinutes = minutes < 10 ? `0${minutes}` : minutes;
    return `${displayHours}:${displayMinutes} ${ampm}`;
  }

  // Yesterday
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (messageDate.getDate() === yesterday.getDate() &&
      messageDate.getMonth() === yesterday.getMonth() &&
      messageDate.getFullYear() === yesterday.getFullYear()) {
    return 'Yesterday';
  }

  // Older - show date
  return formatDate(timestamp, 'MMM dd');
};

const ConversationList = ({ conversations, onSelectConversation, selectedConversationId }) => {
  if (!conversations || conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 p-8">
        <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-[#ffe5e5] to-[#fcf3f3] rounded-full flex items-center justify-center">
          <svg
            className="w-10 h-10 text-[#fb7678]"
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
        </div>
        <p className="text-lg font-bold text-[#3e2d2e] mb-2">No chats found!</p>
        <p className="text-sm text-[#6d6d6d]">Start a conversation with a sitter or owner</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-100">
      {conversations.map((conversation) => {
        const { id, otherParticipant, lastMessage, unreadCount } = conversation;
        const isSelected = id === selectedConversationId;

        return (
          <div
            key={id}
            onClick={() => onSelectConversation(conversation)}
            className={`p-4 cursor-pointer transition-all duration-200 ${
              isSelected
                ? 'bg-gradient-to-r from-[#ffe5e5] to-[#fcf3f3] border-l-4 border-[#fb7678]'
                : 'hover:bg-gray-50'
            }`}
          >
            <div className="flex items-start space-x-3">
              {/* Avatar */}
              <div className="flex-shrink-0">
                {otherParticipant?.avatar_url ? (
                  <img
                    src={otherParticipant.avatar_url}
                    alt={otherParticipant.name}
                    className="w-12 h-12 rounded-full object-cover ring-2 ring-gray-200"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#fb7678] to-[#ffa8aa] flex items-center justify-center text-white font-semibold shadow-md">
                    {getInitials(otherParticipant?.name || '')}
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <p className="text-sm font-bold text-[#3e2d2e] truncate">
                      {otherParticipant?.name}
                    </p>
                    {otherParticipant?.role && (
                      <span className={`flex-shrink-0 px-2 py-0.5 text-xs font-semibold rounded-full ${
                        otherParticipant.role === 'sitter'
                          ? 'bg-gradient-to-r from-[#ffe5e5] to-[#fcf3f3] text-[#fb7678]'
                          : 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700'
                      }`}>
                        {otherParticipant.role === 'sitter' ? 'Pet Sitter' : 'Pet Owner'}
                      </span>
                    )}
                  </div>
                  {lastMessage && (
                    <p className="text-xs text-[#6d6d6d] font-medium flex-shrink-0">
                      {formatMessageTime(lastMessage.created_at)}
                    </p>
                  )}
                </div>

                {/* Message Preview */}
                {(() => {
                  const preview = formatMessagePreview(lastMessage);
                  return (
                    <div className="flex items-center gap-1.5">
                      {preview.icon && <span className="flex-shrink-0">{preview.icon}</span>}
                      <p className={`text-sm truncate ${
                        lastMessage
                          ? 'text-gray-600'
                          : 'text-gray-400 italic'
                      }`}>
                        {preview.text}
                      </p>
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ConversationList;
