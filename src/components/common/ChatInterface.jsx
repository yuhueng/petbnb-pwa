import { useState, useEffect, useRef } from 'react';
import { format } from 'date-fns';
import { getInitials } from '@/utils/helpers';
import BookingRequestCard from '@/components/common/BookingRequestCard';
import { validateFile, formatFileSize, isImageFile } from '@/utils/fileValidation';

const ChatInterface = ({
  conversation,
  messages,
  currentUserId,
  onSendMessage,
  onBack,
  onProfileClick,
}) => {
  const [messageText, setMessageText] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreviewUrl, setFilePreviewUrl] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);
  const fileInputRef = useRef(null);

  const otherParticipant = conversation?.otherParticipant;

  // Scroll to bottom when messages change (within the messages container only)
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'nearest' });
  }, [messages]);

  // Clean up file preview URL when component unmounts or file changes
  useEffect(() => {
    return () => {
      if (filePreviewUrl) {
        URL.revokeObjectURL(filePreviewUrl);
      }
    };
  }, [filePreviewUrl]);

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file
    const validation = validateFile(file);
    if (!validation.isValid) {
      alert(validation.error);
      return;
    }

    setSelectedFile(file);

    // Create preview URL for images
    if (isImageFile(file.type)) {
      const previewUrl = URL.createObjectURL(file);
      setFilePreviewUrl(previewUrl);
    } else {
      setFilePreviewUrl(null);
    }
  };

  const handleRemoveFile = () => {
    if (filePreviewUrl) {
      URL.revokeObjectURL(filePreviewUrl);
    }
    setSelectedFile(null);
    setFilePreviewUrl(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();

    // Allow sending if there's text or a file
    if ((!messageText.trim() && !selectedFile) || isSending) return;

    setIsSending(true);
    try {
      // Pass both text and file to the parent component
      await onSendMessage({
        content: messageText.trim() || '',
        file: selectedFile,
      });

      // Clear form
      setMessageText('');
      handleRemoveFile();
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsSending(false);
      setUploadProgress(0);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend(e);
    }
  };

  if (!conversation) {
    return (
      <div className="flex flex-col items-center justify-center h-full bg-gradient-to-br from-[#fef5f6] to-white p-8">
        <div className="w-28 h-28 mx-auto mb-6 bg-gradient-to-br from-[#ffe5e5] to-[#fcf3f3] rounded-full flex items-center justify-center">
          <svg
            className="w-14 h-14 text-[#fb7678]"
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
        <p className="text-xl font-bold text-[#3e2d2e] mb-2">Select a conversation</p>
        <p className="text-sm text-[#6d6d6d]">Choose a conversation from the list to start messaging</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center p-4 border-b-2 border-gray-100 bg-gradient-to-r from-white to-[#fef5f6] flex-shrink-0 z-5 shadow-sm">
        <button
          onClick={onBack}
          className="mr-3 p-2 hover:bg-[#ffe5e5] hover:text-[#fb7678] rounded-full lg:hidden transition-colors"
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>

        <button
          onClick={() => onProfileClick?.(otherParticipant?.id)}
          className="flex items-center space-x-3 hover:bg-[#ffe5e5] rounded-lg px-2 py-1 -ml-2 transition-colors cursor-pointer"
        >
          {otherParticipant?.avatar_url ? (
            <img
              src={otherParticipant.avatar_url}
              alt={otherParticipant.name}
              className="w-11 h-11 rounded-full object-cover ring-2 ring-[#ffe5e5]"
            />
          ) : (
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#fb7678] to-[#ffa8aa] flex items-center justify-center text-white font-bold shadow-md">
              {getInitials(otherParticipant?.name)}
            </div>
          )}
          <div className="text-left">
            <p className="font-bold text-[#3e2d2e]">
              {otherParticipant?.name}
            </p>
            <p className="text-xs text-[#fb7678] flex items-center gap-1">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
              Online
            </p>
          </div>
        </button>
      </div>

      {/* Messages */}
      <div className="flex-1 min-h-0 overflow-y-auto p-3 sm:p-4 md:p-6 space-y-4 bg-gradient-to-br from-[#fef5f6] to-white">
        {messages.length === 0 ? (
          <div className="text-center mt-16">
            <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-[#ffe5e5] to-[#fcf3f3] rounded-full flex items-center justify-center">
              <svg className="w-8 h-8 text-[#fb7678]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
            </div>
            <p className="text-[#6d6d6d] font-medium">No messages yet. Start the conversation!</p>
          </div>
        ) : (
          messages.map((message, index) => {
            const isOwn = message.sender_id === currentUserId;
            const showAvatar =
              index === 0 ||
              messages[index - 1].sender_id !== message.sender_id;

            // Check if this is a booking request message
            const isBookingRequest = message.metadata &&
              (message.metadata.type === 'booking_request' || message.metadata.bookingId);

            // If it's a booking request, render BookingRequestCard
            if (isBookingRequest && message.metadata.bookingId) {
              return (
                <div key={message.id} className="w-full">
                  <BookingRequestCard
                    bookingId={message.metadata.bookingId}
                    currentUserId={currentUserId}
                    conversationId={conversation.id}
                  />
                  <p className="text-xs text-gray-500 mt-2 text-center font-medium">
                    {format(new Date(message.created_at), 'h:mm a')}
                  </p>
                </div>
              );
            }

            // Regular message bubble
            return (
              <div
                key={message.id}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`flex items-end space-x-2 max-w-[70%] ${
                    isOwn ? 'flex-row-reverse space-x-reverse' : ''
                  }`}
                >
                  {/* Avatar (only for received messages) */}
                  {!isOwn && showAvatar && (
                    <div className="flex-shrink-0">
                      {otherParticipant?.avatar_url ? (
                        <img
                          src={otherParticipant.avatar_url}
                          alt=""
                          className="w-8 h-8 rounded-full object-cover ring-2 ring-gray-200"
                        />
                      ) : (
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#fb7678] to-[#ffa8aa] flex items-center justify-center text-white text-xs font-bold shadow-md">
                          {getInitials(otherParticipant?.name)}
                        </div>
                      )}
                    </div>
                  )}
                  {!isOwn && !showAvatar && <div className="w-8" />}

                  {/* Message bubble */}
                  <div>
                    <div
                      className={`rounded-2xl overflow-hidden shadow-sm ${
                        isOwn
                          ? 'bg-gradient-to-r from-[#fb7678] to-[#ffa8aa] text-white'
                          : 'bg-white text-[#3e2d2e] border border-gray-200'
                      }`}
                    >
                      {/* Attachment (if present) */}
                      {message.attachment_url && message.metadata && (
                        <div className="mb-2">
                          {message.metadata.isImage ? (
                            // Image attachment
                            <img
                              src={message.attachment_url}
                              alt={message.metadata.fileName || 'Attachment'}
                              className="max-w-full h-auto rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                              style={{ maxHeight: '300px' }}
                              onClick={() => window.open(message.attachment_url, '_blank')}
                            />
                          ) : (
                            // Document attachment
                            <a
                              href={message.attachment_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                                isOwn
                                  ? 'bg-white/20 hover:bg-white/30'
                                  : 'bg-gray-50 hover:bg-gray-100'
                              }`}
                            >
                              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                                isOwn ? 'bg-white/30' : 'bg-[#ffe5e5]'
                              }`}>
                                <svg className={`w-5 h-5 ${isOwn ? 'text-white' : 'text-[#fb7678]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm font-medium truncate ${isOwn ? 'text-white' : 'text-[#3e2d2e]'}`}>
                                  {message.metadata.fileName}
                                </p>
                                <p className={`text-xs ${isOwn ? 'text-white/80' : 'text-[#6d6d6d]'}`}>
                                  {formatFileSize(message.metadata.fileSize)}
                                </p>
                              </div>
                              <svg className={`w-5 h-5 flex-shrink-0 ${isOwn ? 'text-white' : 'text-[#fb7678]'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                              </svg>
                            </a>
                          )}
                        </div>
                      )}

                      {/* Text content */}
                      {message.content && (
                        <p className={`text-sm whitespace-pre-wrap break-words ${message.attachment_url ? 'px-4 pb-3' : 'px-4 py-3'}`}>
                          {message.content}
                        </p>
                      )}

                      {/* Empty state if only attachment without text */}
                      {!message.content && message.attachment_url && (
                        <div className="px-4 py-1"></div>
                      )}
                    </div>
                    <p
                      className={`text-xs text-gray-500 mt-1.5 font-medium ${
                        isOwn ? 'text-right' : 'text-left'
                      }`}
                    >
                      {format(new Date(message.created_at), 'h:mm a')}
                    </p>
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-5 border-t-2 border-gray-100 bg-gradient-to-r from-white to-[#fef5f6] flex-shrink-0">
        {/* File Preview */}
        {selectedFile && (
          <div className="mb-3 p-3 bg-white border-2 border-[#fb7678] rounded-xl">
            <div className="flex items-center gap-3">
              {filePreviewUrl ? (
                // Image preview
                <img
                  src={filePreviewUrl}
                  alt="Preview"
                  className="w-16 h-16 rounded-lg object-cover"
                />
              ) : (
                // Document icon
                <div className="w-16 h-16 bg-[#ffe5e5] rounded-lg flex items-center justify-center">
                  <svg className="w-8 h-8 text-[#fb7678]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#3e2d2e] truncate">
                  {selectedFile.name}
                </p>
                <p className="text-xs text-[#6d6d6d]">
                  {formatFileSize(selectedFile.size)}
                </p>
              </div>
              <button
                type="button"
                onClick={handleRemoveFile}
                className="p-2 hover:bg-red-50 rounded-lg transition-colors"
              >
                <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSend} className="flex items-center space-x-3">
          {/* File upload button */}
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*,.pdf,.doc,.docx,.txt"
            onChange={handleFileSelect}
            className="hidden"
          />
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isSending}
            className="flex-shrink-0 w-12 h-12 bg-white border-2 border-gray-200 text-gray-600 rounded-2xl flex items-center justify-center hover:bg-[#ffe5e5] hover:text-[#fb7678] hover:border-[#fb7678] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-sm"
            title="Attach file"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>

          {/* Text input */}
          <div className="flex-1">
            <textarea
              ref={inputRef}
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Type a message..."
              rows="1"
              className="w-full px-5 py-3 border-2 border-gray-200 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-[#fb7678] focus:border-[#fb7678] transition-all shadow-sm"
              style={{ minHeight: '48px', maxHeight: '120px' }}
            />
          </div>

          {/* Send button */}
          <button
            type="submit"
            disabled={(!messageText.trim() && !selectedFile) || isSending}
            className="flex-shrink-0 w-12 h-12 bg-gradient-to-r from-[#fb7678] to-[#ffa8aa] text-white rounded-2xl flex items-center justify-center hover:from-[#fa6568] hover:to-[#ff9a9c] disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
          >
            {isSending ? (
              <svg
                className="animate-spin h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
              </svg>
            ) : (
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                />
              </svg>
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default ChatInterface;
