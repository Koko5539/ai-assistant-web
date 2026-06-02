'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Moon, Sun, Bell, Shield, Crown, LogOut, User, Key, Bot, ChevronDown, Check, Eye, EyeOff, Trash2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { getAPIConfig, saveAPIConfig, getAllProviders, getProviderConfig } from '@/lib/aiApi';
import type { AIProvider } from '@/lib/aiApi';

export default function SettingsPage() {
  const router = useRouter();
  const [isVIP, setIsVIP] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [userName, setUserName] = useState('');

  // API配置状态
  const [provider, setProvider] = useState<AIProvider>('moonshot');
  const [apiKey, setApiKey] = useState('');
  const [model, setModel] = useState('');
  const [customBaseUrl, setCustomBaseUrl] = useState('');
  const [customModel, setCustomModel] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [showProviderDropdown, setShowProviderDropdown] = useState(false);
  const [apiTestStatus, setApiTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [apiTestMsg, setApiTestMsg] = useState('');

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        router.push('/login');
        return;
      }
      setUserName(session.user.email?.split('@')[0] || '用户');
      setIsVIP(localStorage.getItem('isVIP') === 'true');
    };

    // 加载API配置
    const config = getAPIConfig();
    setProvider(config.provider);
    setApiKey(config.apiKey);
    setModel(config.model);
    setCustomBaseUrl(config.customBaseUrl);
    setCustomModel(config.customModel);

    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('isVIP');
    localStorage.removeItem('vipAccount');
    router.push('/login');
  };

  const handleSaveAPI = () => {
    saveAPIConfig({
      provider,
      apiKey,
      model,
      customBaseUrl,
      customModel,
    });
    setApiTestStatus('idle');
  };

  const handleTestAPI = async () => {
    if (!apiKey) {
      setApiTestStatus('error');
      setApiTestMsg('请先输入API Key');
      return;
    }

    setApiTestStatus('testing');
    setApiTestMsg('正在测试连接...');

    const providerConfig = getProviderConfig(provider);
    const baseUrl = provider === 'custom' ? customBaseUrl : providerConfig.baseUrl;
    const modelToUse = model || (provider === 'custom' ? customModel : providerConfig.defaultModel);

    try {
      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: modelToUse,
          messages: [{ role: 'user', content: '你好，测试连接' }],
          max_tokens: 20,
          stream: false,
        }),
      });

      if (response.ok) {
        setApiTestStatus('success');
        setApiTestMsg('✅ 连接成功！AI已就绪');
      } else {
        const data = await response.json().catch(() => ({}));
        setApiTestStatus('error');
        setApiTestMsg(`❌ 连接失败: ${data.error?.message || response.status}`);
      }
    } catch (error: unknown) {
      setApiTestStatus('error');
      setApiTestMsg(`❌ 网络错误: ${error instanceof Error ? error.message : '连接失败'}`);
    }
  };

  const handleClearAPI = () => {
    setApiKey('');
    setModel('');
    setCustomBaseUrl('');
    setCustomModel('');
    saveAPIConfig({ apiKey: '', model: '', customBaseUrl: '', customModel: '' });
    setApiTestStatus('idle');
    setApiTestMsg('');
  };

  const providers = getAllProviders();
  const currentProviderConfig = getProviderConfig(provider);

  return (
    <div className="min-h-screen bg-slate-900">
      {/* 顶部栏 */}
      <div className="flex items-center gap-4 p-4 border-b border-slate-700 bg-slate-800/50">
        <button
          onClick={() => router.push('/chat')}
          className="text-gray-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-xl font-bold text-white">设置</h1>
      </div>

      <div className="max-w-2xl mx-auto p-4 space-y-6">
        {/* API配置卡片 */}
        <div className="bg-slate-800 rounded-2xl overflow-hidden border border-slate-600">
          <div className="p-4 border-b border-slate-700 flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center">
              <Bot className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">AI接口配置</h3>
              <p className="text-gray-400 text-sm">配置API Key启用真实AI对话</p>
            </div>
            {apiKey && (
              <span className="ml-auto px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-full text-green-400 text-xs">已配置</span>
            )}
          </div>

          <div className="p-4 space-y-4">
            {/* AI平台选择 */}
            <div>
              <label className="text-gray-300 text-sm mb-2 block">AI平台</label>
              <div className="relative">
                <button
                  onClick={() => setShowProviderDropdown(!showProviderDropdown)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white"
                >
                  <span>{currentProviderConfig.name}</span>
                  <ChevronDown className={`w-5 h-5 text-gray-400 transition-transform ${showProviderDropdown ? 'rotate-180' : ''}`} />
                </button>
                {showProviderDropdown && (
                  <div className="absolute top-full left-0 right-0 mt-1 bg-slate-700 border border-slate-600 rounded-xl overflow-hidden z-20 shadow-xl">
                    {providers.map(p => (
                      <button
                        key={p.id}
                        onClick={() => {
                          setProvider(p.id);
                          setShowProviderDropdown(false);
                          setModel('');
                        }}
                        className={`w-full flex items-center justify-between px-4 py-3 hover:bg-slate-600 transition-colors ${provider === p.id ? 'text-blue-400' : 'text-white'}`}
                      >
                        <span>{p.name}</span>
                        {provider === p.id && <Check className="w-4 h-4" />}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* API Key输入 */}
            <div>
              <label className="text-gray-300 text-sm mb-2 block">API Key</label>
              <div className="relative">
                <Key className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type={showApiKey ? 'text' : 'password'}
                  value={apiKey}
                  onChange={(e) => setApiKey(e.target.value)}
                  placeholder="sk-xxxxxxxxxxxxxxxx"
                  className="w-full pl-11 pr-20 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 text-sm"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
                  <button
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="p-1.5 text-gray-400 hover:text-white"
                  >
                    {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                  {apiKey && (
                    <button onClick={handleClearAPI} className="p-1.5 text-red-400 hover:text-red-300">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* 模型选择（非自定义时） */}
            {provider !== 'custom' && currentProviderConfig.models.length > 0 && (
              <div>
                <label className="text-gray-300 text-sm mb-2 block">模型</label>
                <div className="flex flex-wrap gap-2">
                  {currentProviderConfig.models.map(m => (
                    <button
                      key={m}
                      onClick={() => setModel(m)}
                      className={`px-3 py-1.5 rounded-lg text-sm transition-colors ${
                        model === m
                          ? 'bg-blue-600 text-white'
                          : 'bg-slate-700 text-gray-300 border border-slate-600 hover:bg-slate-600'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* 自定义配置 */}
            {provider === 'custom' && (
              <>
                <div>
                  <label className="text-gray-300 text-sm mb-2 block">API地址</label>
                  <input
                    type="text"
                    value={customBaseUrl}
                    onChange={(e) => setCustomBaseUrl(e.target.value)}
                    placeholder="https://api.example.com/v1"
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 text-sm"
                  />
                </div>
                <div>
                  <label className="text-gray-300 text-sm mb-2 block">模型名称</label>
                  <input
                    type="text"
                    value={customModel}
                    onChange={(e) => setCustomModel(e.target.value)}
                    placeholder="gpt-3.5-turbo"
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 text-sm"
                  />
                </div>
              </>
            )}

            {/* 保存和测试按钮 */}
            <div className="flex gap-3">
              <button
                onClick={handleSaveAPI}
                className="flex-1 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white font-medium rounded-xl hover:from-blue-500 hover:to-purple-500 transition-all"
              >
                保存配置
              </button>
              <button
                onClick={handleTestAPI}
                disabled={apiTestStatus === 'testing'}
                className="flex-1 py-3 bg-slate-700 border border-slate-600 text-white font-medium rounded-xl hover:bg-slate-600 transition-all disabled:opacity-50"
              >
                {apiTestStatus === 'testing' ? '测试中...' : '测试连接'}
              </button>
            </div>

            {/* 测试结果 */}
            {apiTestMsg && (
              <div className={`p-3 rounded-xl text-sm ${
                apiTestStatus === 'success' ? 'bg-green-500/10 border border-green-500/30 text-green-400' :
                apiTestStatus === 'error' ? 'bg-red-500/10 border border-red-500/30 text-red-400' :
                'bg-blue-500/10 border border-blue-500/30 text-blue-400'
              }`}>
                {apiTestMsg}
              </div>
            )}

            {/* 提示信息 */}
            <div className="p-3 bg-slate-700/50 rounded-xl">
              <p className="text-gray-400 text-xs">
                💡 API Key保存在手机本地，不会上传到任何服务器。推荐使用Kimi（15元免费额度）或硅基流动（2000万免费Token）。
              </p>
            </div>
          </div>
        </div>

        {/* 用户信息卡片 */}
        <div className="bg-slate-800 rounded-2xl p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
              <User className="w-8 h-8 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white">{userName}</h2>
              <p className="text-gray-400">{isVIP ? 'VIP会员' : '普通用户'}</p>
            </div>
            {isVIP && (
              <div className="ml-auto flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-full">
                <Crown className="w-5 h-5 text-yellow-400" />
                <span className="text-yellow-400 font-medium">VIP</span>
              </div>
            )}
          </div>
        </div>

        {/* 外观设置 */}
        <div className="bg-slate-800 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-slate-700">
            <h3 className="text-lg font-semibold text-white">外观</h3>
          </div>
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {darkMode ? <Moon className="w-5 h-5 text-gray-400" /> : <Sun className="w-5 h-5 text-gray-400" />}
              <span className="text-white">深色模式</span>
            </div>
            <button
              onClick={() => setDarkMode(!darkMode)}
              className={`w-14 h-8 rounded-full transition-colors ${darkMode ? 'bg-blue-600' : 'bg-slate-600'}`}
            >
              <div className={`w-6 h-6 bg-white rounded-full transition-transform ${darkMode ? 'translate-x-7' : 'translate-x-1'} mt-1`} />
            </button>
          </div>
        </div>

        {/* VIP信息 */}
        {isVIP ? (
          <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-4">
              <Crown className="w-8 h-8 text-yellow-400" />
              <div>
                <h3 className="text-xl font-bold text-yellow-400">VIP会员</h3>
                <p className="text-gray-400">所有功能已解锁</p>
              </div>
            </div>
            <ul className="space-y-2 text-gray-300">
              <li className="flex items-center gap-2"><span className="w-2 h-2 bg-green-500 rounded-full" />无限对话次数</li>
              <li className="flex items-center gap-2"><span className="w-2 h-2 bg-green-500 rounded-full" />真实AI对话（需配置API）</li>
              <li className="flex items-center gap-2"><span className="w-2 h-2 bg-green-500 rounded-full" />7种角色模式</li>
            </ul>
          </div>
        ) : (
          <div className="bg-slate-800 rounded-2xl p-6">
            <h3 className="text-lg font-semibold text-white mb-2">升级到VIP</h3>
            <p className="text-gray-400 mb-4">解锁全部功能，享受更好的AI体验</p>
            <button
              onClick={() => router.push('/login')}
              className="w-full py-3 bg-gradient-to-r from-yellow-600 to-orange-600 text-white font-semibold rounded-xl"
            >
              使用VIP账号登录
            </button>
            <p className="text-gray-500 text-sm text-center mt-2">
              VIP账号：2117904938 / 12312300zx
            </p>
          </div>
        )}

        {/* 退出登录 */}
        <button
          onClick={handleLogout}
          className="w-full flex items-center justify-center gap-3 p-4 bg-red-600/20 border border-red-600/30 text-red-400 rounded-2xl hover:bg-red-600/30 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-medium">退出登录</span>
        </button>

        {/* 版本信息 */}
        <p className="text-center text-gray-500 text-sm">
          AI助手 v2.1.0 · 支持真实AI对话
        </p>
      </div>
    </div>
  );
}
