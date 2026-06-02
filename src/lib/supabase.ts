import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// VIP用户验证
export async function verifyVIPUser(account: string, password: string): Promise<boolean> {
  // 预设的VIP账号
  const VIP_ACCOUNT = '2117904938';
  const VIP_PASSWORD = '12312300zx';
  
  return account === VIP_ACCOUNT && password === VIP_PASSWORD;
}

// 检查用户是否为VIP
export async function checkIsVIP(userId: string): Promise<boolean> {
  try {
    const { data, error } = await supabase
      .from('vip_users')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (error || !data) return false;
    return data.is_vip === true;
  } catch {
    return false;
  }
}

// 将用户标记为VIP
export async function markUserAsVIP(userId: string, account: string): Promise<void> {
  try {
    await supabase
      .from('vip_users')
      .upsert({
        user_id: userId,
        account: account,
        is_vip: true,
        created_at: new Date().toISOString(),
      });
  } catch {
    // 静默处理错误
  }
}
