'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Moon, Sun, Bell, Shield, Crown, LogOut, User } from 'lucide-react';
import { supabase } from '@/lib/supabase';

export default function SettingsPage() {
  const router = useRouter();
  const [isVIP, setIsVIP] = useState(false);
  const [darkMode, setDarkMode] = useState(true);
  const [notifications, setNotifications] = useState(true);
  const [userName, setUserName] = useState('');

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
    
    checkAuth();
  }, [router]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    localStorage.removeItem('isVIP');
    localStorage.removeItem('vipAccount');
    router.push('/login');
  };

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

        {/* 通知设置 */}
        <div className="bg-slate-800 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-slate-700">
            <h3 className="text-lg font-semibold text-white">通知</h3>
          </div>
          
          <div className="p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Bell className="w-5 h-5 text-gray-400" />
              <span className="text-white">消息通知</span>
            </div>
            <button
              onClick={() => setNotifications(!notifications)}
              className={`w-14 h-8 rounded-full transition-colors ${notifications ? 'bg-blue-600' : 'bg-slate-600'}`}
            >
              <div className={`w-6 h-6 bg-white rounded-full transition-transform ${notifications ? 'translate-x-7' : 'translate-x-1'} mt-1`} />
            </button>
          </div>
        </div>

        {/* 账号安全 */}
        <div className="bg-slate-800 rounded-2xl overflow-hidden">
          <div className="p-4 border-b border-slate-700">
            <h3 className="text-lg font-semibold text-white">账号安全</h3>
          </div>
          
          <div className="p-4 flex items-center gap-3">
            <Shield className="w-5 h-5 text-gray-400" />
            <span className="text-white">修改密码</span>
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
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full" />
                无限对话次数
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full" />
                优先响应速度
              </li>
              <li className="flex items-center gap-2">
                <span className="w-2 h-2 bg-green-500 rounded-full" />
                高级AI模型
              </li>
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
          AI助手 v1.0.0
        </p>
      </div>
    </div>
  );
}
