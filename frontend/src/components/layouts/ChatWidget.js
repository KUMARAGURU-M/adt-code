import React, { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import {
  Send, Paperclip, ChevronLeft, X, Search, FileText,
  Download, MessageSquare, Loader2
} from 'lucide-react';
import { apiCall, getCurrentUser, getAccessToken } from '../../utils/api';
import './ChatWidget.css';

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [contacts, setContacts] = useState([]);
  const [activeChat, setActiveChat] = useState(null); // ContactResponse
  const [messages, setMessages] = useState([]);
  const [inputText, setInputText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [totalUnread, setTotalUnread] = useState(0);
  const [isInitialized, setIsInitialized] = useState(false);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const pollIntervalRef = useRef(null);
  const prevUnreadRef = useRef(0);
  const location = useLocation();

  const currentUser = getCurrentUser();
  const token = getAccessToken();

  // Hide chat widget on login page
  const showWidget = currentUser && token && location.pathname !== '/login';

  // Play C5 then E5 synth chime
  const playChime = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();

      const osc1 = audioCtx.createOscillator();
      const gain1 = audioCtx.createGain();
      osc1.connect(gain1);
      gain1.connect(audioCtx.destination);
      osc1.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
      gain1.gain.setValueAtTime(0.04, audioCtx.currentTime);
      gain1.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);
      osc1.start(audioCtx.currentTime);
      osc1.stop(audioCtx.currentTime + 0.15);

      const osc2 = audioCtx.createOscillator();
      const gain2 = audioCtx.createGain();
      osc2.connect(gain2);
      gain2.connect(audioCtx.destination);
      osc2.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.08); // E5
      gain2.gain.setValueAtTime(0.04, audioCtx.currentTime + 0.08);
      gain2.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.23);
      osc2.start(audioCtx.currentTime + 0.08);
      osc2.stop(audioCtx.currentTime + 0.23);
    } catch (e) {
      console.warn('AudioContext failed:', e);
    }
  };

  const fetchUnreadCount = async () => {
    try {
      const count = await apiCall('/chat/unread-count');
      setTotalUnread(count || 0);
    } catch (err) {
      console.warn('Failed to fetch unread count:', err);
    }
  };

  // Fetch contacts
  const fetchContacts = async () => {
    try {
      const data = await apiCall('/chat/contacts');
      setContacts(data || []);
    } catch (err) {
      console.error('Failed to load chat contacts:', err);
    }
  };

  // Fetch messages in the active thread
  const fetchMessages = async (contactId) => {
    if (!contactId) return;
    try {
      const data = await apiCall(`/chat/messages/${contactId}`);
      setMessages(data || []);

      // Determine if there are unread messages in this thread
      const hasUnread = data && data.some(m => !m.isRead && m.senderId !== currentUser.userId);
      if (hasUnread) {
        // Mark as read
        await apiCall(`/chat/messages/read/${contactId}`, 'POST');
        fetchUnreadCount();
        fetchContacts();
      }
    } catch (err) {
      console.error('Failed to fetch chat history:', err);
    }
  };

  // Scroll to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Sound notification effect
  useEffect(() => {
    if (totalUnread > prevUnreadRef.current) {
      if (isInitialized) {
        playChime();
      }
    }
    prevUnreadRef.current = totalUnread;
    setIsInitialized(true);
  }, [totalUnread, isInitialized]);

  // Initial load of contacts and periodic polling for unread check
  useEffect(() => {
    if (!showWidget) return;
    fetchContacts();
    fetchUnreadCount();

    const contactsPoll = setInterval(() => {
      fetchContacts();
      fetchUnreadCount();
    }, 10000);
    return () => clearInterval(contactsPoll);
  }, [showWidget]);

  // Set up polling for active chat messages
  useEffect(() => {
    if (!isOpen || !activeChat) {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      return;
    }

    // Fetch immediately on open/switch
    fetchMessages(activeChat.id);

    // Poll every 3 seconds for real-time updates
    pollIntervalRef.current = setInterval(() => {
      fetchMessages(activeChat.id);
    }, 3000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, activeChat]);

  // Scroll on message change
  useEffect(() => {
    if (messages.length > 0) {
      scrollToBottom();
    }
  }, [messages]);

  const handleSendText = async (e) => {
    if (e) e.preventDefault();
    if (!inputText.trim() || !activeChat) return;

    const textToSend = inputText;
    setInputText('');

    // Optimistic UI update
    const tempMessage = {
      id: `temp-${Date.now()}`,
      senderId: currentUser.userId,
      senderName: currentUser.fullName,
      recipientId: activeChat.id,
      recipientName: activeChat.fullName,
      message: textToSend,
      isRead: false,
      createdAt: new Date().toISOString()
    };
    setMessages(prev => [...prev, tempMessage]);

    try {
      const sentMessage = await apiCall('/chat/messages', 'POST', {
        recipientId: activeChat.id,
        message: textToSend
      });
      // Replace temp message with actual saved message
      setMessages(prev => prev.map(m => m.id === tempMessage.id ? sentMessage : m));
    } catch (err) {
      console.error('Failed to send message:', err);
      // Remove the failed message
      setMessages(prev => prev.filter(m => m.id !== tempMessage.id));
      alert('Message failed to send. Please try again.');
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !activeChat) return;

    // Limit file size to 10 MB (10 * 1024 * 1024 bytes)
    const maxSizeBytes = 10 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      alert("File is too large. The maximum attachment size is 10 MB.");
      if (fileInputRef.current) fileInputRef.current.value = '';
      return;
    }

    setUploading(true);
    setUploadProgress('Uploading...');

    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('entityType', 'chat');

      const API_BASE = process.env.REACT_APP_API_URL;
      const res = await fetch(`${API_BASE}/media/upload`, {
        method: 'POST',
        headers: {
          ...(token && { Authorization: `Bearer ${token}` })
        },
        body: formData
      });

      if (!res.ok) throw new Error('Upload failed');
      const json = await res.json();
      if (!json.success) throw new Error(json.error || 'Upload failed');

      const mediaFile = json.data;

      // Send chat message with file attachment
      const sentMessage = await apiCall('/chat/messages', 'POST', {
        recipientId: activeChat.id,
        mediaFileId: mediaFile.id,
        message: `Shared a file: ${mediaFile.originalName}`
      });

      setMessages(prev => [...prev, sentMessage]);
    } catch (err) {
      console.error('File sharing error:', err);
      alert('Failed to upload/share file: ' + err.message);
    } finally {
      setUploading(false);
      setUploadProgress('');
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const formatSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatTime = (isoString) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  // Filter contacts by search query
  const filteredContacts = contacts.filter(c =>
    c.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  };

  if (!showWidget) return null;

  return (
    <div className={`adt-chat-widget-container ${isOpen ? 'open' : ''}`}>
      {/* Floating Button / Bot Logo */}
      {!isOpen && (
        <button
          className="adt-chat-trigger-btn"
          onClick={() => setIsOpen(true)}
          title="ADT Connect Chat"
        >
          <div className="trigger-content">
            <MessageSquare size={20} />
            {totalUnread > 0 && (
              <span className="adt-chat-unread-badge">{totalUnread}</span>
            )}
            <span className="pulse-ring" />
          </div>
        </button>
      )}

      {/* Chat Window Panel */}
      {isOpen && (
        <div className="adt-chat-window">
          {/* Header */}
          <div className="adt-chat-header">
            {activeChat ? (
              <div className="header-chatting-with">
                <button className="back-btn" onClick={() => setActiveChat(null)}>
                  <ChevronLeft size={16} />
                </button>
                <div className="header-info">
                  <span className="contact-name">{activeChat.fullName}</span>
                  <span className="contact-role">{activeChat.role}</span>
                </div>
              </div>
            ) : (
              <div className="header-default">
                <h3>ADT Connect</h3>
                <p>Secure Team Messenger</p>
              </div>
            )}
            <button className="close-panel-btn" onClick={() => setIsOpen(false)}>
              <X size={16} />
            </button>
          </div>

          {/* Body Content */}
          <div className="adt-chat-body">
            {!activeChat ? (
              /* Contacts List View */
              <div className="contacts-view">
                <div className="search-bar">
                  <Search size={14} className="search-icon" />
                  <input
                    type="text"
                    placeholder="Search colleagues..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                </div>
                <div className="contacts-list">
                  {filteredContacts.length > 0 ? (
                    filteredContacts.map(contact => (
                      <div
                        key={contact.id}
                        className="contact-card"
                        onClick={() => setActiveChat(contact)}
                      >
                        <div className="contact-avatar">
                          {getInitials(contact.fullName)}
                        </div>
                        <div className="contact-details">
                          <div className="contact-meta">
                            <span className="name">{contact.fullName}</span>
                            <span className="code">#{contact.userCode}</span>
                          </div>
                          <div className="contact-card-footer">
                            <span className="role">{contact.role}</span>
                            {contact.unreadCount > 0 && (
                              <span className="contact-unread-badge">{contact.unreadCount}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="empty-state">
                      <p>No contacts found</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              /* Chat Pane View */
              <div className="chat-thread-view">
                <div className="message-list">
                  {messages.map(msg => {
                    const isSelf = msg.senderId === currentUser.userId;
                    return (
                      <div
                        key={msg.id}
                        className={`message-bubble-wrapper ${isSelf ? 'self' : 'other'}`}
                      >
                        <div className="message-bubble">
                          {msg.mediaFile ? (
                            /* File Share Renders */
                            <div className="shared-file-card">
                              {msg.mediaFile.mimeType.startsWith('image/') ? (
                                <div className="shared-image-preview">
                                  <img
                                    src={`${process.env.REACT_APP_API_URL}${msg.mediaFile.url}`}
                                    alt={msg.mediaFile.originalName}
                                    onClick={() => window.open(`${process.env.REACT_APP_API_URL}${msg.mediaFile.url}`, '_blank')}
                                  />
                                </div>
                              ) : (
                                <div className="file-attachment-info">
                                  <FileText size={22} className="file-icon" />
                                  <div className="file-details">
                                    <span className="file-name">{msg.mediaFile.originalName}</span>
                                    <span className="file-size">{formatSize(msg.mediaFile.fileSize)}</span>
                                  </div>
                                </div>
                              )}
                              <a
                                href={`${process.env.REACT_APP_API_URL}${msg.mediaFile.url}`}
                                download
                                target="_blank"
                                rel="noreferrer"
                                className="file-download-btn"
                              >
                                <Download size={14} />
                              </a>
                            </div>
                          ) : (
                            /* Plain text Renders */
                            <p className="message-text">{msg.message}</p>
                          )}
                          <div className="message-metadata">
                            <span className="message-time">{formatTime(msg.createdAt)}</span>
                            {isSelf && (
                              <span className="read-status">
                                {msg.isRead ? (
                                  <span className="read-dot read" title="Read" />
                                ) : (
                                  <span className="read-dot sent" title="Sent" />
                                )}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {/* Upload Status */}
                {uploading && (
                  <div className="chat-upload-indicator">
                    <Loader2 size={14} className="animate-spin" />
                    <span>{uploadProgress}</span>
                  </div>
                )}

                {/* Chat Input Bar */}
                <form className="chat-input-bar" onSubmit={handleSendText}>
                  <button
                    type="button"
                    className="attach-btn"
                    onClick={triggerFileSelect}
                    disabled={uploading}
                    title="Share File"
                  >
                    <Paperclip size={15} />
                  </button>
                  <input
                    type="file"
                    ref={fileInputRef}
                    style={{ display: 'none' }}
                    onChange={handleFileUpload}
                  />
                  <input
                    type="text"
                    placeholder="Type a message..."
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    disabled={uploading}
                  />
                  <button
                    type="submit"
                    className="send-btn"
                    disabled={uploading || !inputText.trim()}
                  >
                    <Send size={15} />
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
