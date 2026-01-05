import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuthStore } from '../../store/authStore';
import ComposeMessage from '../../components/Inbox/ComposeMessage';
import ChatWindow from '../../components/ChatWindow';
import './Inbox.css';

const Inbox = () => {
  const { token, user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('inbox'); // 'inbox' or 'sent'
  const [messages, setMessages] = useState([]);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showCompose, setShowCompose] = useState(false);
  const [replyTo, setReplyTo] = useState(null);
  
  // Chat state
  const [activeChatUser, setActiveChatUser] = useState(null); // { id, name, avatar }

  // Pagination state
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchMessages();
  }, [activeTab, page]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
      const endpoint = activeTab === 'inbox' ? '/inbox' : '/inbox/sent';
      
      const response = await axios.get(`${API_URL}${endpoint}?page=${page}&limit=20`, {
        headers: { Authorization: `Bearer ${token}` }
      });

      if (response.data.success) {
        setMessages(response.data.data);
        setTotalPages(response.data.pagination.totalPages);
        
        // If switching tabs, clear selection
        if (selectedMessage && !response.data.data.find(m => m.id === selectedMessage.id)) {
           setSelectedMessage(null);
        }
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleMessageClick = async (message) => {
    // Avoid re-fetching or re-setting if already selected
    if (selectedMessage?.id === message.id) return;
    
    setSelectedMessage(message);
    
    // Mark as read if it's in inbox and unread
    if (activeTab === 'inbox' && !message.isRead) {
      try {
        const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';
        await axios.put(`${API_URL}/inbox/${message.id}/read`, {}, {
          headers: { Authorization: `Bearer ${token}` }
        });
        
        // Update local state
        setMessages(prev => prev.map(m => 
          m.id === message.id ? { ...m, isRead: true } : m
        ));
      } catch (error) {
        console.error('Failed to mark message as read:', error);
      }
    }
  };

  const handleReply = () => {
    // Check if we should open chat instead of email reply
    const otherUser = activeTab === 'inbox' ? selectedMessage.sender : selectedMessage.receiver;
    if (otherUser) {
      setActiveChatUser({
        id: otherUser.id,
        name: `${otherUser.firstName} ${otherUser.lastName}`,
        avatar: otherUser.profilePictureUrl
      });
    } else {
      setReplyTo(selectedMessage);
      setShowCompose(true);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString();
  };

  return (
    <div className="inbox-container">
      {/* Sidebar List */}
      <div className="inbox-sidebar">
        <div className="inbox-header">
          <h2>Messages</h2>
          <button className="btn-compose" onClick={() => { setReplyTo(null); setShowCompose(true); }}>
            <i className="fas fa-pen"></i> Compose
          </button>
        </div>
        
        <div className="inbox-tabs">
          <button 
            className={`inbox-tab ${activeTab === 'inbox' ? 'active' : ''}`}
            onClick={() => { setActiveTab('inbox'); setPage(1); }}
          >
            Inbox
          </button>
          <button 
            className={`inbox-tab ${activeTab === 'sent' ? 'active' : ''}`}
            onClick={() => { setActiveTab('sent'); setPage(1); }}
          >
            Sent
          </button>
        </div>

        <div className="message-list">
          {loading ? (
            <div className="p-4 text-center text-gray-500">Loading...</div>
          ) : messages.length === 0 ? (
            <div className="empty-state">
              <p>No messages found</p>
            </div>
          ) : (
            messages.map(message => (
              <div 
                key={message.id} 
                className={`message-item ${selectedMessage?.id === message.id ? 'active' : ''} ${!message.isRead && activeTab === 'inbox' ? 'unread' : ''}`}
                onClick={() => handleMessageClick(message)}
              >
                <div className="message-meta">
                  <span className="message-sender">
                    {activeTab === 'inbox' 
                      ? (message.sender ? `${message.sender.firstName} ${message.sender.lastName}` : 'Unknown Sender')
                      : (message.receiver ? `To: ${message.receiver.firstName} ${message.receiver.lastName}` : 'To: Unknown Recipient')
                    }
                  </span>
                  <span className="message-date">{formatDate(message.createdAt)}</span>
                </div>
                <div className="message-subject">
                  {message.subject}
                </div>
                <div className="message-preview">
                  {message.content.substring(0, 50)}...
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Message Detail */}
      <div className="message-detail">
        {selectedMessage ? (
          <>
            <div className="detail-header">
              <h1 className="detail-subject">{selectedMessage.subject}</h1>
              <div className="detail-meta">
                <img 
                  src={
                    activeTab === 'inbox' 
                      ? (selectedMessage.sender?.profilePictureUrl || (selectedMessage.sender ? 'https://ui-avatars.com/api/?name=' + selectedMessage.sender.firstName + '+' + selectedMessage.sender.lastName : 'https://ui-avatars.com/api/?name=Unknown'))
                      : (selectedMessage.receiver?.profilePictureUrl || (selectedMessage.receiver ? 'https://ui-avatars.com/api/?name=' + selectedMessage.receiver.firstName + '+' + selectedMessage.receiver.lastName : 'https://ui-avatars.com/api/?name=Unknown'))
                  } 
                  alt="Avatar" 
                  className="detail-avatar" 
                  onError={(e) => { e.target.onerror = null; e.target.src = 'https://ui-avatars.com/api/?name=User'; }}
                />
                <div className="detail-info">
                  <div className="detail-sender">
                    {activeTab === 'inbox' 
                      ? (selectedMessage.sender ? `${selectedMessage.sender.firstName} ${selectedMessage.sender.lastName}` : 'Unknown Sender')
                      : (selectedMessage.receiver ? `To: ${selectedMessage.receiver.firstName} ${selectedMessage.receiver.lastName}` : 'To: Unknown Recipient')
                    }
                    <span> &lt;{activeTab === 'inbox' ? (selectedMessage.sender?.email || 'unknown') : (selectedMessage.receiver?.email || 'unknown')}&gt;</span>
                  </div>
                  <div className="detail-time">
                    {new Date(selectedMessage.createdAt).toLocaleString()}
                    {selectedMessage.course && <span className="ml-2 text-indigo-500">• {selectedMessage.course.title}</span>}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="detail-body">
              {selectedMessage.content}
            </div>

            <div className="detail-actions">
              {activeTab === 'inbox' && (
                <button className="btn-reply" onClick={handleReply}>
                  <i className="fas fa-reply"></i> Reply
                </button>
              )}
            </div>
          </>
        ) : (
          <div className="empty-state">
            <i className="fas fa-envelope-open-text"></i>
            <h3>Select a message to read</h3>
            <p>Choose from the list on the left or compose a new message.</p>
          </div>
        )}
      </div>

      {/* Chat Window */}
      {activeChatUser && (
        <ChatWindow
          recipientId={activeChatUser.id}
          recipientName={activeChatUser.name}
          recipientAvatar={activeChatUser.avatar}
          onClose={() => setActiveChatUser(null)}
        />
      )}

      {/* Compose Modal */}
      {showCompose && (
        <ComposeMessage 
          onClose={() => setShowCompose(false)} 
          onSendSuccess={() => {
            // fetchMessages(); // Remove this to avoid double-update flicker
            // Instead, just reload the page or switch tab
            // For a reply, we typically want to stay on the current view or just show a success message
            // But if we switch to 'sent', we should do it cleanly
            setActiveTab('sent');
            setPage(1);
          }}
          replyTo={replyTo}
        />
      )}
    </div>
  );
};

export default Inbox;
