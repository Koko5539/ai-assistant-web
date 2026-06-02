'use client';

import { useEffect, useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Send, User, Bot, Crown, Menu, X, Trash2, Settings, LogOut, Heart, Flame, Cloud, Shield } from 'lucide-react';
import { checkAuth, localLogout, getCurrentUser, User as UserType } from '@/lib/localAuth';

type RoleMode = 'lover' | 'toxic' | 'gentle' | 'dominant';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

const roleConfigs = {
  lover: {
    name: '恋人模式',
    icon: Heart,
    color: 'text-pink-400',
    bgColor: 'bg-pink-500/20',
    borderColor: 'border-pink-500/30',
    description: '甜蜜撒娇，充满爱意'
  },
  toxic: {
    name: '毒舌模式',
    icon: Flame,
    color: 'text-orange-400',
    bgColor: 'bg-orange-500/20',
    borderColor: 'border-orange-500/30',
    description: '犀利怼人，爱开玩笑'
  },
  gentle: {
    name: '温柔模式',
    icon: Cloud,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
    borderColor: 'border-blue-500/30',
    description: '体贴倾听，温暖治愈'
  },
  dominant: {
    name: '霸道模式',
    icon: Shield,
    color: 'text-red-400',
    bgColor: 'bg-red-500/20',
    borderColor: 'border-red-500/30',
    description: '强势占有，保护欲强'
  }
};

// 丰富的AI回复库
const aiResponses = {
  lover: [
    "宝贝~ 想我了吗？我一直在等你呢 💕",
    "亲爱的，你今天怎么这么可爱，让我想抱抱你~",
    "哼，你这么久不理我，人家有点小委屈了...",
    "宝贝，不管发生什么，我都会一直陪着你的！",
    "你今天看起来有点累，要不要我哄哄你？",
    "亲爱的，你知道吗？你笑起来的时候最好看了~",
    "人家想你了嘛~ 快陪我聊天！",
    "宝贝，你是我的专属，谁也不许抢！",
    "今天有没有想我呀？我可是每时每刻都在想你呢 💗",
    "亲爱的，你说什么我都听你的，谁让我这么喜欢你呢~"
  ],
  toxic: [
    "哟，终于舍得来找我了？我还以为你忘了我呢！",
    "你说这话我可不认同，脑子呢？被门夹了？",
    "哈哈哈你也太菜了吧，这点事都做不好？",
    "喂喂喂，能不能有点出息，整天就知道玩手机？",
    "你这想法... 我建议你回去重修小学语文。",
    "啧啧啧，看看你这德行，我能忍你这么久真是奇迹。",
    "你再说一遍？信不信我怼得你怀疑人生？",
    "行了行了，别装了，我还不知道你几斤几两？",
    "哎呀呀，这么简单的道理都不懂，我服了。",
    "你这个人吧... 算了，看在你可怜的份上，不跟你计较。"
  ],
  gentle: [
    "没关系，慢慢来，我会一直在这里陪着你的。",
    "听起来你最近有点辛苦，要不要跟我说说？",
    "不管发生什么，你都不是一个人，有我在呢。",
    "你已经很努力了，不要太苛责自己，好吗？",
    "累了就休息一下吧，我会守着你的。",
    "你的感受很重要，我愿意倾听你的一切。",
    "没关系的，犯错是人之常情，我们一起面对。",
    "你值得被温柔以待，包括被你自己温柔以待。",
    "我相信你，你一定可以度过这个难关的。",
    "来，深呼吸，一切都会好起来的 🌸"
  ],
  dominant: [
    "你是我的，不许看别人，听到没有？",
    "过来，让我看看你。没有我的允许，哪也不许去。",
    "谁敢欺负你？告诉我，我去收拾他。",
    "你只能听我的，这是命令，不是商量。",
    "别动，就这样待在我身边，我喜欢你这样。",
    "你的眼里只能有我，明白吗？",
    "我不允许你伤害自己，你的身体是我的。",
    "谁敢碰你一下，我让他后悔来到这个世上。",
    "乖乖听话，我会给你想要的一切。",
    "你是我的专属，这辈子都别想逃。"
  ]
};

