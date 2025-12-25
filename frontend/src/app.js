import React, { useState, useEffect } from 'react';
import { Send, Shield, Menu, X, Plus, MessageSquare, Trash2, Clock, Terminal, CheckCircle, LogOut, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider, OAuthProvider, signInWithPopup, signOut } from 'firebase/auth';

const API_URL = 'https://definitelynotskynet.onrender.com';

const firebaseConfig = {
  apiKey: "AIzaSyAKsSOs33PBDieqyj5Rnwon-5P53hxpjwk",
  authDomain: "imagine-group-26.firebaseapp.com",
  projectId: "imagine-group-26",
  storageBucket: "imagine-group-26.firebasestorage.app",
  messagingSenderId: "317470840984",
  appId: "1:317470840984:web:3ffd4cbe301e66df3298ed",
  measurementId: "G-P6WCE14J42"
};

let firebaseAuth = null;
let googleProvider = null;
let appleProvider = null;

const initializeFirebase = () => {
  try {
    const app = initializeApp(firebaseConfig);
    firebaseAuth = getAuth(app);
    googleProvider = new GoogleAuthProvider();
    appleProvider = new OAuthProvider('apple.com');
    console.log('✅ Firebase initialized');
    return true;
  } catch (error) {
    console.error('❌ Firebase initialization failed:', error);
    return false;
  }
};

