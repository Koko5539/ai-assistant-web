// 纯前端本地认证 - 无需Supabase

const VIP_ACCOUNT = '2117904938';
const VIP_PASSWORD = '12312300zx';

export interface User {
  id: string;
  account: string;
  isVIP: boolean;
  nickname: string;
}

// 验证VIP账号
export function verifyVIPUser(account: string, password: string): boolean {
  return account === VIP_ACCOUNT && password === VIP_PASSWORD;
}

// 本地登录
export function localLogin(account: string, password: string, isVIP: boolean = false): User | null {
  if (isVIP && verifyVIPUser(account, password)) {
    const user: User = {
      id: 'vip-' + Date.now(),
      account: account,
      isVIP: true,
      nickname: 'VIP用户',
    };
    // 保存到本地存储
    localStorage.setItem('ai_user', JSON.stringify(user));
    localStorage.setItem('isLoggedIn', 'true');
    return user;
  }
  
  // 普通用户（任意账号密码）
  if (account && password && password.length >= 6) {
    const user: User = {
      id: 'user-' + Date.now(),
      account: account,
      isVIP: false,
      nickname: account.slice(0, 4) + '...',
    };
    localStorage.setItem('ai_user', JSON.stringify(user));
    localStorage.setItem('isLoggedIn', 'true');
    return user;
  }
  
  return null;
}

// 检查登录状态
export function checkAuth(): User | null {
  if (typeof window === 'undefined') return null;
  
  const isLoggedIn = localStorage.getItem('isLoggedIn');
  if (!isLoggedIn) return null;
  
  const userStr = localStorage.getItem('ai_user');
  if (!userStr) return null;
  
  try {
    return JSON.parse(userStr) as User;
  } catch {
    return null;
  }
}

// 退出登录
export function localLogout(): void {
  localStorage.removeItem('ai_user');
  localStorage.removeItem('isLoggedIn');
}

// 获取当前用户
export function getCurrentUser(): User | null {
  return checkAuth();
}