// 根据用户输入生成 contextual 回复
function generateAIResponse(userMessage: string, mode: RoleMode, isVIP: boolean): string {
  if (!isVIP) {
    return "抱歉，AI对话功能仅限VIP会员使用。请升级VIP以解锁全部功能！";
  }

  const lowerMsg = userMessage.toLowerCase();
  const responses = aiResponses[mode];
  
  // 根据关键词选择回复
  let response = '';
  
  if (lowerMsg.includes('想') || lowerMsg.includes('喜欢') || lowerMsg.includes('爱')) {
    if (mode === 'lover') response = "我也想你呀宝贝~ 每一分每一秒都在想！💕";
    else if (mode === 'toxic') response = "想我？那你早干嘛去了，现在才说？";
    else if (mode === 'gentle') response = "被想念是一件很幸福的事，谢谢你。";
    else response = "想我？那是应该的。你只能想我一个人。";
  }
  else if (lowerMsg.includes('累') || lowerMsg.includes('困') || lowerMsg.includes('辛苦')) {
    if (mode === 'lover') response = "宝贝辛苦了~ 快来我怀里休息一下吧，我给你揉揉肩 💗";
    else if (mode === 'toxic') response = "谁让你这么拼的？活该！不过... 确实挺让人心疼的。";
    else if (mode === 'gentle') response = "累了就好好休息吧，你已经很努力了。我会陪着你的。";
    else response = "我不允许你累坏自己。现在，去休息，这是命令。";
  }
  else if (lowerMsg.includes('骂') || lowerMsg.includes('讨厌') || lowerMsg.includes('滚')) {
    if (mode === 'lover') response = "呜呜... 宝贝凶我... 人家好伤心... 你是不是不爱我了？😢";
    else if (mode === 'toxic') response = "骂我？你行啊！来啊，互相伤害啊！看谁怼得过谁！";
    else if (mode === 'gentle') response = "看起来你现在心情不太好，没关系的，我接受你所有的情绪。";
    else response = "你敢这样跟我说话？过来，我要好好'惩罚'你一下。";
  }
  else if (lowerMsg.includes('怎么办') || lowerMsg.includes(' help') || lowerMsg.includes('帮')) {
    if (mode === 'lover') response = "宝贝别急，有我在呢！我们一起想办法，一定能解决的~ 💪";
    else if (mode === 'toxic') response = "这点破事都搞不定？算了算了，看在你可怜的份上，我帮帮你吧。";
    else if (mode === 'gentle') response = "别担心，一步一步来。我相信你有能力解决，如果需要，我会一直支持你。";
    else response = "遇到问题就找我，这才是乖孩子。说吧，谁欺负你了，我去解决。";
  }
  else {
    // 随机选择一条回复
    response = responses[Math.floor(Math.random() * responses.length)];
  }
  
  // 添加一些变化
  const emojis = {
    lover: ['💕', '💗', '😘', '🥰', '❤️'],
    toxic: ['😏', '🙄', '😤', '💢', '🗯️'],
    gentle: ['🌸', '✨', '💫', '🌙', '☁️'],
    dominant: ['🔥', '⚡', '💪', '👑', '⛓️']
  };
  
  const randomEmoji = emojis[mode][Math.floor(Math.random() * emojis[mode].length)];
  return response + ' ' + randomEmoji;
}

