# AI助手 Web App

基于 Next.js + React + TypeScript + Tailwind CSS 开发的 AI 助手 Web 应用，支持 PWA（渐进式 Web 应用）安装。

## 功能特性

- 登录页 4K 动态背景（Canvas 雨景 + 闪电效果）
- Supabase 认证系统（支持手机号/邮箱登录）
- AI 对话功能（VIP 解锁全部功能）
- 响应式设计，支持移动端和桌面端
- PWA 支持，可添加到主屏幕

## VIP 账号

- 账号：`2117904938`
- 密码：`12312300zx`

使用 VIP 账号登录可解锁全部功能。

## 技术栈

- **框架**: Next.js 14 (App Router)
- **语言**: TypeScript
- **样式**: Tailwind CSS
- **UI 组件**: Lucide React Icons
- **认证**: Supabase Auth
- **数据库**: Supabase PostgreSQL

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

复制 `.env.local.example` 为 `.env.local`，并填写你的 Supabase 配置：

```bash
cp .env.local.example .env.local
```

编辑 `.env.local`：

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### 3. Supabase 设置

1. 访问 [Supabase](https://supabase.com) 创建新项目
2. 在 Authentication 中启用 Email 和 Phone 登录
3. 在 SQL Editor 中执行以下 SQL 创建 VIP 用户表：

```sql
create table vip_users (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  account text not null,
  is_vip boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 启用 RLS
alter table vip_users enable row level security;

-- 创建策略
create policy "Users can view own vip status"
  on vip_users for select
  using (auth.uid() = user_id);

create policy "Users can update own vip status"
  on vip_users for update
  using (auth.uid() = user_id);

create policy "Users can insert own vip status"
  on vip_users for insert
  with check (auth.uid() = user_id);
```

### 4. 运行开发服务器

```bash
npm run dev
```

访问 http://localhost:3000

### 5. 构建生产版本

```bash
npm run build
```

## PWA 安装

### Android (Chrome)
1. 使用 Chrome 浏览器访问部署后的网站
2. 点击底部弹出的 "添加到主屏幕" 提示
3. 或在菜单中选择 "安装应用"

### iOS (Safari)
1. 使用 Safari 浏览器访问部署后的网站
2. 点击分享按钮
3. 选择 "添加到主屏幕"

### 桌面端 (Chrome/Edge)
1. 访问部署后的网站
2. 地址栏右侧会出现安装图标
3. 点击 "安装 AI助手"

## 部署到 Vercel

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/yourusername/ai-assistant-web)

1. 将代码推送到 GitHub
2. 在 Vercel 中导入项目
3. 配置环境变量（Supabase URL 和 Anon Key）
4. 部署

## 项目结构

```
ai-assistant-web/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── chat/
│   │   │       └── route.ts      # AI 对话 API
│   │   ├── chat/
│   │   │   └── page.tsx          # 对话页面
│   │   ├── login/
│   │   │   └── page.tsx          # 登录页面
│   │   ├── layout.tsx            # 根布局
│   │   ├── page.tsx              # 首页（重定向到登录）
│   │   └── globals.css           # 全局样式
│   ├── components/
│   │   └── RainBackground.tsx    # 雨景背景组件
│   └── lib/
│       └── supabase.ts           # Supabase 客户端
├── public/
│   └── manifest.json             # PWA 配置
├── .env.local.example            # 环境变量示例
├── next.config.js                # Next.js 配置
└── package.json
```

## 自定义配置

### 修改 VIP 账号

编辑 `src/lib/supabase.ts`：

```typescript
const VIP_ACCOUNT = '你的账号';
const VIP_PASSWORD = '你的密码';
```

### 接入真实 AI API

编辑 `src/app/api/chat/route.ts`，替换模拟响应为真实 API 调用：

```typescript
const response = await fetch('https://your-ai-api.com/v1/chat', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${process.env.AI_API_KEY}`,
  },
  body: JSON.stringify({
    model: isVIP ? 'gpt-4' : 'gpt-3.5-turbo',
    messages,
  }),
});
```

## 许可证

MIT
