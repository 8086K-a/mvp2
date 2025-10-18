import { AlipaySdk } from "alipay-sdk";

// 支付宝SDK配置
export const alipaySdk = new AlipaySdk({
  appId: process.env.ALIPAY_APP_ID || "demo_app_id",
  privateKey: process.env.ALIPAY_PRIVATE_KEY || "demo_private_key",
  alipayPublicKey: process.env.ALIPAY_PUBLIC_KEY || "demo_public_key",
  gateway:
    process.env.ALIPAY_GATEWAY ||
    "https://openapi-sandbox.dl.alipaydev.com/gateway.do",
  signType: "RSA2",
  camelcase: true,
});

export const ALIPAY_PLANS = {
  pro: {
    amount: "9.99",
    currency: "CNY",
    subject: "RandomLife专业版订阅",
    body: "RandomLife专业版订阅服务",
  },
  enterprise: {
    amount: "49.99",
    currency: "CNY",
    subject: "RandomLife企业版订阅",
    body: "RandomLife企业版订阅服务",
  },
};
