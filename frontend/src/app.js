// src/app.js 
import React, { useState, useEffect } from 'react';
import { Send, Shield, Menu, X, Plus, MessageSquare, Trash2, Clock, Terminal, CheckCircle, LogOut } from 'lucide-react';
import Register from './components/Register';
import Login from './components/Login';
import ForgotPassword from './components/ForgotPassword';
import ResetPassword from './components/ResetPassword';
import authService from './services/authService';
import apiService from './services/authService';

// Main Chat Component
export default function CyberSecurityChat() {
  const [authView, setAuthView] = useState('login');
  const [user, setUser] = useState(null);
  const [chats, setChats] = useState([]);
  const [currentChatId, setCurrentChatId] = useState(null);
  const [input, setInput] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [typing, setTyping] = useState(false);
  const [showToolModal, setShowToolModal] = useState(false);
  const [selectedTools, setSelectedTools] = useState([]);
  const [launching, setLaunching] = useState(false);
  const [loading, setLoading] = useState(true);
  
  const allTools = [
    { id: 'do-nmap', name: 'Nmap Scanner', description: 'Network exploration and security auditing tool', color: 'from-blue-500 to-cyan-500' },
    { id: 'do-sqlmap', name: 'SQLMap', description: 'Automatic SQL injection detection tool', color: 'from-red-500 to-orange-500' },
    { id: 'do-ffuf', name: 'FFUF', description: 'Fast web fuzzer written in Go', color: 'from-purple-500 to-pink-500' },
    { id: 'do-masscan', name: 'Masscan', description: 'TCP port scanner, asynchronous', color: 'from-green-500 to-emerald-500' },
    { id: 'do-sslscan', name: 'SSLScan', description: 'Tests SSL/TLS enabled services', color: 'from-yellow-500 to-orange-500' }
  ];

  const currentChat = chats.find(c => c.id === currentChatId);
  const launchedTools = currentChat?.tools || [];

  useEffect(() => {
    const checkAuth = async () => {
      const savedUser = authService.getCurrentUser();
      if (savedUser && authService.isAuthenticated()) {
        setUser(savedUser);
        await loadUserChats();
      }
      setLoading(false);
    };

    const params = new URLSearchParams(window.location.search);
    if (params.get('token')) {
      setAuthView('reset');
      setLoading(false);
    } else {
      checkAuth();
    }
  }, []);

  const loadUserChats = async () => {
    try {
      const result = await apiService.getChats();
      if (result.success) {
        const formattedChats = result.chats.map(chat => ({
          id: chat.id,
          title: chat.title,
          messages: [],
          timestamp: new Date(chat.created_at),
          tools: chat.tools || [],
          created_at: chat.created_at,
          updated_at: chat.updated_at
        }));
        setChats(formattedChats);
        
        if (formattedChats.length > 0) {
          setCurrentChatId(formattedChats[0].id);
          await loadChatMessages(formattedChats[0].id);
        }
      }
    } catch (error) {
      console.error('Failed to load chats:', error);
    }
  };

  const loadChatMessages = async (chatId) => {
    try {
      const result = await apiService.getChatMessages(chatId);
      if (result.success) {
        setChats(prevChats => prevChats.map(chat => 
          chat.id === chatId 
            ? { ...chat, messages: result.messages }
            : chat
        ));
      }
    } catch (error) {
      console.error('Failed to load messages:', error);
    }
  };

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    setAuthView('login');
    loadUserChats();
  };

  const handleRegisterSuccess = (userData) => {
    setUser(userData);
    setAuthView('login');
    loadUserChats();
  };

  const handleLogout = () => {
    authService.logout();
    setUser(null);
    setChats([]);
    setCurrentChatId(null);
    setAuthView('login');
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const userMessage = { 
      text: input, 
      sender: 'user', 
      timestamp: new Date() 
    };

    const updatedMessages = currentChat 
      ? [...currentChat.messages, userMessage]
      : [userMessage];

    if (currentChat) {
      setChats(chats.map(c => 
        c.id === currentChatId 
          ? { ...c, messages: updatedMessages }
          : c
      ));
    }
    
    const userQuery = input;
    setInput('');
    setTyping(true);

    try {
      const data = await apiService.sendMessage(
        currentChatId,
        userQuery,
        launchedTools
      );

      if (data.success) {
        if (!currentChatId) {
          setCurrentChatId(data.chat_id);
          await loadUserChats();
        } else {
          await loadChatMessages(data.chat_id);
        }
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Backend error:', error);
      
      const errorMessage = {
        response: {
          type: 'text',
          text: `❌ Error: ${error.message}\n\nPlease check your connection and try again.`
        },
        sender: 'ai',
        timestamp: new Date()
      };
      
      if (currentChat) {
        setChats(chats.map(c => 
          c.id === currentChatId 
            ? { ...c, messages: [...updatedMessages, errorMessage] }
            : c
        ));
      }
    } finally {
      setTyping(false);
    }
  };

  const createNewChat = async () => {
    try {
      const result = await apiService.createChat('New Chat', []);
      if (result.success) {
        await loadUserChats();
        setCurrentChatId(result.chat_id);
        setSidebarOpen(false);
        setShowToolModal(true);
      }
    } catch (error) {
      console.error('Failed to create chat:', error);
      alert('Failed to create new chat. Please try again.');
    }
  };

  const deleteChat = async (chatId) => {
    if (chats.length === 1) return;
    
    try {
      await apiService.deleteChat(chatId);
      await loadUserChats();
      
      if (currentChatId === chatId && chats.length > 1) {
        const remainingChats = chats.filter(c => c.id !== chatId);
        setCurrentChatId(remainingChats[0].id);
      }
    } catch (error) {
      console.error('Failed to delete chat:', error);
      alert('Failed to delete chat. Please try again.');
    }
  };

  const launchTools = async () => {
    if (selectedTools.length === 0) return;
    
    setLaunching(true);
    
    try {
      const updatedTools = [...new Set([...launchedTools, ...selectedTools])];
      const toolNames = selectedTools.map(id => allTools.find(t => t.id === id)?.name).join(', ');
      
      setChats(chats.map(c => 
        c.id === currentChatId 
          ? { 
              ...c, 
              tools: updatedTools,
              title: c.messages.length === 0 ? `Chat with ${toolNames}` : c.title
            }
          : c
      ));

      const systemMessage = {
        text: `✅ Tools configured and launched: ${toolNames}\n\nThese tools are now ready to use. Ask me to scan, test, or analyze targets!`,
        sender: 'system',
        timestamp: new Date()
      };

      if (currentChat) {
        setChats(chats.map(c => 
          c.id === currentChatId 
            ? { ...c, messages: [...c.messages, systemMessage] }
            : c
        ));
      }
      
    } catch (error) {
      console.error('Error launching tools:', error);
      alert('Failed to launch tools. Please try again.');
    } finally {
      setLaunching(false);
      setShowToolModal(false);
      setSelectedTools([]);
    }
  };

  const toggleToolSelection = (toolId) => {
    if (selectedTools.includes(toolId)) {
      setSelectedTools(selectedTools.filter(id => id !== toolId));
    } else {
      setSelectedTools([...selectedTools, toolId]);
    }
  };

  const formatTime = (date) => {
    const now = new Date();
    const diff = now - new Date(date);
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (minutes < 1) return 'Just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-4 animate-pulse">
            <Shield className="w-12 h-12 text-white" />
          </div>
          <p className="text-cyan-400 text-lg">Loading...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    if (authView === 'register') {
      return (
        <Register 
          onRegisterSuccess={handleRegisterSuccess}
          onSwitchToLogin={() => setAuthView('login')}
        />
      );
    }
    
    if (authView === 'forgot') {
      return (
        <ForgotPassword 
          onBackToLogin={() => setAuthView('login')}
        />
      );
    }

    if (authView === 'reset') {
      return (
        <ResetPassword 
          onResetSuccess={() => setAuthView('login')}
          onBackToLogin={() => setAuthView('login')}
        />
      );
    }

    return (
      <Login 
        onLoginSuccess={handleLoginSuccess}
        onSwitchToRegister={() => setAuthView('register')}
        onForgotPassword={() => setAuthView('forgot')}
      />
    );
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white">
      <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 w-80 bg-black bg-opacity-80 backdrop-blur-xl border-r border-cyan-500 border-opacity-20 transition-transform duration-300 z-50 flex flex-col`}>
        <div className="p-4 border-b border-cyan-500 border-opacity-20">
          <div className="flex items-center gap-3 mb-4">
            <img 
              src={user.avatar || `https://ui-avatars.com/api/?name=${user.name}&background=06B6D4&color=fff`} 
              alt={user.name} 
              className="w-10 h-10 rounded-full"
            />
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-sm truncate">{user.name}</h3>
              <p className="text-xs text-gray-400 truncate">@{user.username}</p>
            </div>
            <button 
              onClick={handleLogout} 
              className="p-2 hover:bg-red-500 hover:bg-opacity-20 rounded-lg transition-colors" 
              title="Logout"
            >
              <LogOut className="w-4 h-4 text-red-400" />
            </button>
          </div>
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-cyan-400">Chat History</h2>
            <button onClick={() => setSidebarOpen(false)} className="p-2 hover:bg-cyan-500 hover:bg-opacity-20 rounded-lg">
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <button
          onClick={createNewChat}
          className="m-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 p-3 rounded-xl flex items-center justify-center gap-2 transition-all shadow-lg"
        >
          <Plus className="w-5 h-5" />
          <span className="font-medium">New Chat</span>
        </button>

        <div className="flex-1 overflow-y-auto px-4 space-y-2">
          {chats.map(chat => (
            <div
              key={chat.id}
              className={`group p-3 rounded-lg cursor-pointer transition-all ${
                currentChatId === chat.id
                  ? 'bg-cyan-600 bg-opacity-30 border border-cyan-400 border-opacity-50'
                  : 'bg-gray-800 bg-opacity-50 hover:bg-opacity-70 border border-transparent'
              }`}
              onClick={() => {
                setCurrentChatId(chat.id);
                loadChatMessages(chat.id);
                setSidebarOpen(false);
              }}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <MessageSquare className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                    <h3 className="text-sm font-medium truncate">{chat.title}</h3>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-gray-400">
                    <Clock className="w-3 h-3" />
                    <span>{formatTime(chat.timestamp)}</span>
                  </div>
                  {chat.tools && chat.tools.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {chat.tools.slice(0, 2).map(toolId => (
                        <span key={toolId} className="text-xs bg-cyan-500 bg-opacity-20 text-cyan-300 px-2 py-0.5 rounded">
                          {allTools.find(t => t.id === toolId)?.name}
                        </span>
                      ))}
                      {chat.tools.length > 2 && (
                        <span className="text-xs text-gray-400">+{chat.tools.length - 2}</span>
                      )}
                    </div>
                  )}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    if (window.confirm('Are you sure you want to delete this chat?')) {
                      deleteChat(chat.id);
                    }
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500 hover:bg-opacity-20 rounded transition-all"
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              </div>
            </div>
          ))}

          {chats.length === 0 && (
            <div className="text-center text-gray-500 py-8">
              <p className="text-sm">No chats yet</p>
              <p className="text-xs mt-1">Click "New Chat" to start</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col">
        <div className="bg-black bg-opacity-50 backdrop-blur-lg border-b border-cyan-500 border-opacity-30 p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setSidebarOpen(true)}
              className="p-2 hover:bg-cyan-500 hover:bg-opacity-20 rounded-lg transition-colors"
            >
              <Menu className="w-6 h-6 text-cyan-400" />
            </button>
            <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-2xl flex items-center justify-center">
              <Shield className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold">DefinitelyNotSkynet</h1>
              {launchedTools.length > 0 && (
                <p className="text-xs text-cyan-300">{launchedTools.length} tools active</p>
              )}
            </div>
          </div>
          
          <button
            onClick={() => setShowToolModal(true)}
            className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 px-5 py-2.5 rounded-xl flex items-center gap-2 transition-all shadow-lg shadow-cyan-500/20"
          >
            <Shield className="w-5 h-5" />
            <span className="font-medium">Launch Tools</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {!currentChat || currentChat.messages.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center max-w-2xl">
                <div className="w-24 h-24 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6 transform rotate-3 shadow-2xl">
                  <Shield className="w-14 h-14 text-white" />
                </div>
                <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                  Hello {user.name}!
                </h2>
                <p className="text-gray-400 text-lg mb-8">
                  I can help you with security-related questions and best practices.
                </p>
                
                <div className="grid grid-cols-3 gap-4 mb-8">
                  {['Network\nScanning', 'Vulnerability\nTesting', 'Security\nAuditing'].map((text, idx) => (
                    <div key={idx} className="bg-gray-800 bg-opacity-40 backdrop-blur-sm border border-cyan-500 border-opacity-20 rounded-2xl p-6 hover:border-opacity-40 transition-all">
                      <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                        <Shield className="w-6 h-6" />
                      </div>
                      <p className="text-sm font-medium whitespace-pre-line">{text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-6 max-w-5xl mx-auto">
              {currentChat.messages.map((msg, idx) => (
                <div key={idx}>
                  {msg.sender === 'user' ? (
                    <div className="flex justify-end">
                      <div className="max-w-[80%] px-5 py-4 rounded-3xl shadow-lg bg-gradient-to-r from-cyan-600 to-blue-600 text-white">
                        <div className="whitespace-pre-line leading-relaxed">{msg.text}</div>
                      </div>
                    </div>
                  ) : msg.sender === 'system' ? (
                    <div className="flex justify-start">
                      <div className="max-w-[80%] px-5 py-4 rounded-3xl shadow-lg bg-gradient-to-r from-green-600 to-emerald-600 text-white">
                        <div className="whitespace-pre-line leading-relaxed">{msg.text}</div>
                      </div>
                    </div>
                  ) : msg.response?.type === 'tool_execution' ? (
                    <div className="space-y-3">
                      <div className="flex items-center gap-2 text-cyan-400 mb-2">
                        <Shield className="w-4 h-4" />
                        <span className="text-sm font-semibold uppercase tracking-wide">Agent Response</span>
                      </div>

                      <div className="bg-blue-900 bg-opacity-30 border border-blue-500 border-opacity-40 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-3">
                          <Terminal className="w-5 h-5 text-blue-400" />
                          <span className="font-mono text-sm font-bold text-blue-300">Tool Call Request</span>
                        </div>
                        <div className="space-y-2 font-mono text-sm">
                          <div className="text-gray-300">
                            <span className="text-cyan-400">name:</span> {msg.response.toolData.toolCall.name}
                          </div>
                          <div className="text-gray-300">
                            <span className="text-cyan-400">args:</span> {JSON.stringify(msg.response.toolData.toolCall.args, null, 2)}
                          </div>
                        </div>
                      </div>

                      <div className="bg-green-900 bg-opacity-30 border border-green-500 border-opacity-40 rounded-xl p-4">
                        <div className="flex items-center gap-2">
                          <CheckCircle className="w-5 h-5 text-green-400" />
                          <span className="font-mono text-sm font-bold text-green-300">
                            --------- {msg.response.toolData.validation} ---------
                          </span>
                        </div>
                      </div>

                      <div className="bg-gray-800 bg-opacity-90 border border-cyan-500 border-opacity-20 rounded-xl p-5 shadow-lg">
                        <div className="flex items-center gap-2 mb-3">
                          <Terminal className="w-5 h-5 text-cyan-400" />
                          <span className="font-mono text-sm font-bold text-cyan-300">Tool Execution Result</span>
                        </div>
                        <div className="space-y-2 font-mono text-xs text-gray-300">
                          <div><span className="text-cyan-400">Tool_name =</span> {msg.response.toolData.toolCall.name}</div>
                          <div><span className="text-cyan-400">Tool_Args =</span> {JSON.stringify(msg.response.toolData.toolCall.args)}</div>
                          <div className="pt-3 border-t border-gray-700">
                            <span className="text-cyan-400">Content:</span>
                            <pre className="mt-2 text-green-400 whitespace-pre-wrap leading-relaxed">{msg.response.toolData.output}</pre>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="flex justify-start">
                      <div className="max-w-[80%] px-5 py-4 rounded-3xl shadow-lg bg-gray-800 bg-opacity-90 backdrop-blur-sm border border-cyan-500 border-opacity-20">
                        <div className="flex items-center gap-2 mb-3 text-cyan-400">
                          <Shield className="w-4 h-4" />
                          <span className="text-xs font-semibold uppercase tracking-wide">Security Bot</span>
                        </div>
                        <div className="whitespace-pre-line leading-relaxed">{msg.response?.text || msg.text}</div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
              
              {typing && (
                <div className="flex justify-start">
                  <div className="bg-gray-800 bg-opacity-90 px-6 py-4 rounded-3xl border border-cyan-500 border-opacity-20">
                    <div className="flex gap-2">
                      <div className="w-3 h-3 bg-cyan-400 rounded-full animate-bounce"></div>
                      <div className="w-3 h-3 bg-cyan-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                      <div className="w-3 h-3 bg-cyan-400 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="border-t border-cyan-500 border-opacity-30 p-6 bg-black bg-opacity-50 backdrop-blur-lg">
          <div className="max-w-4xl mx-auto flex gap-3">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
              placeholder="Ask your security question here..."
              className="flex-1 bg-gray-800 bg-opacity-80 text-white rounded-2xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-cyan-500 border border-cyan-500 border-opacity-30 placeholder-gray-500"
              disabled={!currentChatId}
            />
            <button
              onClick={sendMessage}
              disabled={!currentChatId || !input.trim()}
              className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-2xl px-8 py-4 flex items-center justify-center gap-2 transition-all shadow-lg shadow-cyan-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-6 h-6" />
            </button>
          </div>
          {!currentChatId && (
            <p className="text-center text-sm text-gray-400 mt-2">
              Create a new chat to start messaging
            </p>
          )}
        </div>
      </div>

      {showToolModal && (
        <div className="fixed inset-0 bg-black bg-opacity-80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-gradient-to-br from-gray-900 to-gray-800 rounded-3xl border-2 border-cyan-500 border-opacity-30 max-w-4xl w-full max-h-[85vh] flex flex-col shadow-2xl">
            <div className="p-6 border-b border-cyan-500 border-opacity-30 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center">
                  <Shield className="w-7 h-7" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">Available Security Tools</h2>
                  <p className="text-sm text-gray-400">Select tools to configure and launch</p>
                </div>
              </div>
              <button onClick={() => setShowToolModal(false)} className="p-2 hover:bg-red-500 hover:bg-opacity-20 rounded-xl transition-colors">
                <X className="w-6 h-6 text-red-400" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6">
              <div className="grid grid-cols-2 gap-4">
                {allTools.map(tool => {
                  const isSelected = selectedTools.includes(tool.id);
                  const isLaunched = launchedTools.includes(tool.id);
                  
                  return (
                    <button
                      key={tool.id}
                      onClick={() => !isLaunched && toggleToolSelection(tool.id)}
                      disabled={isLaunched}
                      className={`p-5 rounded-2xl border-2 transition-all text-left group ${
                        isLaunched
                          ? 'bg-green-900 bg-opacity-20 border-green-500 border-opacity-50 cursor-not-allowed'
                          : isSelected
                          ? 'bg-cyan-600 bg-opacity-20 border-cyan-400 border-opacity-70 shadow-lg shadow-cyan-500/20'
                          : 'bg-gray-800 bg-opacity-40 border-cyan-500 border-opacity-20 hover:border-cyan-400 hover:border-opacity-50 hover:shadow-lg'
                      }`}
                    >
                      <div className="flex items-start gap-4">
                        <div className={`w-14 h-14 rounded-xl flex items-center justify-center bg-gradient-to-br ${tool.color} shadow-lg`}>
                          <Shield className="w-7 h-7 text-white" />
                        </div>
                        <div className="flex-1">
                          <h3 className="font-bold text-lg mb-1">{tool.name}</h3>
                          <p className="text-sm text-gray-400">{tool.description}</p>
                          </div>
                    {isLaunched && (
                      <span className="text-xs bg-green-500 bg-opacity-30 text-green-300 px-3 py-1 rounded-full font-medium">
                        Active
                      </span>
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="p-6 border-t border-cyan-500 border-opacity-30 flex items-center justify-between bg-gray-900 bg-opacity-50">
          <div className="text-sm text-gray-400">
            {selectedTools.length > 0 ? (
              <span className="text-cyan-400 font-medium">{selectedTools.length} tool(s) selected</span>
            ) : (
              <span>Select tools to launch</span>
            )}
          </div>
          <button
            onClick={launchTools}
            disabled={selectedTools.length === 0 || launching}
            className={`px-8 py-3 rounded-xl font-bold flex items-center gap-3 transition-all ${
              selectedTools.length === 0 || launching
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-xl shadow-cyan-500/30'
            }`}
          >
            {launching ? (
              <>
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Configuring Tools...</span>
              </>
            ) : (
              <>
                <Shield className="w-5 h-5" />
                <span>Launch Selected Tools</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  )}
</div>
  );}
