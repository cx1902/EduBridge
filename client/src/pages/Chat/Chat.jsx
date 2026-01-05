import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { inboxApi } from '../../api/inbox';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format } from 'date-fns';

const Chat = () => {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [searchParams] = useSearchParams();
  const [selectedUser, setSelectedUser] = useState(null);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef(null);

  // Poll for new messages every 10 seconds
  const { data: inboxData } = useQuery({
    queryKey: ['inbox'],
    queryFn: () => inboxApi.getInbox({ limit: 100 }),
    refetchInterval: 10000,
  });

  const { data: sentData } = useQuery({
    queryKey: ['sent'],
    queryFn: () => inboxApi.getSent({ limit: 100 }),
    refetchInterval: 10000,
  });

  // Combine and group messages by conversation partner
  const conversations = React.useMemo(() => {
    if (!inboxData?.data?.data || !sentData?.data?.data || !user) return {};

    const allMessages = [
      ...inboxData.data.data.map(m => ({ ...m, direction: 'received', partner: m.sender })),
      ...sentData.data.data.map(m => ({ ...m, direction: 'sent', partner: m.receiver }))
    ];

    // Group by partner ID
    const grouped = {};
    allMessages.forEach(msg => {
      const partnerId = msg.partner?.id;
      if (!partnerId) return;

      if (!grouped[partnerId]) {
        grouped[partnerId] = {
          partner: msg.partner,
          messages: [],
          lastMessageAt: msg.createdAt,
          unreadCount: 0
        };
      }

      grouped[partnerId].messages.push(msg);
      if (new Date(msg.createdAt) > new Date(grouped[partnerId].lastMessageAt)) {
        grouped[partnerId].lastMessageAt = msg.createdAt;
      }
      if (msg.direction === 'received' && !msg.isRead) {
        grouped[partnerId].unreadCount++;
      }
    });

    // Sort messages within each conversation
    Object.values(grouped).forEach(group => {
      group.messages.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    });

    return grouped;
  }, [inboxData, sentData, user]);

  const sortedConversations = Object.values(conversations).sort(
    (a, b) => new Date(b.lastMessageAt) - new Date(a.lastMessageAt)
  );

  // Check URL for userId to start a chat
  useEffect(() => {
    const userId = searchParams.get('userId');
    if (userId && user && userId !== user.id) {
      // Check if conversation already exists
      if (conversations[userId]) {
        setSelectedUser(conversations[userId].partner);
      } else {
        // Fetch user info for new conversation
        inboxApi.getBasicUser(userId)
          .then(res => {
            if (res.data.success) {
              setSelectedUser(res.data.data);
            }
          })
          .catch(err => console.error('Failed to fetch user info:', err));
      }
    }
  }, [searchParams, conversations, user]);

  const sendMessageMutation = useMutation({
    mutationFn: (content) => inboxApi.sendMessage({
      receiverId: selectedUser.id,
      subject: 'Chat Message', // Default subject for chat mode
      content,
      type: 'GENERAL'
    }),
    onSuccess: () => {
      setNewMessage('');
      queryClient.invalidateQueries(['sent']);
      // After sending, the new message will appear in polled data
      // We might want to optimistically update or just wait for poll
    }
  });

  const markReadMutation = useMutation({
    mutationFn: (msgId) => inboxApi.markAsRead(msgId),
    onSuccess: () => {
      queryClient.invalidateQueries(['inbox']);
    }
  });

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [conversations, selectedUser]);

  // Mark as read when opening conversation
  useEffect(() => {
    if (selectedUser && conversations[selectedUser.id]) {
      const unreadIds = conversations[selectedUser.id].messages
        .filter(m => m.direction === 'received' && !m.isRead)
        .map(m => m.id);
      
      if (unreadIds.length > 0) {
        unreadIds.forEach(id => markReadMutation.mutate(id));
      }
    }
  }, [selectedUser, conversations]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSend = (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedUser) return;
    sendMessageMutation.mutate(newMessage);
  };

  return (
    <div className="chat-container" style={{ display: 'flex', height: 'calc(100vh - 100px)', gap: '20px', padding: '20px' }}>
      {/* Sidebar - Conversation List */}
      <div className="chat-sidebar" style={{ width: '300px', borderRight: '1px solid #eee', overflowY: 'auto' }}>
        <h2 style={{ padding: '0 20px' }}>Messages</h2>
        {sortedConversations.length === 0 ? (
          <p style={{ padding: '20px', color: '#666' }}>No messages yet.</p>
        ) : (
          <div className="conversation-list">
            {sortedConversations.map(conv => (
              <div
                key={conv.partner.id}
                onClick={() => setSelectedUser(conv.partner)}
                style={{
                  padding: '15px 20px',
                  cursor: 'pointer',
                  backgroundColor: selectedUser?.id === conv.partner.id ? '#f0f9ff' : 'transparent',
                  borderBottom: '1px solid #f5f5f5',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '10px'
                }}
              >
                <div 
                  style={{ 
                    width: '40px', 
                    height: '40px', 
                    borderRadius: '50%', 
                    backgroundColor: '#e0e7ff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontWeight: 'bold',
                    color: '#4f46e5'
                  }}
                >
                  {conv.partner.profilePictureUrl ? (
                    <img src={conv.partner.profilePictureUrl} alt="" style={{ width: '100%', height: '100%', borderRadius: '50%' }} />
                  ) : (
                    conv.partner.firstName?.[0] || 'U'
                  )}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 'bold', display: 'flex', justifyContent: 'space-between' }}>
                    <span>{conv.partner.firstName} {conv.partner.lastName}</span>
                    {conv.unreadCount > 0 && (
                      <span style={{ 
                        backgroundColor: '#ef4444', 
                        color: 'white', 
                        borderRadius: '999px', 
                        padding: '2px 8px', 
                        fontSize: '12px' 
                      }}>
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                  <div style={{ fontSize: '12px', color: '#666', marginTop: '4px' }}>
                    {format(new Date(conv.lastMessageAt), 'MMM d, h:mm a')}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Main Chat Area */}
      <div className="chat-main" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {selectedUser ? (
          <>
            <div className="chat-header" style={{ padding: '15px 20px', borderBottom: '1px solid #eee', fontWeight: 'bold' }}>
              {selectedUser.firstName} {selectedUser.lastName}
            </div>
            
            <div className="messages-area" style={{ flex: 1, overflowY: 'auto', padding: '20px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
              {conversations[selectedUser.id]?.messages.map((msg) => (
                <div 
                  key={msg.id}
                  style={{
                    alignSelf: msg.direction === 'sent' ? 'flex-end' : 'flex-start',
                    maxWidth: '70%',
                    backgroundColor: msg.direction === 'sent' ? '#4f46e5' : '#f3f4f6',
                    color: msg.direction === 'sent' ? 'white' : 'black',
                    padding: '10px 15px',
                    borderRadius: '12px',
                    borderBottomRightRadius: msg.direction === 'sent' ? '4px' : '12px',
                    borderBottomLeftRadius: msg.direction === 'sent' ? '12px' : '4px',
                  }}
                >
                  <div style={{ fontSize: '14px' }}>{msg.content}</div>
                  <div style={{ 
                    fontSize: '10px', 
                    marginTop: '4px', 
                    opacity: 0.8, 
                    textAlign: 'right' 
                  }}>
                    {format(new Date(msg.createdAt), 'h:mm a')}
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>

            <form onSubmit={handleSend} style={{ padding: '20px', borderTop: '1px solid #eee', display: 'flex', gap: '10px' }}>
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                style={{
                  flex: 1,
                  padding: '10px 15px',
                  borderRadius: '8px',
                  border: '1px solid #ddd',
                  outline: 'none'
                }}
              />
              <button 
                type="submit" 
                disabled={sendMessageMutation.isPending || !newMessage.trim()}
                style={{
                  backgroundColor: '#4f46e5',
                  color: 'white',
                  border: 'none',
                  padding: '0 20px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  opacity: sendMessageMutation.isPending ? 0.7 : 1
                }}
              >
                Send
              </button>
            </form>
          </>
        ) : (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#888' }}>
            Select a conversation to start chatting
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;
