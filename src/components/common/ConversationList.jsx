import { formatDate } from '@/utils/helpers';
import { getInitials } from '@/utils/helpers';

const ConversationList = ({ conversations, onSelectConversation, selectedConversationId }) => {
  if (!conversations || conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-400">
        <svg
          className="w-16 h-16 mb-4"
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
        <p className="text-lg font-medium">No chats found!</p>
        <p className="text-sm">Start a conversation with a sitter or owner</p>
      </div>
    );
  }

  return (
    <div className="divide-y divide-gray-200">
      {conversations.map((conversation) => {
        const { id, otherParticipant, lastMessage, unreadCount } = conversation;
        const isSelected = id === selectedConversationId;

        return (
          <div
            key={id}
            onClick={() => onSelectConversation(conversation)}
            className={`p-4 cursor-pointer transition-colors hover:bg-gray-50 ${
              isSelected ? 'bg-primary-50 border-l-4 border-primary-600' : ''
            }`}
          >
            <div className="flex items-start space-x-3">
              {/* Avatar */}
              <div className="flex-shrink-0">
                {otherParticipant?.avatar_url ? (
                  <img
                    src={otherParticipant.avatar_url}
                    alt={otherParticipant.name}
                    className="w-12 h-12 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-primary-600 flex items-center justify-center text-white font-semibold">
                    {getInitials(otherParticipant?.name || '')}
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <p className="text-sm font-semibold text-gray-900 truncate">
                    {otherParticipant?.name}
                  </p>
                  {lastMessage && (
                    <p className="text-xs text-gray-500">
                      {formatDate(lastMessage.created_at, 'MMM dd')}
                    </p>
                  )}
                </div>

                {lastMessage && (
                  <p className="text-sm text-gray-600 truncate">
                    {lastMessage.content}
                  </p>
                )}

                {!lastMessage && (
                  <p className="text-sm text-gray-400 italic">No messages yet</p>
                )}
              </div>

              {/* Unread badge */}
              {unreadCount > 0 && (
                <div className="flex-shrink-0">
                  <span className="inline-flex items-center justify-center w-6 h-6 text-xs font-bold text-white bg-primary-600 rounded-full">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default ConversationList;
