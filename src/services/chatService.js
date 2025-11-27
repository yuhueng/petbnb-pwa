import { supabase, isSupabaseConfigured } from './supabase';

/**
 * Chat Service with Conversations Table
 * Real-time messaging with conversation_id
 */

class ChatService {
  constructor() {
    this.useSupabase = isSupabaseConfigured();

    if (!this.useSupabase) {
      console.error('❌ Supabase is NOT configured!');
      throw new Error('Supabase credentials required for chat service');
    }

    this.activeSubscriptions = new Map();
    console.log('✅ Chat Service initialized (Conversations mode)');
  }

  /**
   * Get or create a conversation with explicit owner/sitter roles
   * Use this when you know exactly who is the owner and who is the sitter
   */
  async getOrCreateConversationExplicit(ownerId, sitterId) {
    console.log(`🔍 Getting/creating conversation: owner=${ownerId}, sitter=${sitterId}`);

    // Check if conversation exists
    const { data: existing, error: fetchError } = await supabase
      .from('conversations')
      .select('*')
      .eq('pet_owner_id', ownerId)
      .eq('pet_sitter_id', sitterId)
      .maybeSingle();

    if (existing) {
      console.log('✅ Found existing conversation:', existing.id);
      return existing;
    }

    // Create new conversation
    const { data: newConversation, error: createError } = await supabase
      .from('conversations')
      .insert([{
        pet_owner_id: ownerId,
        pet_sitter_id: sitterId
      }])
      .select()
      .single();

    if (createError) throw new Error(createError.message);

    console.log('✅ Created new conversation:', newConversation.id);
    return newConversation;
  }

  /**
   * Get or create a conversation between owner and sitter
   * @deprecated Use getOrCreateConversationExplicit when roles are known
   */
  async getOrCreateConversation(userId1, userId2) {
    console.log(`🔍 Getting/creating conversation between ${userId1} and ${userId2}`);

    // Fetch both profiles to determine roles
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('id, last_role')
      .in('id', [userId1, userId2]);

    if (profileError || !profiles || profiles.length !== 2) {
      throw new Error('Failed to fetch user profiles');
    }

    // Determine who is owner and who is sitter
    let ownerId, sitterId;
    profiles.forEach(profile => {
      if (profile.last_role === 'owner') {
        ownerId = profile.id;
      } else if (profile.last_role === 'sitter') {
        sitterId = profile.id;
      }
    });

    // If both are same role, use current last_role or default
    if (!ownerId || !sitterId) {
      // Fallback: first user is owner, second is sitter
      ownerId = profiles[0].id;
      sitterId = profiles[1].id;
    }

    return this.getOrCreateConversationExplicit(ownerId, sitterId);
  }

