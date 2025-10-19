# PayPal 沙盒设置指南

## 1. 创建PayPal开发者账户

1. 访问 [PayPal Developer](https://developer.paypal.com/)
2. 点击 "Sign Up" 创建账户
3. 验证邮箱后登录

## 2. 创建应用

1. 在Dashboard中点击 "Apps & Credentials"
2. 点击 "Create App"
3. 选择 "Merchant" 类型
4. 输入应用名称（如：RandomLife MVP）
5. 选择沙盒环境（Sandbox）

## 3. 获取API凭据

创建应用后，你会获得：
- **Client ID**: 用于前端
- **Secret**: 用于后端（保密）

## 4. 创建订阅计划

1. 在PayPal Developer Dashboard中，点击 "Products"
2. 创建 "Subscriptions" 产品
3. 为每个套餐创建计划：
   - Pro Plan: $9.99/month
   - Enterprise Plan: $49.99/month

## 5. 配置环境变量

在你的 `.env.local` 文件中添加：

```bash
# PayPal 沙盒配置
PAYPAL_CLIENT_ID=你的沙盒Client_ID
PAYPAL_CLIENT_SECRET=你的沙盒Secret
PAYPAL_SANDBOX=true

# 订阅计划ID（从PayPal控制台获取）
PAYPAL_PRO_PLAN_ID=P-你的Pro计划ID
PAYPAL_ENTERPRISE_PLAN_ID=P-你的Enterprise计划ID
```

## 6. 测试沙盒支付

1. 使用沙盒测试账户进行支付测试
2. 沙盒URL: https://www.sandbox.paypal.com
3. 测试卡号: 4111-1111-1111-1111

## 7. 生产环境部署

当准备上线时：

1. 将 `PAYPAL_SANDBOX` 设为 `false`
2. 使用生产环境的Client ID和Secret
3. 创建生产环境的订阅计划
4. 更新Vercel环境变量

## 注意事项

- 沙盒环境和生产环境是完全分离的
- 测试时使用沙盒账户，不要使用真实账户
- 确保Webhook URL正确配置（如果需要）
- 定期检查PayPal API变更

## 故障排除

如果遇到问题：
1. 检查环境变量是否正确设置
2. 确认计划ID是否有效
3. 查看服务器日志中的错误信息
4. 参考 [PayPal API文档](https://developer.paypal.com/api/subscriptions/v1/)