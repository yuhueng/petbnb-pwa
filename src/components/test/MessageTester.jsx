import { useState, useEffect, useRef } from 'react';
import { chatService } from '@/services/chatService';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';

/**
 * Message Tester Component
 * Test real-time messaging without needing a full app
 *
 * Usage: Add this to any page to test messaging
 * <MessageTester />
 */

const MessageTester = () => {
  const { user } = useAuthStore();
  const [recipientId, setRecipientId] = useState('');
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([]);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const subscriptionRef = useRef(null);

  useEffect(() => {
    // Cleanup subscription on unmount
    return () => {
      if (subscriptionRef.current) {
        subscriptionRef.current.unsubscribe();
      }
    };
  }, []);

  const startListening = () => {
    if (!recipientId || !user) return;

    toast.success(`🔔 Listening for messages with ${recipientId}`);
    console.log(`🔔 Starting real-time listener between ${user.id} and ${recipientId}`);

    // Subscribe to messages
    subscriptionRef.current = chatService.subscribeToMessages(
      user.id,
      recipientId,
      (newMessage) => {
        console.log('📨 Real-time message received:', newMessage);
        setMessages((prev) => [...prev, newMessage]);
        toast.success('New message received!');
      }
    );

    setIsSubscribed(true);
  };

  const stopListening = () => {
    if (subscriptionRef.current) {
      subscriptionRef.current.unsubscribe();
      subscriptionRef.current = null;
    }
    setIsSubscribed(false);
    toast('🔕 Stopped listening');
  };

  const loadMessages = async () => {
    if (!recipientId || !user) return;

    try {
      const msgs = await chatService.getMessages(user.id, recipientId);
      setMessages(msgs);
      toast.success(`Loaded ${msgs.length} messages`);
    } catch (error) {
      toast.error(error.message);
    }
  };

  const sendMessage = async () => {
    if (!recipientId || !message || !user) return;

    try {
      const sent = await chatService.sendMessage({
        senderId: user.id,
        receiverId: recipientId,
        content: message,
      });

      setMessages((prev) => [...prev, sent]);
      setMessage('');
      toast.success('Message sent!');
    } catch (error) {
      toast.error(error.message);
    }
  };

  if (!user) {
    return (
      <div className="p-4 bg-yellow-50 border border-yellow-200 rounded">
        <p className="text-yellow-800">Please log in to test messaging</p>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto p-6 bg-white border rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4">💬 Message Tester</h2>

      <div className="mb-4 p-3 bg-blue-50 rounded">
        <p className="text-sm text-blue-800">
          <strong>Your User ID:</strong> {user.id}
        </p>
        <p className="text-xs text-blue-600 mt-1">
          Share this with someone else to test messaging
        </p>
      </div>

      {/* Recipient Input */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Recipient User ID
        </label>
        <input
          type="text"
          value={recipientId}
          onChange={(e) => setRecipientId(e.target.value)}
          placeholder="Paste the other user's ID here"
          className="w-full px-3 py-2 border border-gray-300 rounded-md"
        />
      </div>

      {/* Controls */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={loadMessages}
          disabled={!recipientId}
          className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 disabled:opacity-50"
        >
          Load Messages
        </button>

        {!isSubscribed ? (
          <button
            onClick={startListening}
            disabled={!recipientId}
            className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          >
            🔔 Start Listening (Real-time)
          </button>
        ) : (
          <button
            onClick={stopListening}
            className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            🔕 Stop Listening
          </button>
        )}
      </div>

      {/* Message Input */}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-700 mb-2">Send Message</label>
        <div className="flex gap-2">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
            placeholder="Type your message..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md"
          />
          <button
            onClick={sendMessage}
            disabled={!recipientId || !message}
            className="px-6 py-2 bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50"
          >
            Send
          </button>
        </div>
      </div>

      {/* Messages Display */}
      <div className="border rounded-lg p-4 h-64 overflow-y-auto bg-gray-50">
        {messages.length === 0 ? (
          <p className="text-gray-500 text-center">No messages yet. Start chatting!</p>
        ) : (
          <div className="space-y-2">
            {messages.map((msg, idx) => (
              <div
                key={msg.id || idx}
                className={`p-3 rounded ${
                  msg.sender_id === user.id
                    ? 'bg-primary-100 ml-auto max-w-[80%]'
                    : 'bg-white max-w-[80%]'
                }`}
              >
                <p className="text-sm font-medium text-gray-700">
                  {msg.sender_id === user.id ? 'You' : msg.sender?.first_name || 'Other User'}
                </p>
                <p className="text-gray-900">{msg.content}</p>
                <p className="text-xs text-gray-500 mt-1">
                  {new Date(msg.created_at).toLocaleTimeString()}
                </p>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="mt-4 p-3 bg-gray-100 rounded text-sm">
        <p className="font-medium mb-2">How to test:</p>
        <ol className="list-decimal list-inside space-y-1 text-gray-700">
          <li>Copy your User ID from above</li>
          <li>Open another browser (or incognito window)</li>
          <li>Create a different account and login</li>
          <li>Paste each other's User IDs</li>
          <li>Click "Start Listening" on both windows</li>
          <li>Send messages - they should appear instantly! ⚡</li>
        </ol>
      </div>
    </div>
  );
};

export default MessageTester;
