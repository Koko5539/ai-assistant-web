'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Send, User, Bot, Crown, Menu, X, Trash2, LogOut, Heart, Flame, Cloud, Shield, UserCircle, Settings, Sparkles, MessageCircle, Code, Gamepad2, Cpu } from 'lucide-react';
import { checkAuth, localLogout } from '@/lib/localAuth';
import { roleConfigs, generateAIResponse } from '@/lib/aiResponses';
import type { RoleMode } from '@/lib/aiResponses';

type BottomTab = 'chat' | 'profile';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

// 图标字符串到组件的映射
const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Heart, Flame, Cloud, Shield, Code, Gamepad2, Cpu
};

export default function ChatPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVIP, setIsVIP] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userName, setUserName] = useState('');
  const [userAccount, setUserAccount] = useState('');
  const [currentRole, setCurrentRole] = useState<RoleMode>('lover');
  const [activeTab, setActiveTab] = useState<BottomTab>('chat');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // 获取当前模式的图标组件
  const CurrentRoleIcon = useMemo(() => {
    return iconMap[roleConfigs[currentRole].icon] || Bot;
  }, [currentRole]);

  // 检查登录状态
  useEffect(() => {
    const user = checkAuth();
    if (!user) {
      router.push('/login');
      return;
    }
    
    setUserName(user.nickname || user.account);
    setUserAccount(user.account);
    setIsVIP(user.isVIP);
    
    const welcomeMessage: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: user.isVIP 
        ? `欢迎回来，${user.nickname}~ 我是你的全能AI助手！🎉\n\n当前模式：${roleConfigs[currentRole].name}\n${roleConfigs[currentRole].description}\n\n共7种模式可切换：\n💕 恋人 / 🔥 毒舌 / ☁️ 温柔 / 👑 霸道\n💻 编程助手 / 🎮 游戏开发 / ⚙️ 汇编模式\n\n点击左上角菜单切换模式~`
        : `你好呀！我是你的AI助手。\n\n普通用户只能查看界面，AI对话功能需要升级VIP才能使用哦~`,
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
    inputRef.current?.blur();

    setTimeout(() => {
      const aiResponse = generateAIResponse(userMessage.content, currentRole, isVIP);
      
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date(),
      };

      setMessages(prev => [...prev, aiMessage]);
      setIsLoading(false);
    }, 800 + Math.random() * 1200);
  };

  const handleClear = () => {
    setMessages([]);
    const welcomeMessage: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: isVIP
        ? `对话已清空！当前模式：${roleConfigs[currentRole].name}\n${roleConfigs[currentRole].description}`
        : `对话已清空！升级VIP即可解锁AI对话功能~`,
      timestamp: new Date(),
    };
    setMessages([welcomeMessage]);
  };

  const handleLogout = () => {
    localLogout();
    router.push('/login');
  };

  const switchRole = (role: RoleMode) => {
    setCurrentRole(role);
    setSidebarOpen(false);
    
    const roleMessage: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: `已切换到【${roleConfigs[role].name}】\n${roleConfigs[role].description}\n\n现在你可以向我提问相关的问题啦~`,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, roleMessage]);
  };

  // 发送按钮颜色
  const sendBtnGradient = useMemo(() => {
    const map: Record<string, string> = {
      lover: 'from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500',
      toxic: 'from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500',
      gentle: 'from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500',
      dominant: 'from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500',
      coder: 'from-green-600 to-emerald-600 hover:from-green-500 hover:to-emerald-500',
      gamer: 'from-purple-600 to-violet-600 hover:from-purple-500 hover:to-violet-500',
      assembly: 'from-amber-600 to-yellow-600 hover:from-amber-500 hover:to-yellow-500',
    };
    return map[currentRole] || map.lover;
  }, [currentRole]);

  // 聊天界面
  const ChatView = () => (
    <>
      <div className="flex items-center justify-between p-3 sm:p-4 border-b border-slate-700 bg-slate-800/50">
        <button onClick={() => setSidebarOpen(true)} className="lg:hidden text-gray-400 hover:text-white p-2 -ml-2">
          <Menu className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
        <div className="flex items-center gap-2">
          <h1 className="text-base sm:text-lg font-semibold text-white">AI对话</h1>
          {isVIP && (
            <span className={`text-xs px-2 py-1 rounded-full ${roleConfigs[currentRole].bgColor} ${roleConfigs[currentRole].color} ${roleConfigs[currentRole].borderColor} border`}>
              {roleConfigs[currentRole].name}
            </span>
          )}
        </div>
        <div className="w-8 sm:w-10" />
      </div>

      <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3 sm:space-y-4">
        {messages.map((message) => (
          <div key={message.id} className={`flex gap-2 sm:gap-4 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
              message.role === 'user'
                ? 'bg-gradient-to-br from-blue-500 to-purple-500'
                : isVIP ? roleConfigs[currentRole].bgColor : 'bg-gradient-to-br from-green-500 to-teal-500'
            }`}>
              {message.role === 'user' ? (
                <User className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              ) : (
                <Bot className={`w-4 h-4 sm:w-5 sm:h-5 ${isVIP ? roleConfigs[currentRole].color : 'text-white'}`} />
              )}
            </div>
            <div className={`max-w-[80%] sm:max-w-[75%] ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
              <div className={`px-3 py-2 sm:px-4 sm:py-3 rounded-2xl text-sm sm:text-base ${
                message.role === 'user'
                  ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                  : isVIP
                    ? `${roleConfigs[currentRole].bgColor} ${roleConfigs[currentRole].borderColor} border text-gray-100`
                    : 'bg-slate-700 text-gray-100'
              }`}>
                <p className="whitespace-pre-wrap break-words">{message.content}</p>
              </div>
              <span className="text-xs text-gray-500 mt-1">
                {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        ))}
        
        {isLoading && (
          <div className="flex gap-2 sm:gap-4">
            <div className={`w-8 h-8 sm:w-10 sm:h-10 rounded-full flex items-center justify-center ${roleConfigs[currentRole].bgColor}`}>
              <Bot className={`w-4 h-4 sm:w-5 sm:h-5 ${roleConfigs[currentRole].color}`} />
            </div>
            <div className={`px-3 py-2 sm:px-4 sm:py-3 rounded-2xl ${roleConfigs[currentRole].bgColor} ${roleConfigs[currentRole].borderColor} border`}>
              <div className="flex gap-1.5 sm:gap-2">
                <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full animate-bounce ${roleConfigs[currentRole].color.replace('text-', 'bg-')}`} />
                <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full animate-bounce ${roleConfigs[currentRole].color.replace('text-', 'bg-')}`} style={{ animationDelay: '0.1s' }} />
                <div className={`w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full animate-bounce ${roleConfigs[currentRole].color.replace('text-', 'bg-')}`} style={{ animationDelay: '0.2s' }} />
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <div className="p-3 sm:p-4 border-t border-slate-700 bg-slate-800/50 safe-area-pb">
        {!isVIP ? (
          <div className="text-center py-4">
            <p className="text-gray-400 mb-2">AI对话功能仅限VIP会员使用</p>
            <button onClick={() => router.push('/settings')} className="px-6 py-2 bg-gradient-to-r from-yellow-600 to-orange-600 text-white rounded-xl font-medium">
              升级VIP
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSend()}
              placeholder={`输入消息... 当前${roleConfigs[currentRole].name}`}
              disabled={isLoading}
              className={`flex-1 px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-700 border rounded-xl text-white placeholder-gray-400 focus:outline-none transition-colors disabled:opacity-50 text-sm sm:text-base ${roleConfigs[currentRole].borderColor}`}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isLoading}
              className={`px-3 sm:px-4 py-2.5 sm:py-3 bg-gradient-to-r text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${sendBtnGradient}`}
            >
              <Send className="w-4 h-4 sm:w-5 sm:h-5" />
            </button>
          </div>
        )}
      </div>
    </>
  );

  // 个人中心界面
  const ProfileView = () => (
    <div className="flex-1 overflow-y-auto">
      <div className="flex items-center justify-center p-3 sm:p-4 border-b border-slate-700 bg-slate-800/50">
        <h1 className="text-base sm:text-lg font-semibold text-white">我的</h1>
      </div>
      <div className="p-4 space-y-4">
        <div className="bg-gradient-to-br from-slate-800 to-slate-700 rounded-2xl p-6 border border-slate-600">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
            <div className="flex-1">
              <h2 className="text-xl font-bold text-white">{userName}</h2>
              <p className="text-gray-400 text-sm">账号: {userAccount}</p>
              <div className="flex items-center gap-2 mt-2">
                {isVIP ? (
                  <span className="px-3 py-1 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-full text-yellow-400 text-sm font-medium flex items-center gap-1">
                    <Crown className="w-4 h-4" /> VIP会员
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-slate-600 rounded-full text-gray-300 text-sm">普通用户</span>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className={`rounded-2xl p-6 border ${isVIP ? 'bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/30' : 'bg-slate-800 border-slate-600'}`}>
          <div className="flex items-center gap-3 mb-4">
            <Sparkles className={`w-6 h-6 ${isVIP ? 'text-yellow-400' : 'text-gray-400'}`} />
            <h3 className="text-lg font-semibold text-white">VIP状态</h3>
          </div>
          {isVIP ? (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-gray-300">会员状态</span>
                <span className="text-yellow-400 font-medium">已解锁</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300">当前模式</span>
                <span className={`${roleConfigs[currentRole].color} font-medium`}>{roleConfigs[currentRole].name}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300">可用模式</span>
                <span className="text-green-400 font-medium">7种全部解锁</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-300">回复词库</span>
                <span className="text-green-400 font-medium">350+条</span>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="text-gray-400">升级VIP解锁更多功能：</p>
              <ul className="space-y-2 text-sm text-gray-300">
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-yellow-400 rounded-full" />AI智能对话</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-yellow-400 rounded-full" />7种角色模式</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-yellow-400 rounded-full" />350+条丰富回复</li>
                <li className="flex items-center gap-2"><span className="w-1.5 h-1.5 bg-yellow-400 rounded-full" />编程/游戏/汇编代码</li>
              </ul>
              <button onClick={() => router.push('/settings')} className="w-full mt-4 py-3 bg-gradient-to-r from-yellow-600 to-orange-600 text-white rounded-xl font-medium">
                立即升级VIP
              </button>
            </div>
          )}
        </div>

        <div className="bg-slate-800 rounded-2xl border border-slate-600 overflow-hidden">
          <button onClick={() => setSidebarOpen(true)} className="w-full flex items-center gap-4 px-4 py-4 hover:bg-slate-700 transition-colors border-b border-slate-600">
            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-blue-400" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-white font-medium">切换AI模式</p>
              <p className="text-gray-400 text-sm">7种模式自由切换</p>
            </div>
            {isVIP && (
              <span className={`text-xs px-2 py-1 rounded-full ${roleConfigs[currentRole].bgColor} ${roleConfigs[currentRole].color}`}>
                {roleConfigs[currentRole].name}
              </span>
            )}
          </button>
          <button onClick={handleClear} className="w-full flex items-center gap-4 px-4 py-4 hover:bg-slate-700 transition-colors border-b border-slate-600">
            <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
              <Trash2 className="w-5 h-5 text-red-400" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-white font-medium">清空对话</p>
              <p className="text-gray-400 text-sm">清除所有聊天记录</p>
            </div>
          </button>
          <button onClick={() => router.push('/settings')} className="w-full flex items-center gap-4 px-4 py-4 hover:bg-slate-700 transition-colors">
            <div className="w-10 h-10 rounded-full bg-gray-500/20 flex items-center justify-center">
              <Settings className="w-5 h-5 text-gray-400" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-white font-medium">设置</p>
              <p className="text-gray-400 text-sm">账号设置与帮助</p>
            </div>
          </button>
        </div>

        <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-4 py-4 bg-red-500/10 text-red-400 rounded-2xl border border-red-500/30 hover:bg-red-500/20 transition-colors">
          <LogOut className="w-5 h-5" />
          <span>退出登录</span>
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-slate-900 overflow-hidden">
      {/* 侧边栏 */}
      <div className={`fixed inset-y-0 left-0 z-50 w-[280px] sm:w-64 bg-slate-800 transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0 shadow-2xl lg:shadow-none overflow-y-auto`}>
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-slate-700 flex items-center justify-between">
            <h2 className="text-lg sm:text-xl font-bold text-white">AI助手</h2>
            <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-gray-400 hover:text-white p-2">
              <X className="w-5 h-5" />
            </button>
          </div>

          {isVIP && (
            <div className="px-4 py-3">
              <div className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-lg">
                <Crown className="w-4 h-4 text-yellow-400" />
                <span className="text-yellow-400 text-sm font-medium">VIP会员 · 7种模式</span>
              </div>
            </div>
          )}

          {isVIP && (
            <div className="px-4 py-2">
              <p className="text-gray-400 text-xs mb-2">💬 聊天模式</p>
              <div className="space-y-1 mb-3">
                {(['lover', 'toxic', 'gentle', 'dominant'] as RoleMode[]).map((role) => {
                  const RoleIcon = iconMap[roleConfigs[role].icon] || Bot;
                  return (
                    <button
                      key={role}
                      onClick={() => switchRole(role)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${roleConfigs[role].bgColor} ${roleConfigs[role].borderColor} border ${currentRole === role ? 'ring-2 ring-white/30' : ''}`}
                    >
                      <RoleIcon className={`w-4 h-4 ${roleConfigs[role].color}`} />
                      <div className="flex-1 text-left">
                        <p className={`text-sm ${roleConfigs[role].color}`}>{roleConfigs[role].name}</p>
                      </div>
                      {currentRole === role && <span className="text-xs text-gray-400">当前</span>}
                    </button>
                  );
                })}
              </div>
              <p className="text-gray-400 text-xs mb-2">🛠️ 编程模式</p>
              <div className="space-y-1">
                {(['coder', 'gamer', 'assembly'] as RoleMode[]).map((role) => {
                  const RoleIcon = iconMap[roleConfigs[role].icon] || Bot;
                  return (
                    <button
                      key={role}
                      onClick={() => switchRole(role)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${roleConfigs[role].bgColor} ${roleConfigs[role].borderColor} border ${currentRole === role ? 'ring-2 ring-white/30' : ''}`}
                    >
                      <RoleIcon className={`w-4 h-4 ${roleConfigs[role].color}`} />
                      <div className="flex-1 text-left">
                        <p className={`text-sm ${roleConfigs[role].color}`}>{roleConfigs[role].name}</p>
                      </div>
                      {currentRole === role && <span className="text-xs text-gray-400">当前</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          <div className="mt-auto p-3 sm:p-4 border-t border-slate-700">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center flex-shrink-0">
                <User className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-white font-medium text-sm sm:text-base truncate">{userName}</p>
                <p className="text-gray-400 text-xs sm:text-sm">{isVIP ? 'VIP会员' : '普通用户'}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      <div className="flex-1 flex flex-col min-w-0">
        {activeTab === 'chat' ? <ChatView /> : <ProfileView />}

        <div className="flex items-center justify-around p-2 border-t border-slate-700 bg-slate-800/90 backdrop-blur-sm safe-area-pb">
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex flex-col items-center gap-1 px-6 py-2 rounded-xl transition-colors ${activeTab === 'chat' ? 'bg-blue-500/20 text-blue-400' : 'text-gray-400 hover:text-gray-300'}`}
          >
            <MessageCircle className="w-6 h-6" />
            <span className="text-xs">对话</span>
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex flex-col items-center gap-1 px-6 py-2 rounded-xl transition-colors ${activeTab === 'profile' ? 'bg-blue-500/20 text-blue-400' : 'text-gray-400 hover:text-gray-300'}`}
          >
            <UserCircle className="w-6 h-6" />
            <span className="text-xs">我的</span>
          </button>
        </div>
      </div>
    </div>
  );
}