  /**
   * Get all conversations for a user
   * Returns conversations with last message and unread count
   * @param {string} userId - Current user's ID
   * @param {string} filterByUserRole - Optional: 'owner' or 'sitter' to filter by user's role in conversation
   */
  async getConversations(userId, filterByUserRole = null) {
    console.log(`📋 Loading conversations for user: ${userId}, filtering by user role: ${filterByUserRole}`);

    // Build query based on filter
    let query = supabase
      .from('conversations')
      .select('*')
      .order('updated_at', { ascending: false });

    if (filterByUserRole === 'owner') {
      // Show only conversations where current user is the owner
      query = query.eq('pet_owner_id', userId);
    } else if (filterByUserRole === 'sitter') {
      // Show only conversations where current user is the sitter
      query = query.eq('pet_sitter_id', userId);
    } else {
      // Show all conversations where user is either owner or sitter
      query = query.or(`pet_owner_id.eq.${userId},pet_sitter_id.eq.${userId}`);
    }

    const { data: conversations, error: convError } = await query;

    if (convError) {
      console.error('❌ Error loading conversations:', convError);
      throw new Error(convError.message);
    }

    if (!conversations || conversations.length === 0) {
      console.log('📭 No conversations found');
      return [];
    }

    console.log(`✅ Found ${conversations.length} conversations`);

    // For each conversation, get the other participant's profile, last message, unread count, and current booking status
    const enrichedConversations = await Promise.all(
      conversations.map(async (conv) => {
        // Determine the other participant
        const otherUserId =
          conv.pet_owner_id === userId ? conv.pet_sitter_id : conv.pet_owner_id;

        // Determine the other participant's role based on conversation structure
        const otherParticipantRole = conv.pet_owner_id === userId ? 'sitter' : 'owner';

        // Get other participant's profile
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, name, avatar_url, last_role')
          .eq('id', otherUserId)
          .single();

        // Get last message
        const { data: lastMessageData } = await supabase
          .from('messages')
          .select('*')
          .eq('conversation_id', conv.id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle();

        // Check for current booking (confirmed or in_progress status with current/future dates)
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const { data: currentBooking } = await supabase
          .from('bookings')
          .select('id, status, start_date, end_date')
          .eq('pet_owner_id', conv.pet_owner_id)
          .eq('pet_sitter_id', conv.pet_sitter_id)
          .in('status', ['confirmed', 'in_progress'])
          .gte('end_date', today.toISOString())
          .order('start_date', { ascending: true })
          .limit(1)
          .maybeSingle();

        // No unread count tracking
        return {
          id: conv.id,
          otherParticipant: {
            ...profile,
            role: otherParticipantRole, // Add the role based on conversation structure
          },
          lastMessage: lastMessageData || null,
          unreadCount: 0, // Always 0 - no tracking
          hasCurrentBooking: !!currentBooking, // True if there's an active booking
          updated_at: conv.updated_at,
          created_at: conv.created_at,
        };
      })
    );

    // Sort conversations: current bookings first, then by updated_at
    enrichedConversations.sort((a, b) => {
      // Pin conversations with current bookings to the top
      if (a.hasCurrentBooking && !b.hasCurrentBooking) return -1;
      if (!a.hasCurrentBooking && b.hasCurrentBooking) return 1;

      // Then sort by updated_at
      return new Date(b.updated_at) - new Date(a.updated_at);
    });

    return enrichedConversations;
  }

  /**
   * Get all messages in a conversation
   */
  async getMessages(conversationId, limit = 50) {
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:profiles!sender_id(id, name, avatar_url)
      `)
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true })
      .limit(limit);

    if (error) throw new Error(error.message);
    return data || [];
  }

  /**
   * Send a message in a conversation
   * @param {Object} params
   * @param {string} params.conversationId - ID of the conversation
   * @param {string} params.senderId - ID of the sender
   * @param {string} params.content - Text content of the message
   * @param {string} params.attachmentUrl - Optional URL of attached file
   * @param {Object} params.metadata - Optional metadata (for booking requests, file info, etc.)
   */
  async sendMessage({ conversationId, senderId, content, attachmentUrl = null, metadata = null }) {
    const messageData = {
      conversation_id: conversationId,
      sender_id: senderId,
      content,
      is_read: false,
    };

    // Add attachment URL if provided
    if (attachmentUrl) {
      messageData.attachment_url = attachmentUrl;
    }

    // Add metadata if provided (for booking requests, file attachments, etc.)
    if (metadata) {
      messageData.metadata = metadata;
    }

    const { data, error } = await supabase
      .from('messages')
      .insert([messageData])
      .select(`
        *,
        sender:profiles!sender_id(id, name, avatar_url)
      `)
      .single();

    if (error) throw new Error(error.message);

    // Update conversation's updated_at timestamp
    await supabase
      .from('conversations')
      .update({ updated_at: new Date().toISOString() })
      .eq('id', conversationId);

    console.log('✅ Message sent:', data.id);
    return data;
  }

  /**
   * Mark all unread messages in a conversation as read (No-op for now)
   */
  async markAsRead(conversationId, currentUserId) {
    // Disabled - no read tracking
    console.log('✅ markAsRead called (disabled):', conversationId);
  }

  /**
   * Subscribe to new messages in a specific conversation (REAL-TIME)
   */
  subscribeToMessages(conversationId, callback) {
    const channelName = `conversation:${conversationId}`;

    // Unsubscribe from previous subscription if exists
    if (this.activeSubscriptions.has(channelName)) {
      this.activeSubscriptions.get(channelName).unsubscribe();
    }

    console.log(`🔔 Subscribing to real-time messages: ${channelName}`);

    // Create new subscription
    const subscription = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        async (payload) => {
          console.log('📨 New message received (real-time):', payload.new);

          // Fetch full message with profile data
          const { data: message } = await supabase
            .from('messages')
            .select(`
              *,
              sender:profiles!sender_id(id, name, avatar_url)
            `)
            .eq('id', payload.new.id)
            .single();

          callback(message || payload.new);
        }
      )
      .subscribe((status) => {
        console.log(`📡 Subscription status: ${status}`);
      });

    this.activeSubscriptions.set(channelName, subscription);

    return {
      unsubscribe: () => {
        console.log(`🔕 Unsubscribing from: ${channelName}`);
        subscription.unsubscribe();
        this.activeSubscriptions.delete(channelName);
      },
    };
  }

  /**
   * Subscribe to all conversations for a user (for notifications)
   */
  subscribeToUserConversations(userId, callback) {
    const channelName = `user_conversations:${userId}`;

    console.log(`🔔 Subscribing to conversation updates for user: ${userId}`);

    const subscription = supabase
      .channel(channelName)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `pet_owner_id=eq.${userId}`,
        },
        (payload) => {
          console.log('📨 Conversation update:', payload);
          callback(payload);
        }
      )
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'conversations',
          filter: `pet_sitter_id=eq.${userId}`,
        },
        (payload) => {
          console.log('📨 Conversation update:', payload);
          callback(payload);
        }
      )
      .subscribe((status) => {
        console.log(`📡 User conversations subscription status: ${status}`);
      });

    return {
      unsubscribe: () => {
        console.log(`🔕 Unsubscribing from user conversations: ${userId}`);
        subscription.unsubscribe();
      },
    };
  }

  /**
   * Unsubscribe from all active subscriptions
   */
  unsubscribeAll() {
    console.log(`🔕 Unsubscribing from ${this.activeSubscriptions.size} channels`);
    this.activeSubscriptions.forEach((subscription) => {
      subscription.unsubscribe();
    });
    this.activeSubscriptions.clear();
  }

  /**
   * Search messages across all conversations for a user
   */
  async searchMessages(userId, query) {
    // First get all conversations for the user
    const { data: conversations } = await supabase
      .from('conversations')
      .select('id')
      .or(`pet_owner_id.eq.${userId},pet_sitter_id.eq.${userId}`);

    if (!conversations || conversations.length === 0) return [];

    const conversationIds = conversations.map((c) => c.id);

    // Search messages in those conversations
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .in('conversation_id', conversationIds)
      .ilike('content', `%${query}%`)
      .order('created_at', { ascending: false });

    if (error) throw new Error(error.message);
    return data || [];
  }

  /**
   * Delete a message (soft delete - mark as deleted)
   */
  async deleteMessage(messageId, userId) {
    // Verify user owns the message
    const { data: message } = await supabase
      .from('messages')
      .select('sender_id')
      .eq('id', messageId)
      .single();

    if (!message || message.sender_id !== userId) {
      throw new Error('Unauthorized to delete this message');
    }

    const { error } = await supabase.from('messages').delete().eq('id', messageId);

    if (error) throw new Error(error.message);
    console.log('✅ Message deleted:', messageId);
  }
}

// Export singleton instance
export const chatService = new ChatService();
export default chatService;
