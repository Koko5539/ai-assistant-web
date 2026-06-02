'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Send, User, Bot, Crown, Menu, X, Trash2, Settings, LogOut, ChevronLeft } from 'lucide-react';
import { checkAuth, localLogout, getCurrentUser, User as UserType } from '@/lib/localAuth';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export default function ChatPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVIP, setIsVIP] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userName, setUserName] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 检查登录状态
  useEffect(() => {
    const user = checkAuth();
    if (!user) {
      router.push('/login');
      return;
    }
    
    setUserName(user.nickname || user.account);
    setIsVIP(user.isVIP);
    
    // 发送欢迎消息
    const welcomeMessage: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: user.isVIP 
        ? `你好呀 ${user.nickname}！我是你的AI助手，VIP会员已激活，所有功能已解锁！我可以帮你写作、写代码、解答问题，有什么我可以帮你的吗？`
        : `你好呀！我是你的AI助手，我应该怎么称呼你呢？我可以帮你写作、写代码、解答问题。`,
      timestamp: new Date(),
    };
    setMessages([welcomeMessage]);
  }, [router]);

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // 隐藏键盘（手机端）
    inputRef.current?.blur();

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: userMessage.content,
          isVIP,
        }),
      });

      if (!response.ok) {
        throw new Error('AI响应失败');
      }

      const data = await response.json();

      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);
    } catch (error) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '抱歉，我遇到了一些问题。请稍后再试或换一种方式提问。',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClear = () => {
    setMessages([]);
    const welcomeMessage: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: isVIP
        ? `对话已清空！VIP会员所有功能已解锁，有什么我可以帮你的吗？`
        : `对话已清空！有什么我可以帮你的吗？`,
      timestamp: new Date(),
    };
    setMessages([welcomeMessage]);
  };

  const handleLogout = () => {
    localLogout();
    router.push('/login');
  };

  return (
    <div className="flex h-screen bg-slate-900 overflow-hidden">
      {/* 侧边栏 - 手机端全屏，桌面端固定 */}
      <div className={`fixed inset-y-0 left-0 z-50 w-[280px] sm:w-64 bg-slate-800 transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0 shadow-2xl lg:shadow-none`}>
        <div className="flex flex-col h-full">
          {/* 头部 */}
          <div className="p-4 border-b border-slate-700 flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-bold text-white">AI助手</h2>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden text-gray-400 hover:text-white p-2"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* VIP标识 */}
          {isVIP && (
            <div className="px-4 py-3">
              <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-lg">
                <Crown className="w-4 h-4 text-yellow-400" />
                <span className="text-yellow-400 text-sm font-medium">VIP会员</span>
              </div>
            </div>
          )}

          {/* 功能列表 */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2">
            <button
              onClick={handleClear}
              className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-slate-700 rounded-lg transition-colors"
            >
              <Trash2 className="w-5 h-5" />
              <span className="text-sm sm:text-base">清空对话</span>
            </button>
            
            <button
              onClick={() => router.push('/settings')}
              className="w-full flex items-center gap-3 px-4 py-3 text-gray-300 hover:bg-slate-700 rounded-lg transition-colors"
            >
              <Settings className="w-5 h-5" />
              <span className="text-sm sm:text-base">设置</span>
            </button>
          </div>

          {/* 底部 */}
          <div className="p-3 sm:p-4 border-t border-slate-700">
            <div className="flex items-center gap-3 mb-3 sm:mb-4">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div className="min-w-0">
                <p className="text-white font-medium text-sm sm:text-base truncate">{userName}</p>
                <p className="text-gray-400 text-xs sm:text-sm">{isVIP ? 'VIP会员' : '普通用户'}</p>
              </div>
            </div>
            
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-2.5 sm:py-3 text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="text-sm sm:text-base">退出登录</span>
            </button>
          </div>
        </div>
      </div>

      {/* 遮罩层 - 手机端显示 */}
      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-black/50 z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* 主内容区 */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* 顶部栏 */}
        <div className="flex items-center justify-between p-3 sm:p-4 border-b border-slate-700 bg-slate-800/50">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden text-gray-400 hover:text-white p-2 -ml-2"
          >
            <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
          </button>
          
          <h1 className="text-base sm:text-lg font-semibold text-white">AI对话</h1>
          
          <div className="w-8 sm:w-10" />
        </div>

        {/* 消息列表 */}
        <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex gap-2 sm:gap-4 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              {/* 头像 */}
              <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                message.role === 'user'
                  ? 'bg-gradient-to-br from-blue-500 to-purple-500'
                  : 'bg-gradient-to-br from-green-500 to-teal-500'
              }`}>
                {message.role === 'user' ? (
                  <User className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                ) : (
                  <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                )}
              </div>

              {/* 消息内容 */}
              <div className={`max-w-[75%] sm:max-w-[70%] ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`px-3 py-2 sm:px-4 sm:py-3 rounded-2xl text-sm sm:text-base ${
                  message.role === 'user'
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                    : 'bg-slate-700 text-gray-100'
                }`}>
                  <p className="whitespace-pre-wrap">{message.content}</p>
                </div>
                <span className="text-xs text-gray-500 mt-1">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            </div>
          ))}
          
          {isLoading && (
            <div className="flex gap-2 sm:gap-4">
              <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-green-500 to-teal-500 flex items-center justify-center">
                <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div className="bg-slate-700 px-3 py-2 sm:px-4 sm:py-3 rounded-2xl">
                <div className="flex gap-1.5 sm:gap-2">
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full animate-bounce" />
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* 输入区 - 固定在底部 */}
        <div className="p-3 sm:p-4 border-t border-slate-700 bg-slate-800/50 safe-area-pb">
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder="输入消息..."
              disabled={isLoading}
              className="flex-1 px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-gray-400 focus:outline-none focus:border-blue-500 transition-colors disabled:opacity-50 text-sm sm:text-base"
            />
            
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className="px-3 sm:px-4 py-2.5 sm:py-3 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Send className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
          
          {!isVIP && (
            <p className="text-center text-gray-500 text-xs sm:text-sm mt-2">
              普通用户有限制，VIP会员解锁全部功能
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
