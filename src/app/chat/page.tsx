'use client';

import { useEffect, useState, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { Send, User, Bot, Crown, Menu, X, Trash2, LogOut, Heart, Flame, Cloud, Shield, UserCircle, Settings, Sparkles, MessageCircle, Code, Gamepad2, Cpu } from 'lucide-react';
import { checkAuth, localLogout } from '@/lib/localAuth';
import { roleConfigs, generateAIResponse } from '@/lib/aiResponses';
import type { RoleMode } from '@/lib/aiResponses';
import { callAI, getAPIConfig } from '@/lib/aiApi';
import RainBackground from '@/components/RainBackground';

type BottomTab = 'chat' | 'features' | 'profile' | 'settings';

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

// 功能模块定义
const featureModules = [
  { id: 'coder', emoji: '💻', name: '智能代码助手', desc: '代码生成、Review、调试', mode: 'coder' as RoleMode, vipOnly: false, devMsg: '' },
  { id: 'gamer', emoji: '🎮', name: 'AI创作平台', desc: '游戏内容、故事、角色', mode: 'gamer' as RoleMode, vipOnly: false, devMsg: '' },
  { id: 'voice', emoji: '🎙️', name: '语音识别', desc: '多语言语音交互', mode: null, vipOnly: true, devMsg: '语音功能开发中' },
  { id: 'knowledge', emoji: '📚', name: '知识库', desc: '文档上传、AI记忆', mode: null, vipOnly: true, devMsg: '知识库功能开发中' },
  { id: 'image', emoji: '🖼️', name: 'AI绘图', desc: '文字生成图片', mode: null, vipOnly: true, devMsg: '绘图功能开发中' },
  { id: 'writing', emoji: '✍️', name: '智能写作', desc: '文章生成、润色', mode: null, vipOnly: true, devMsg: '写作功能开发中' },
  { id: 'assembly', emoji: '⚙️', name: '汇编模式', desc: '汇编语言、底层开发', mode: 'assembly' as RoleMode, vipOnly: false, devMsg: '' },
  { id: 'package', emoji: '🔧', name: 'AI打包', desc: '云端构建APK', mode: null, vipOnly: true, devMsg: '打包功能开发中' },
];

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
  const [toast, setToast] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const messagesRef = useRef<Message[]>([]);

  // 获取当前模式的图标组件
  const CurrentRoleIcon = useMemo(() => {
    return iconMap[roleConfigs[currentRole].icon] || Bot;
  }, [currentRole]);

  // 显示提示消息
  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2000);
  };

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
        ? `欢迎回来，${user.nickname || user.account}~ 我是你的全能AI助手！🎉\n\n当前模式：${roleConfigs['lover'].name}\n${roleConfigs['lover'].description}\n\n💡 提示：\n- 点击左上角菜单切换7种AI模式\n- 点击底部「功能」查看所有功能模块\n- 点击底部「我的」查看VIP状态\n\n共7种模式：💕恋人 🔥毒舌 ☁️温柔 👑霸道 💻编程 🎮游戏 ⚙️汇编`
        : `你好呀！我是你的AI助手。\n\n普通用户只能查看界面，AI对话功能需要升级VIP才能使用哦~`,
      timestamp: new Date(),
    };
    setMessages([welcomeMessage]);
    messagesRef.current = [welcomeMessage];
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

    setMessages(prev => {
      messagesRef.current = [...prev, userMessage];
      return messagesRef.current;
    });
    setInput('');
    setIsLoading(true);
    inputRef.current?.blur();

    // 检查是否配置了API Key
    const apiConfig = getAPIConfig();
    const hasApiKey = !!apiConfig.apiKey;

    if (hasApiKey && isVIP) {
      // 使用真实AI API
      try {
        const history = messagesRef.current.map(m => ({ role: m.role, content: m.content }));
        const aiContent = await callAI(userMessage.content, currentRole, history);

        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: aiContent,
          timestamp: new Date(),
        };

        setMessages(prev => {
          messagesRef.current = [...prev, aiMessage];
          return messagesRef.current;
        });
      } catch (error: unknown) {
        const errorMsg = error instanceof Error ? error.message : 'AI回复失败';
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `⚠️ ${errorMsg}\n\n请检查设置中的API配置。`,
          timestamp: new Date(),
        };
        setMessages(prev => {
          messagesRef.current = [...prev, errorMessage];
          return messagesRef.current;
        });
      }
      setIsLoading(false);
    } else {
      // 回退到本地预设回复
      setTimeout(() => {
        const history = messagesRef.current.map(m => ({ role: m.role, content: m.content }));
        const aiResponse = generateAIResponse(userMessage.content, currentRole, isVIP, history);

        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: aiResponse,
          timestamp: new Date(),
        };

        setMessages(prev => {
          messagesRef.current = [...prev, aiMessage];
          return messagesRef.current;
        });
        setIsLoading(false);
      }, 800 + Math.random() * 1200);
    }
  };

  const handleClear = () => {
    setMessages([]);
    messagesRef.current = [];
    const welcomeMessage: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: isVIP
        ? `对话已清空！当前模式：${roleConfigs[currentRole].name}\n${roleConfigs[currentRole].description}`
        : `对话已清空！升级VIP即可解锁AI对话功能~`,
      timestamp: new Date(),
    };
    setMessages([welcomeMessage]);
    messagesRef.current = [welcomeMessage];
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

  // 处理功能模块点击
  const handleFeatureClick = (feature: typeof featureModules[0]) => {
    if (feature.vipOnly && !isVIP) {
      showToast('此功能仅限VIP会员使用');
      return;
    }
    if (feature.mode) {
      switchRole(feature.mode);
      setActiveTab('chat');
    } else if (feature.devMsg) {
      showToast(feature.devMsg);
    }
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

  // 功能页面
  const FeaturesView = () => (
    <div className="flex-1 overflow-y-auto">
      <div className="flex items-center justify-center p-3 sm:p-4 border-b border-slate-700 bg-slate-800/50">
        <h1 className="text-base sm:text-lg font-semibold text-white">功能</h1>
      </div>
      <div className="p-4">
        <div className="grid grid-cols-2 gap-3">
          {featureModules.map((feature) => (
            <button
              key={feature.id}
              onClick={() => handleFeatureClick(feature)}
              className="bg-slate-800 border border-slate-600 rounded-2xl p-4 text-left hover:bg-slate-700 transition-colors"
            >
              <div className="text-3xl mb-2">{feature.emoji}</div>
              <h3 className="text-sm font-semibold text-white mb-1">{feature.name}</h3>
              <p className="text-xs text-gray-400">{feature.desc}</p>
              {feature.vipOnly && (
                <span className="inline-block mt-2 text-xs px-2 py-0.5 bg-yellow-500/20 text-yellow-400 border border-yellow-500/30 rounded-full">VIP</span>
              )}
            </button>
          ))}
        </div>
      </div>
    </div>
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
          <button onClick={() => setActiveTab('settings')} className="w-full flex items-center gap-4 px-4 py-4 hover:bg-slate-700 transition-colors">
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

  // 设置页面
  const SettingsView = () => (
    <div className="flex-1 overflow-y-auto">
      <div className="flex items-center justify-center p-3 sm:p-4 border-b border-slate-700 bg-slate-800/50">
        <h1 className="text-base sm:text-lg font-semibold text-white">设置</h1>
      </div>
      <div className="p-4 space-y-4">
        {/* 主题切换 */}
        <div className="bg-slate-800 rounded-2xl border border-slate-600 overflow-hidden">
          <div className="flex items-center gap-4 px-4 py-4">
            <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-indigo-400" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-white font-medium">主题模式</p>
              <p className="text-gray-400 text-sm">深色模式</p>
            </div>
            <span className="text-green-400 text-sm font-medium">深色模式 ✓</span>
          </div>
        </div>

        {/* 清除缓存 */}
        <div className="bg-slate-800 rounded-2xl border border-slate-600 overflow-hidden">
          <button
            onClick={() => {
              handleClear();
              showToast('缓存已清除');
            }}
            className="w-full flex items-center gap-4 px-4 py-4 hover:bg-slate-700 transition-colors"
          >
            <div className="w-10 h-10 rounded-full bg-red-500/20 flex items-center justify-center">
              <Trash2 className="w-5 h-5 text-red-400" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-white font-medium">清除缓存</p>
              <p className="text-gray-400 text-sm">清除聊天记录和缓存数据</p>
            </div>
          </button>
        </div>

        {/* 关于我们 */}
        <div className="bg-slate-800 rounded-2xl border border-slate-600 overflow-hidden">
          <div className="flex items-center gap-4 px-4 py-4">
            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
              <Bot className="w-5 h-5 text-blue-400" />
            </div>
            <div className="flex-1 text-left">
              <p className="text-white font-medium">关于我们</p>
              <p className="text-gray-400 text-sm">AI智能助手 v2.0.0</p>
            </div>
            <span className="text-gray-500 text-xs">v2.0.0</span>
          </div>
        </div>

        {/* VIP信息 */}
        <div className={`rounded-2xl border overflow-hidden ${isVIP ? 'bg-gradient-to-br from-yellow-500/10 to-orange-500/10 border-yellow-500/30' : 'bg-slate-800 border-slate-600'}`}>
          <div className="flex items-center gap-4 px-4 py-4">
            <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isVIP ? 'bg-yellow-500/20' : 'bg-gray-500/20'}`}>
              <Crown className={`w-5 h-5 ${isVIP ? 'text-yellow-400' : 'text-gray-400'}`} />
            </div>
            <div className="flex-1 text-left">
              <p className="text-white font-medium">VIP信息</p>
              <p className="text-gray-400 text-sm">{isVIP ? 'VIP会员 · 已激活' : '普通用户 · 未开通'}</p>
            </div>
            {isVIP ? (
              <span className="text-yellow-400 text-sm font-medium">已开通</span>
            ) : (
              <button onClick={() => router.push('/settings')} className="px-3 py-1 bg-gradient-to-r from-yellow-600 to-orange-600 text-white text-sm rounded-lg">
                升级
              </button>
            )}
          </div>
        </div>

        {/* 退出登录 */}
        <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 px-4 py-4 bg-red-500/10 text-red-400 rounded-2xl border border-red-500/30 hover:bg-red-500/20 transition-colors">
          <LogOut className="w-5 h-5" />
          <span>退出登录</span>
        </button>
      </div>
    </div>
  );

  // 渲染当前Tab内容
  const renderContent = () => {
    switch (activeTab) {
      case 'chat': return <ChatView />;
      case 'features': return <FeaturesView />;
      case 'profile': return <ProfileView />;
      case 'settings': return <SettingsView />;
    }
  };

  return (
    <div className="relative flex h-screen overflow-hidden">
      {/* 动态雨景雷电背景 */}
      <RainBackground />

      {/* 主内容层 */}
      <div className="relative z-10 flex w-full h-full">
      {/* 侧边栏 */}
      <div className={`fixed inset-y-0 left-0 z-50 w-[280px] sm:w-64 bg-slate-800/80 backdrop-blur-xl transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:relative lg:translate-x-0 shadow-2xl lg:shadow-none overflow-y-auto`}>
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
        {renderContent()}

        {/* Toast 提示 */}
        {toast && (
          <div className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 px-6 py-3 bg-slate-700 text-white text-sm rounded-xl shadow-lg border border-slate-600">
            {toast}
          </div>
        )}

        {/* 底部Tab栏 */}
        <div className="flex items-center justify-around p-2 border-t border-slate-700 bg-slate-800/80 backdrop-blur-xl safe-area-pb">
          <button
            onClick={() => setActiveTab('chat')}
            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors ${activeTab === 'chat' ? 'bg-blue-500/20 text-blue-400' : 'text-gray-400 hover:text-gray-300'}`}
          >
            <MessageCircle className="w-6 h-6" />
            <span className="text-xs">对话</span>
          </button>
          <button
            onClick={() => setActiveTab('features')}
            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors ${activeTab === 'features' ? 'bg-blue-500/20 text-blue-400' : 'text-gray-400 hover:text-gray-300'}`}
          >
            <Sparkles className="w-6 h-6" />
            <span className="text-xs">功能</span>
          </button>
          <button
            onClick={() => setActiveTab('profile')}
            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors ${activeTab === 'profile' ? 'bg-blue-500/20 text-blue-400' : 'text-gray-400 hover:text-gray-300'}`}
          >
            <UserCircle className="w-6 h-6" />
            <span className="text-xs">我的</span>
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex flex-col items-center gap-1 px-4 py-2 rounded-xl transition-colors ${activeTab === 'settings' ? 'bg-blue-500/20 text-blue-400' : 'text-gray-400 hover:text-gray-300'}`}
          >
            <Settings className="w-6 h-6" />
            <span className="text-xs">设置</span>
          </button>
        </div>
      </div>
      </div>
    </div>
  );
}
