import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useAuthStore } from '../store/authStore';

const ChatWindow = ({ recipientId, recipientName, recipientAvatar, onClose }) => {
  const { user } = useAuthStore();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);
  const intervalRef = useRef(null);

  // Fetch conversation initially and set up polling
  useEffect(() => {
    fetchMessages();
    
    // Poll every 5 seconds
    intervalRef.current = setInterval(fetchMessages, 5000);

    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [recipientId]);

  // Scroll to bottom on new messages
  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const fetchMessages = async () => {
    try {
      // Assuming GET /api/inbox/thread/:userId returns all messages with that user
      // Note: We need to implement this endpoint or filter client side if not available
      // For now, let's use the standard list and filter (not efficient but works for MVP)
      // BETTER: GET /api/inbox?participantId={recipientId}
      
      const res = await axios.get(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/inbox?participantId=${recipientId}&limit=50`);
      
      if (res.data.success) {
        // Sort by date ascending for chat view
        const sorted = res.data.data.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        
        // Only update state if length changed or last message ID changed to prevent flicker
        setMessages(prev => {
          if (prev.length !== sorted.length || (sorted.length > 0 && prev[prev.length - 1]?.id !== sorted[sorted.length - 1]?.id)) {
            return sorted;
          }
          return prev;
        });
      }
    } catch (err) {
      console.error('Failed to fetch chat history', err);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    try {
      await axios.post(`${import.meta.env.VITE_API_URL || 'http://localhost:3000/api'}/inbox`, {
        receiverId: recipientId,
        subject: 'Chat Message', // Default subject for chat mode
        content: newMessage
      });
      
      setNewMessage('');
      fetchMessages(); // Immediate refresh
    } catch (err) {
      console.error('Failed to send message', err);
      alert('Failed to send message');
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <div className="fixed bottom-4 right-4 w-80 md:w-96 bg-white rounded-t-lg shadow-xl border border-gray-200 flex flex-col h-[500px] z-50">
      {/* Header */}
      <div className="bg-blue-600 text-white p-3 rounded-t-lg flex justify-between items-center">
        <div className="flex items-center gap-2">
          <img 
            src={recipientAvatar || 'https://via.placeholder.com/32'} 
            alt={recipientName}
            className="w-8 h-8 rounded-full bg-white"
          />
          <span className="font-semibold truncate max-w-[180px]">{recipientName}</span>
        </div>
        <button onClick={onClose} className="hover:text-gray-200">
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 bg-gray-50 space-y-3">
        {loading ? (
          <div className="text-center text-gray-500 text-sm">Loading...</div>
        ) : messages.length === 0 ? (
          <div className="text-center text-gray-400 text-sm mt-10">No messages yet. Say hi!</div>
        ) : (
          messages.map(msg => {
            const isMe = msg.senderId === user.id;
            return (
              <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[80%] rounded-lg p-3 text-sm ${
                  isMe ? 'bg-blue-500 text-white rounded-br-none' : 'bg-white text-gray-800 border border-gray-200 rounded-bl-none'
                }`}>
                  <p>{msg.content}</p>
                  <p className={`text-[10px] mt-1 text-right ${isMe ? 'text-blue-100' : 'text-gray-400'}`}>
                    {new Date(msg.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                  </p>
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={sendMessage} className="p-3 border-t border-gray-200 bg-white">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message..."
            className="flex-1 border rounded-full px-4 py-2 focus:outline-none focus:border-blue-500 text-sm"
          />
          <button 
            type="submit" 
            disabled={!newMessage.trim()}
            className="bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 disabled:opacity-50"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChatWindow;