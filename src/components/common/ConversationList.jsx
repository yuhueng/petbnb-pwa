import { formatDate } from '@/utils/helpers';
import { getInitials } from '@/utils/helpers';

const ConversationList = ({ conversations, onSelectConversation, selectedConversationId }) => {
  if (!conversations || conversations.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-64 p-8">
        <div className="w-20 h-20 mx-auto mb-6 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full flex items-center justify-center">
          <svg
            className="w-10 h-10 text-indigo-600"
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
        <p className="text-lg font-bold text-gray-900 mb-2">No chats found!</p>
        <p className="text-sm text-gray-600">Start a conversation with a sitter or owner</p>
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
                ? 'bg-gradient-to-r from-indigo-50 to-purple-50 border-l-4 border-indigo-600'
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
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-semibold shadow-md">
                    {getInitials(otherParticipant?.name || '')}
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2 min-w-0">
                    <p className="text-sm font-bold text-gray-900 truncate">
                      {otherParticipant?.name}
                    </p>
                    {otherParticipant?.role && (
                      <span className={`flex-shrink-0 px-2 py-0.5 text-xs font-semibold rounded-full ${
                        otherParticipant.role === 'sitter'
                          ? 'bg-gradient-to-r from-indigo-100 to-purple-100 text-indigo-700'
                          : 'bg-gradient-to-r from-green-100 to-emerald-100 text-green-700'
                      }`}>
                        {otherParticipant.role === 'sitter' ? 'Pet Sitter' : 'Pet Owner'}
                      </span>
                    )}
                  </div>
                  {lastMessage && (
                    <p className="text-xs text-gray-500 font-medium flex-shrink-0">
                      {formatDate(lastMessage.created_at, 'MMM dd')}
                    </p>
                  )}
                </div>

                {lastMessage && (
                  <p className={`text-sm truncate ${unreadCount > 0 ? 'text-gray-900 font-medium' : 'text-gray-600'}`}>
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
                  <span className="inline-flex items-center justify-center min-w-[24px] h-6 px-2 text-xs font-bold text-white bg-gradient-to-r from-indigo-600 to-purple-600 rounded-full shadow-md">
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
