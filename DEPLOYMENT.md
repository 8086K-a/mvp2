# 部署指南

## 1. Supabase 设置

### 创建 Supabase 项目

1. 访问 [supabase.com](https://supabase.com)
2. 创建新项目
3. 获取以下信息：
   - Project URL
   - Project API Key (anon public)

### 配置环境变量

在 `.env` 文件中更新：

```bash
NEXT_PUBLIC_SUPABASE_URL=https://your-project-id.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_real_anon_key
DATABASE_URL=postgresql://postgres:password@db.your-project-id.supabase.co:5432/postgres
```

## 2. Vercel 部署

### 连接到 Vercel

```bash
# 安装 Vercel CLI
npm i -g vercel

# 登录 Vercel
vercel login

# 部署项目
vercel
```

### 配置 Vercel 环境变量

在 Vercel 控制台中设置以下环境变量：

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `DATABASE_URL`
- `STRIPE_SECRET_KEY`
- `PAYPAL_CLIENT_ID`
- `PAYPAL_CLIENT_SECRET`
- `ALIPAY_APP_ID`
- `ALIPAY_PRIVATE_KEY`
- `ALIPAY_PUBLIC_KEY`

## 3. 数据库迁移

### 运行 Prisma 迁移

```bash
# 生成 Prisma 客户端
npx prisma generate

# 运行数据库迁移
npx prisma migrate deploy

# 种子数据（可选）
npm run seed
```

## 4. 域名配置

### 更新域名设置

1. 在 Vercel 中设置自定义域名
2. 更新 `.env` 中的 `NEXT_PUBLIC_SITE_URL`
3. 在 Supabase 中配置 OAuth 重定向 URL

## 5. 测试部署

部署完成后，测试以下功能：

- ✅ 用户注册（邮箱验证码）
- ✅ 用户登录
- ✅ 支付功能（Stripe/PayPal/Alipay）
- ✅ 地理位置路由
- ✅ 数据库连接
