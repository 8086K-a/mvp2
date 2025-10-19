import paypal from "@paypal/checkout-server-sdk";

// PayPal environment setup
function environment() {
  const clientId = process.env.PAYPAL_CLIENT_ID!;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET!;

  const isSandbox = process.env.PAYPAL_SANDBOX === "true";

  if (isSandbox) {
    console.log("Using PayPal Sandbox environment");
    return new paypal.core.SandboxEnvironment(clientId, clientSecret);
  }

  console.log("Using PayPal Production environment");
  return new paypal.core.LiveEnvironment(clientId, clientSecret);
}

export const paypalClient = new paypal.core.PayPalHttpClient(environment());

// Helper function to get PayPal environment type
export function getPayPalEnvironment(): "sandbox" | "production" {
  return process.env.PAYPAL_SANDBOX === "true" ? "sandbox" : "production";
}