function Login({ onLoginSuccess }) {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [firebaseReady, setFirebaseReady] = useState(false);

  useEffect(() => {
    const ready = initializeFirebase();
    setFirebaseReady(ready);
  }, []);

  const handleGoogleLogin = async () => {
    if (!firebaseReady) {
      alert('Firebase is still initializing. Please wait...');
      return;
    }

    setLoading(true);
    try {
      const result = await signInWithPopup(firebaseAuth, googleProvider);
      const user = result.user;
      
      const userData = {
        id: user.uid,
        name: user.displayName,
        email: user.email,
        provider: 'google',
        avatar: user.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.displayName)}&background=4285F4&color=fff`
      };
      
      localStorage.setItem('cybersec_user', JSON.stringify(userData));
      onLoginSuccess(userData);
    } catch (error) {
      console.error('Google Sign-In Error:', error);
      alert('Google Sign-In failed: ' + (error.message || 'Unknown error'));
      setLoading(false);
    }
  };

  const handleAppleLogin = async () => {
    if (!firebaseReady) {
      alert('Firebase is still initializing. Please wait...');
      return;
    }

    setLoading(true);
    try {
      const result = await signInWithPopup(firebaseAuth, appleProvider);
      const user = result.user;
      
      const userData = {
        id: user.uid,
        name: user.displayName || 'Apple User',
        email: user.email,
        provider: 'apple',
        avatar: user.photoURL || `https://ui-avatars.com/api/?name=Apple+User&background=000&color=fff`
      };
      
      localStorage.setItem('cybersec_user', JSON.stringify(userData));
      onLoginSuccess(userData);
    } catch (error) {
      console.error('Apple Sign-In Error:', error);
      alert('Apple Sign-In failed: ' + (error.message || 'Unknown error'));
      setLoading(false);
    }
  };

  const handleEmailLogin = (e) => {
    e.preventDefault();
    if (!email || !password) return;
    
    setLoading(true);
    setTimeout(() => {
      const user = {
        id: 'email_' + Date.now(),
        name: email.split('@')[0],
        email: email,
        provider: 'email',
        avatar: `https://ui-avatars.com/api/?name=${email.split('@')[0]}&background=06B6D4&color=fff`
      };
      localStorage.setItem('cybersec_user', JSON.stringify(user));
      onLoginSuccess(user);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <div className="w-20 h-20 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-4 transform rotate-3 shadow-2xl">
            <Shield className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
            DefinitelyNotSkynet
          </h1>
          <p className="text-gray-400">Your Cybersecurity Assistant</p>
        </div>

        <div className="bg-gray-800 bg-opacity-50 backdrop-blur-xl border border-cyan-500 border-opacity-30 rounded-3xl p-8 shadow-2xl">
          <h2 className="text-2xl font-bold text-white mb-6 text-center">Welcome Back</h2>

          <div className="space-y-3 mb-6">
            <button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full bg-white hover:bg-gray-100 text-gray-900 font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
              {loading ? 'Signing in...' : 'Continue with Google'}
            </button>

            <button
              onClick={handleAppleLogin}
              disabled={loading}
              className="w-full bg-black hover:bg-gray-900 text-white font-semibold py-3 px-4 rounded-xl flex items-center justify-center gap-3 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg border border-gray-700"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
              </svg>
              {loading ? 'Signing in...' : 'Continue with Apple'}
            </button>
          </div>

          <div className="relative my-6">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-600"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-gray-800 text-gray-400">Or continue with email</span>
            </div>
          </div>

          <form onSubmit={handleEmailLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="your.email@example.com"
                  className="w-full bg-gray-700 bg-opacity-50 text-white rounded-xl pl-11 pr-4 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 border border-gray-600"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-300 mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full bg-gray-700 bg-opacity-50 text-white rounded-xl pl-11 pr-11 py-3 focus:outline-none focus:ring-2 focus:ring-cyan-500 border border-gray-600"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-300"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white font-bold py-3 px-4 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-cyan-500/30"
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <p className="text-center text-sm text-gray-400 mt-6">
            Don't have an account?{' '}
            <button className="text-cyan-400 hover:text-cyan-300 font-semibold">
              Sign up
            </button>
          </p>
        </div>

        <p className="text-center text-xs text-gray-500 mt-6">
          Secured by DefinitelyNotSkynet™ • Your data is encrypted
        </p>
      </div>
    </div>
  );
}

export default function CyberSecurityChat() {
  const [user, setUser] = useState(null);
  const [chats, setChats] = useState([
    { id: 1, title: 'New Chat', messages: [], timestamp: new Date(), launchedTools: [] }
  ]);
  const [currentChatId, setCurrentChatId] = useState(1);
  const [input, setInput] = useState('');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [typing, setTyping] = useState(false);
  const [showToolModal, setShowToolModal] = useState(false);
  const [selectedTools, setSelectedTools] = useState([]);
  const [launching, setLaunching] = useState(false);
  
  const allTools = [
    { id: 'do-nmap', name: 'Nmap Scanner', description: 'Network exploration and security auditing tool', color: 'from-blue-500 to-cyan-500' },
    { id: 'do-sqlmap', name: 'SQLMap', description: 'Automatic SQL injection detection tool', color: 'from-red-500 to-orange-500' },
    { id: 'do-ffuf', name: 'FFUF', description: 'Fast web fuzzer written in Go', color: 'from-purple-500 to-pink-500' },
    { id: 'do-masscan', name: 'Masscan', description: 'TCP port scanner, asynchronous', color: 'from-green-500 to-emerald-500' },
    { id: 'do-sslscan', name: 'SSLScan', description: 'Tests SSL/TLS enabled services', color: 'from-yellow-500 to-orange-500' }
  ];

  const currentChat = chats.find(c => c.id === currentChatId);
  const launchedTools = currentChat?.launchedTools || [];

  useEffect(() => {
    const savedUser = localStorage.getItem('cybersec_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  useEffect(() => {
    if (user && launchedTools.length === 0) {
      setShowToolModal(true);
    }
  }, [user, launchedTools.length]);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
  };

  const handleLogout = async () => {
    try {
      if (firebaseAuth) {
        await signOut(firebaseAuth);
      }
      localStorage.removeItem('cybersec_user');
      setUser(null);
      setChats([{ id: 1, title: 'New Chat', messages: [], timestamp: new Date(), launchedTools: [] }]);
      setCurrentChatId(1);
    } catch (error) {
      console.error('Logout error:', error);
      localStorage.removeItem('cybersec_user');
      setUser(null);
    }
  };

  const sendMessage = async () => {
    if (!input.trim()) return;

    const newMessage = { text: input, sender: 'user', timestamp: new Date() };
    const updatedMessages = [...currentChat.messages, newMessage];
    const updatedTitle = currentChat.messages.length === 0 ? input.slice(0, 30) + '...' : currentChat.title;

    setChats(chats.map(c => 
      c.id === currentChatId 
        ? { ...c, messages: updatedMessages, title: updatedTitle }
        : c
    ));
    
    const userQuery = input;
    setInput('');
    setTyping(true);

    try {
      const response = await fetch(`${API_URL}/api/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          query: userQuery,
          chat_id: currentChatId.toString(),
          tools: launchedTools
        })
      });

      const data = await response.json();

      if (data.success) {
        let aiMessage;

        if (data.tool_call && data.tool_output) {
          aiMessage = {
            response: {
              type: 'tool_execution',
              toolData: {
                toolCall: data.tool_call,
                validation: data.tool_validation || 'Valid Arguments',
                output: data.tool_output
              }
            },
            sender: 'ai',
            timestamp: new Date()
          };
        } else {
          aiMessage = {
            response: {
              type: 'text',
              text: data.response
            },
            sender: 'ai',
            timestamp: new Date()
          };
        }

        setChats(chats.map(c => 
          c.id === currentChatId 
            ? { ...c, messages: [...updatedMessages, aiMessage] }
            : c
        ));
      } else {
        throw new Error(data.error || 'Unknown error');
      }
    } catch (error) {
      console.error('Backend error:', error);
      
      const errorMessage = {
        response: {
          type: 'text',
          text: `❌ Error: Could not connect to backend server.\n\nMake sure the Python server is running on ${API_URL}\n\nRun: python server.py`
        },
        sender: 'ai',
        timestamp: new Date()
      };
      
      setChats(chats.map(c => 
        c.id === currentChatId 
          ? { ...c, messages: [...updatedMessages, errorMessage] }
          : c
      ));
    } finally {
      setTyping(false);
    }
  };

  const createNewChat = () => {
    const newChat = {
      id: Date.now(),
      title: 'New Chat',
      messages: [],
      timestamp: new Date(),
      launchedTools: []
    };
    setChats([newChat, ...chats]);
    setCurrentChatId(newChat.id);
    setSidebarOpen(false);
    setShowToolModal(true);
  };

  const deleteChat = (chatId) => {
    if (chats.length === 1) return;
    const filtered = chats.filter(c => c.id !== chatId);
    setChats(filtered);
    if (currentChatId === chatId) {
      setCurrentChatId(filtered[0].id);
    }
  };

  const launchTools = async () => {
    if (selectedTools.length === 0) return;
    
    setLaunching(true);
    
    try {
      const response = await fetch(`${API_URL}/api/launch-tools`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tools: selectedTools,
          chat_id: currentChatId.toString()
        })
      });

      const data = await response.json();

      if (data.success) {
        const updatedLaunchedTools = [...new Set([...launchedTools, ...selectedTools])];
        const toolNames = selectedTools.map(id => allTools.find(t => t.id === id)?.name).join(', ');
        const systemMessage = {
          text: `✅ Tools configured and launched: ${toolNames}\n\nThese tools are now ready to use. Ask me to scan, test, or analyze targets!`,
          sender: 'system',
          timestamp: new Date()
        };
        
        setChats(chats.map(c => 
          c.id === currentChatId 
            ? { 
                ...c, 
                messages: [...c.messages, systemMessage],
                launchedTools: updatedLaunchedTools,
                title: c.messages.length === 0 ? `Chat with ${toolNames}` : c.title
              }
            : c
        ));
      }
    } catch (error) {
      console.error('Error launching tools:', error);
      alert('Failed to launch tools. Make sure backend is running!');
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

  if (!user) {
    return <Login onLoginSuccess={handleLoginSuccess} />;
  }

  return (
    <div className="flex h-screen bg-gradient-to-br from-gray-900 via-blue-900 to-gray-900 text-white">
      <div className={`${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} fixed inset-y-0 left-0 w-80 bg-black bg-opacity-80 backdrop-blur-xl border-r border-cyan-500 border-opacity-20 transition-transform duration-300 z-50 flex flex-col`}>
        <div className="p-4 border-b border-cyan-500 border-opacity-20">
          <div className="flex items-center gap-3 mb-4">
            <img src={user.avatar} alt={user.name} className="w-10 h-10 rounded-full" />
            <div className="flex-1">
              <h3 className="font-semibold text-sm">{user.name}</h3>
              <p className="text-xs text-gray-400">{user.email}</p>
            </div>
            <button onClick={handleLogout} className="p-2 hover:bg-red-500 hover:bg-opacity-20 rounded-lg transition-colors" title="Logout">
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
                  {chat.launchedTools.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {chat.launchedTools.slice(0, 2).map(toolId => (
                        <span key={toolId} className="text-xs bg-cyan-500 bg-opacity-20 text-cyan-300 px-2 py-0.5 rounded">
                          {allTools.find(t => t.id === toolId)?.name}
                        </span>
                      ))}
                      {chat.launchedTools.length > 2 && (
                        <span className="text-xs text-gray-400">+{chat.launchedTools.length - 2}</span>
                      )}
                    </div>
                  )}
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteChat(chat.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-500 hover:bg-opacity-20 rounded transition-all"
                >
                  <Trash2 className="w-4 h-4 text-red-400" />
                </button>
              </div>
            </div>
          ))}
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
          {currentChat?.messages.length === 0 ? (
            <div className="h-full flex items-center justify-center">
              <div className="text-center max-w-2xl">
                <div className="w-24 h-24 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6 transform rotate-3 shadow-2xl">
                  <Shield className="w-14 h-14 text-white" />
                </div>
                <h2 className="text-3xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
                  Hello! I'm DefinitelyNotSkynet.
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
                          <div className="text-gray-300">
                            <span className="text-cyan-400">id:</span> {msg.response.toolData.toolCall.id}
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
                        <div className="whitespace-pre-line leading-relaxed">{msg.response.text}</div>
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
              onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
              placeholder="Ask your security question here..."
              className="flex-1 bg-gray-800 bg-opacity-80 text-white rounded-2xl px-6 py-4 focus:outline-none focus:ring-2 focus:ring-cyan-500 border border-cyan-500 border-opacity-30 placeholder-gray-500"
            />
            <button
              onClick={sendMessage}
              className="bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white rounded-2xl px-8 py-4 flex items-center justify-center gap-2 transition-all shadow-lg shadow-cyan-500/20"
            >
              <Send className="w-6 h-6" />
            </button>
          </div>
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
  );
}
