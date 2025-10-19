import paypal from '@paypal/checkout-server-sdk'

const PLACEHOLDER_KEYWORDS = ['your_', 'demo', 'placeholder', '你的', '沙盒']

const hasRealValue = (value?: string | null) => {
  if (!value) {
    return false
  }
  const trimmed = value.trim()
  if (!trimmed) {
    return false
  }
  const lower = trimmed.toLowerCase()
  return !PLACEHOLDER_KEYWORDS.some((keyword) => lower.includes(keyword))
}

const hasValidPayPalCredentials = () =>
  hasRealValue(process.env.PAYPAL_CLIENT_ID) &&
  hasRealValue(process.env.PAYPAL_CLIENT_SECRET)

// PayPal environment setup
function environment() {
  const configured = hasValidPayPalCredentials()
  const clientId = configured
    ? process.env.PAYPAL_CLIENT_ID!.trim()
    : 'demo_client_id'
  const clientSecret = configured
    ? process.env.PAYPAL_CLIENT_SECRET!.trim()
    : 'demo_client_secret'

  // 当凭证尚未配置时强制使用沙盒模式
  const isSandbox =
    process.env.PAYPAL_SANDBOX === 'true' ||
    process.env.NODE_ENV !== 'production' ||
    !configured

  if (!configured) {
    console.warn('PayPal credentials missing or placeholders detected, using demo sandbox environment')
  }

  if (isSandbox) {
    console.log('Using PayPal Sandbox environment')
    return new paypal.core.SandboxEnvironment(clientId, clientSecret)
  }

  console.log('Using PayPal Production environment')
  return new paypal.core.LiveEnvironment(clientId, clientSecret)
}

export const paypalClient = new paypal.core.PayPalHttpClient(environment())

export const PAYPAL_PLANS = {
  pro: {
    planId: process.env.PAYPAL_PRO_PLAN_ID || 'P-demo-pro-plan',
    amount: '9.99',
    currency: 'USD',
  },
  enterprise: {
    planId: process.env.PAYPAL_ENTERPRISE_PLAN_ID || 'P-demo-enterprise-plan',
    amount: '49.99',
    currency: 'USD',
  },
}

// Helper function to check if PayPal is properly configured
export function isPayPalConfigured(): boolean {
  return hasValidPayPalCredentials()
}

// Helper function to get PayPal environment type
export function getPayPalEnvironment(): 'sandbox' | 'production' {
  const isSandbox =
    process.env.PAYPAL_SANDBOX === 'true' ||
    process.env.NODE_ENV !== 'production' ||
    !hasValidPayPalCredentials()
  return isSandbox ? 'sandbox' : 'production'
}