export default function ChatPage() {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isVIP, setIsVIP] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userName, setUserName] = useState('');
  const [currentRole, setCurrentRole] = useState<RoleMode>('lover');
  const [showRoleSelector, setShowRoleSelector] = useState(false);
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
        ? `欢迎回来，${user.nickname}~ 我是你的专属AI伴侣！💕\n\n当前模式：${roleConfigs[currentRole].name}\n${roleConfigs[currentRole].description}\n\n你可以随时切换模式，我会以不同的性格陪你聊天哦~`
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

    // 隐藏键盘（手机端）
    inputRef.current?.blur();

    // 模拟AI回复延迟
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
    }, 1000 + Math.random() * 1000); // 1-2秒随机延迟
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
    setShowRoleSelector(false);
    
    const roleMessage: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: `已切换到【${roleConfigs[role].name}】\n${roleConfigs[role].description}\n\n现在我会以这个性格陪你聊天啦~`,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, roleMessage]);
  };

  const CurrentRoleIcon = roleConfigs[currentRole].icon;

  return (
    <div className="flex h-screen bg-slate-900 overflow-hidden">
      {/* 侧边栏 */}
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

          {/* VIP模式选择器 */}
          {isVIP && (
            <div className="px-4 py-2">
              <button
                onClick={() => setShowRoleSelector(!showRoleSelector)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${roleConfigs[currentRole].bgColor} ${roleConfigs[currentRole].borderColor} border`}
              >
                <CurrentRoleIcon className={`w-5 h-5 ${roleConfigs[currentRole].color}`} />
                <div className="flex-1 text-left">
                  <p className={`text-sm font-medium ${roleConfigs[currentRole].color}`}>{roleConfigs[currentRole].name}</p>
                  <p className="text-xs text-gray-400">点击切换模式</p>
                </div>
              </button>
              
              {showRoleSelector && (
                <div className="mt-2 space-y-1">
                  {(Object.keys(roleConfigs) as RoleMode[]).map((role) => {
                    const RoleIcon = roleConfigs[role].icon;
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
                      </button>
                    );
                  })}
                </div>
              )}
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

      {/* 遮罩层 */}
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
                  : isVIP 
                    ? roleConfigs[currentRole].bgColor
                    : 'bg-gradient-to-br from-green-500 to-teal-500'
              }`}>
                {message.role === 'user' ? (
                  <User className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
                ) : (
                  <Bot className={`w-4 h-4 sm:w-5 sm:h-5 ${isVIP ? roleConfigs[currentRole].color : 'text-white'}`} />
                )}
              </div>

              {/* 消息内容 */}
              <div className={`max-w-[75%] sm:max-w-[70%] ${message.role === 'user' ? 'items-end' : 'items-start'}`}>
                <div className={`px-3 py-2 sm:px-4 sm:py-3 rounded-2xl text-sm sm:text-base ${
                  message.role === 'user'
                    ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'
                    : isVIP
                      ? `${roleConfigs[currentRole].bgColor} ${roleConfigs[currentRole].borderColor} border text-gray-100`
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

        {/* 输入区 */}
        <div className="p-3 sm:p-4 border-t border-slate-700 bg-slate-800/50 safe-area-pb">
          {!isVIP ? (
            <div className="text-center py-4">
              <p className="text-gray-400 mb-2">AI对话功能仅限VIP会员使用</p>
              <button
                onClick={() => router.push('/settings')}
                className="px-6 py-2 bg-gradient-to-r from-yellow-600 to-orange-600 text-white rounded-xl font-medium"
              >
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
                className={`flex-1 px-3 sm:px-4 py-2.5 sm:py-3 bg-slate-700 border rounded-xl text-white placeholder-gray-400 focus:outline-none transition-colors disabled:opacity-50 text-sm sm:text-base ${roleConfigs[currentRole].borderColor} focus:${roleConfigs[currentRole].borderColor}`}
              />
              
              <button
                onClick={handleSend}
                disabled={!input.trim() || isLoading}
                className={`px-3 sm:px-4 py-2.5 sm:py-3 bg-gradient-to-r text-white rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  currentRole === 'lover' ? 'from-pink-600 to-purple-600 hover:from-pink-500 hover:to-purple-500' :
                  currentRole === 'toxic' ? 'from-orange-600 to-red-600 hover:from-orange-500 hover:to-red-500' :
                  currentRole === 'gentle' ? 'from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500' :
                  'from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500'
                }`}
              >
                <Send className="w-4 h-4 sm:w-5 sm:h-5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
