import paypal from '@paypal/checkout-server-sdk'

// PayPal environment setup
function environment() {
  const clientId = process.env.PAYPAL_CLIENT_ID || 'demo_client_id'
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET || 'demo_client_secret'

  // Check if we're in sandbox mode (default for development)
  const isSandbox = process.env.PAYPAL_SANDBOX === 'true' ||
                   process.env.NODE_ENV !== 'production' ||
                   !process.env.PAYPAL_CLIENT_ID

  if (isSandbox) {
    console.log('Using PayPal Sandbox environment')
    return new paypal.core.SandboxEnvironment(clientId, clientSecret)
  } else {
    console.log('Using PayPal Production environment')
    return new paypal.core.LiveEnvironment(clientId, clientSecret)
  }
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
  return !!(process.env.PAYPAL_CLIENT_ID && process.env.PAYPAL_CLIENT_SECRET)
}

// Helper function to get PayPal environment type
export function getPayPalEnvironment(): 'sandbox' | 'production' {
  const isSandbox = process.env.PAYPAL_SANDBOX === 'true' ||
                   process.env.NODE_ENV !== 'production' ||
                   !process.env.PAYPAL_CLIENT_ID
  return isSandbox ? 'sandbox' : 'production'
}
