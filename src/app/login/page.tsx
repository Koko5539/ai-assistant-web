'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, User, Lock } from 'lucide-react';
import RainBackground from '@/components/RainBackground';
import { localLogin } from '@/lib/localAuth';

export default function LoginPage() {
  const router = useRouter();
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isVIPMode, setIsVIPMode] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const user = localLogin(account, password, isVIPMode);
      
      if (user) {
        router.push('/chat');
      } else {
        setError(isVIPMode ? 'VIP账号或密码错误' : '账号或密码错误（密码至少6位）');
      }
    } catch (err) {
      setError('登录失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const handleVIPLogin = () => {
    setIsVIPMode(true);
    setAccount('2117904938');
    setPassword('12312300zx');
    setError('');
  };

  return (
    <div className="relative min-h-screen flex items-center justify-center px-4 sm:px-6">
      <RainBackground />

      <div className="relative z-10 w-full max-w-sm sm:max-w-md">
        <div className="backdrop-blur-xl bg-black/40 rounded-2xl sm:rounded-3xl p-6 sm:p-8 border border-white/10 shadow-2xl">
          {/* Logo */}
          <div className="text-center mb-6 sm:mb-8">
            <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2">AI助手</h1>
            <p className="text-gray-400 text-sm sm:text-base">智能对话，无限可能</p>
          </div>

          {/* VIP标识 */}
          {isVIPMode && (
            <div className="mb-4 p-3 bg-gradient-to-r from-yellow-500/20 to-orange-500/20 border border-yellow-500/30 rounded-xl">
              <p className="text-yellow-400 text-center text-sm font-medium">
                VIP会员模式 - 解锁全部功能
              </p>
            </div>
          )}

          {/* 错误提示 */}
          {error && (
            <div className="mb-4 p-3 bg-red-500/20 border border-red-500/30 rounded-xl">
              <p className="text-red-400 text-center text-sm">{error}</p>
            </div>
          )}

          {/* 登录表单 */}
          <form onSubmit={handleLogin} className="space-y-4 sm:space-y-5">
            {/* 账号输入 */}
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type="text"
                inputMode="numeric"
                value={account}
                onChange={(e) => setAccount(e.target.value)}
                placeholder="请输入账号/手机号"
                className="w-full pl-12 pr-4 py-3.5 sm:py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all text-base"
                required
              />
            </div>

            {/* 密码输入 */}
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码"
                className="w-full pl-12 pr-12 py-3.5 sm:py-4 bg-white/5 border border-white/10 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50 focus:bg-white/10 transition-all text-base"
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors p-2"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>

            {/* 登录按钮 */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3.5 sm:py-4 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-500 hover:to-purple-500 text-white font-semibold rounded-xl transition-all transform active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-600/25 text-base"
            >
              {loading ? '登录中...' : '登录'}
            </button>
          </form>

          {/* 底部链接 */}
          <div className="mt-5 sm:mt-6 flex justify-between text-sm">
            <button
              onClick={() => router.push('/register')}
              className="text-gray-400 hover:text-white transition-colors"
            >
              手机号注册
            </button>
            <button
              onClick={() => router.push('/reset-password')}
              className="text-gray-400 hover:text-white transition-colors"
            >
              找回密码
            </button>
          </div>

          {/* VIP快速登录 */}
          <div className="mt-5 sm:mt-6 pt-5 sm:pt-6 border-t border-white/10">
            <button
              onClick={handleVIPLogin}
              className="w-full py-3 bg-gradient-to-r from-yellow-600/20 to-orange-600/20 border border-yellow-500/30 hover:border-yellow-500/50 text-yellow-400 font-medium rounded-xl transition-all text-sm sm:text-base"
            >
              VIP会员快速登录
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
