import React, { useState, useEffect, useRef } from 'react';
import { Search, MessageSquare, Clock, FileText, Download, ArrowRight } from 'lucide-react';
import { apiCall } from '../../utils/api';
import './ChatMonitor.css';

export default function ChatMonitor() {
  const [conversations, setConversations] = useState([]);
  const [selectedThread, setSelectedThread] = useState(null); // { user1, user2 }
  const [threadMessages, setThreadMessages] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loadingList, setLoadingList] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);
  
  const messagesEndRef = useRef(null);
  const pollIntervalRef = useRef(null);

  // Fetch all conversations
  const fetchConversations = async (silent = false) => {
    if (!silent) setLoadingList(true);
    try {
      const data = await apiCall('/chat/admin/conversations');
      setConversations(data || []);
    } catch (err) {
      console.error('Failed to fetch admin conversation logs:', err);
    } finally {
      if (!silent) setLoadingList(false);
    }
  };

  // Fetch thread message history
  const fetchThreadHistory = async (user1Id, user2Id, silent = false) => {
    if (!silent) setLoadingThread(true);
    try {
      const data = await apiCall(`/chat/admin/conversations/${user1Id}/${user2Id}`);
      setThreadMessages(data || []);
    } catch (err) {
      console.error('Failed to fetch conversation thread details:', err);
    } finally {
      if (!silent) setLoadingThread(false);
    }
  };

  // Initial load
  useEffect(() => {
    fetchConversations();
    const interval = setInterval(() => fetchConversations(true), 15000);
    return () => clearInterval(interval);
  }, []);

  // Poll thread history when a thread is selected
  useEffect(() => {
    if (!selectedThread) {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
      return;
    }

    fetchThreadHistory(selectedThread.user1.id, selectedThread.user2.id);

    pollIntervalRef.current = setInterval(() => {
      fetchThreadHistory(selectedThread.user1.id, selectedThread.user2.id, true);
    }, 5000);

    return () => {
      if (pollIntervalRef.current) {
        clearInterval(pollIntervalRef.current);
        pollIntervalRef.current = null;
      }
    };
  }, [selectedThread]);

  // Scroll to bottom when new messages loaded
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [threadMessages]);

  const formatSize = (bytes) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const formatDate = (isoString) => {
    try {
      const d = new Date(isoString);
      return d.toLocaleDateString() + ' ' + d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  // Filter threads by search query
  const filteredConversations = conversations.filter(conv => 
    conv.user1.fullName.toLowerCase().includes(searchQuery.toLowerCase()) || 
    conv.user2.fullName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.user1.role.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.user2.role.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getInitials = (name) => {
    if (!name) return 'U';
    return name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  };

  return (
    <div className="admin-chat-monitor-container">
      {/* Page Header */}
      <div className="admin-chat-header-panel">
        <div className="header-title-block">
          <h2>Chat Audit Logs</h2>
          <p>Monitor, audit, and inspect direct user conversations and shared files</p>
        </div>
      </div>

      <div className="admin-chat-workspace">
        {/* Left Panel: Conversations list */}
        <div className="conversations-sidebar">
          <div className="sidebar-search">
            <Search size={18} className="search-icon" />
            <input 
              type="text" 
              placeholder="Search by participant name or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="sidebar-list">
            {loadingList ? (
              <div className="list-loading-state">
                <span className="spinner" />
                <p>Loading conversations...</p>
              </div>
            ) : filteredConversations.length > 0 ? (
              filteredConversations.map((conv, index) => {
                const isSelected = selectedThread && 
                  ((selectedThread.user1.id === conv.user1.id && selectedThread.user2.id === conv.user2.id) ||
                   (selectedThread.user1.id === conv.user2.id && selectedThread.user2.id === conv.user1.id));
                
                return (
                  <div 
                    key={index} 
                    className={`conversation-thread-card ${isSelected ? 'active' : ''}`}
                    onClick={() => setSelectedThread({ user1: conv.user1, user2: conv.user2 })}
                  >
                    <div className="thread-participants">
                      <div className="participant">
                        <span className="p-name">{conv.user1.fullName}</span>
                        <span className="p-role">{conv.user1.role}</span>
                      </div>
                      <ArrowRight size={14} className="arrow-connector" />
                      <div className="participant text-right">
                        <span className="p-name">{conv.user2.fullName}</span>
                        <span className="p-role">{conv.user2.role}</span>
                      </div>
                    </div>

                    <div className="thread-meta">
                      <div className="last-message-snippet">
                        {conv.lastMessage.mediaFile ? (
                          <span className="attachment-text">📎 Attachment shared</span>
                        ) : (
                          <span className="snippet-text">{conv.lastMessage.message}</span>
                        )}
                      </div>
                      <div className="time-info">
                        <Clock size={12} />
                        <span>{formatDate(conv.lastMessage.createdAt)}</span>
                      </div>
                    </div>

                    <span className="message-count-badge">
                      {conv.messageCount} messages
                    </span>
                  </div>
                );
              })
            ) : (
              <div className="sidebar-empty-state">
                <MessageSquare size={36} />
                <p>No chat logs found</p>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel: Chat Thread Details */}
        <div className="thread-viewer">
          {selectedThread ? (
            <div className="thread-viewer-content">
              {/* Thread Header */}
              <div className="thread-header">
                <div className="participant-header-box">
                  <div className="avatar">{getInitials(selectedThread.user1.fullName)}</div>
                  <div className="info">
                    <span className="name">{selectedThread.user1.fullName}</span>
                    <span className="details">Code: #{selectedThread.user1.userCode} | {selectedThread.user1.role}</span>
                  </div>
                </div>
                <div className="connection-pill">Audit Mode</div>
                <div className="participant-header-box text-right flex-reverse">
                  <div className="avatar">{getInitials(selectedThread.user2.fullName)}</div>
                  <div className="info">
                    <span className="name">{selectedThread.user2.fullName}</span>
                    <span className="details">Code: #{selectedThread.user2.userCode} | {selectedThread.user2.role}</span>
                  </div>
                </div>
              </div>

              {/* Message Timeline */}
              <div className="thread-timeline">
                {loadingThread ? (
                  <div className="timeline-loading-state">
                    <span className="spinner" />
                    <p>Loading messages history...</p>
                  </div>
                ) : threadMessages.length > 0 ? (
                  <div className="messages-stream">
                    {threadMessages.map(msg => {
                      const isUser1 = msg.senderId === selectedThread.user1.id;
                      return (
                        <div 
                          key={msg.id} 
                          className={`audit-message-row ${isUser1 ? 'left-align' : 'right-align'}`}
                        >
                          <div className="sender-indicator">
                            {isUser1 ? selectedThread.user1.fullName : selectedThread.user2.fullName}
                          </div>
                          <div className="audit-message-bubble">
                            {msg.mediaFile ? (
                              <div className="audit-file-card">
                                {msg.mediaFile.mimeType.startsWith('image/') ? (
                                  <div className="audit-image-preview">
                                    <img 
                                      src={`${process.env.REACT_APP_API_URL || 'https://adt-backend-m4a4.onrender.com/api'}${msg.mediaFile.url}`} 
                                      alt={msg.mediaFile.originalName}
                                      onClick={() => window.open(`${process.env.REACT_APP_API_URL || 'https://adt-backend-m4a4.onrender.com/api'}${msg.mediaFile.url}`, '_blank')}
                                    />
                                  </div>
                                ) : (
                                  <div className="audit-file-details">
                                    <FileText size={24} className="file-icon" />
                                    <div className="meta">
                                      <span className="name">{msg.mediaFile.originalName}</span>
                                      <span className="size">{formatSize(msg.mediaFile.fileSize)}</span>
                                    </div>
                                  </div>
                                )}
                                <a 
                                  href={`${process.env.REACT_APP_API_URL || 'https://adt-backend-m4a4.onrender.com/api'}${msg.mediaFile.url}`} 
                                  download 
                                  target="_blank" 
                                  rel="noreferrer"
                                  className="audit-download-btn"
                                >
                                  <Download size={14} />
                                </a>
                              </div>
                            ) : (
                              <p className="message-content">{msg.message}</p>
                            )}
                            <div className="message-time">{formatDate(msg.createdAt)}</div>
                          </div>
                        </div>
                      );
                    })}
                    <div ref={messagesEndRef} />
                  </div>
                ) : (
                  <div className="timeline-empty-state">
                    <p>No messages in this conversation</p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="viewer-placeholder">
              <div className="placeholder-content">
                <MessageSquare size={64} className="placeholder-icon" />
                <h3>No Conversation Selected</h3>
                <p>Select a conversation thread from the left sidebar to audit full chat logs, download shared files, and view communications between staff members.</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
