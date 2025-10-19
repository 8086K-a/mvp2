import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";
import { getGeoInfoFromRequest } from "@/lib/geo-utils";
import { PAYPAL_PLANS, paypalClient, isPayPalConfigured, getPayPalEnvironment } from "@/lib/paypal";
import paypal from '@paypal/checkout-server-sdk';

export async function POST(request: NextRequest) {
  try {
    // 获取地理信息和Supabase客户端
    const geoInfo = await getGeoInfoFromRequest(request);
    const supabase = getSupabaseClient(geoInfo.regionCategory);

    // 获取用户session
    const authHeader = request.headers.get("authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.substring(7);
    const {
      data: { user },
      error: authError,
    } = await supabase.auth.getUser(token);

    if (authError || !user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { tier } = await request.json();

    if (tier !== "pro" && tier !== "enterprise") {
      return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
    }

    // Check if PayPal is configured
    if (!isPayPalConfigured()) {
      console.log('PayPal not configured, using demo mode')
      return NextResponse.json({
        subscriptionId: `PAYPAL-DEMO-${tier.toUpperCase()}-${Date.now()}`,
        approvalUrl: `/settings?demo_paypal_checkout=${tier}`,
        message: "Demo mode - PayPal subscription simulated",
        environment: 'demo'
      });
    }

    // Create actual PayPal subscription
    const requestBody = new paypal.billingagreements.BillingAgreement();
    requestBody.requestBody({
      plan_id: PAYPAL_PLANS[tier as keyof typeof PAYPAL_PLANS].planId,
      subscriber: {
        email_address: user.email,
      },
      application_context: {
        return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/settings?paypal_success=true&tier=${tier}`,
        cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/settings?paypal_canceled=true`,
        user_action: 'SUBSCRIBE_NOW',
        brand_name: 'RandomLife',
        locale: 'en-US',
      },
    });

    try {
      const response = await paypalClient.execute(requestBody);
      const subscriptionId = response.result.id;
      const approvalUrl = response.result.links.find(
        (link: any) => link.rel === 'approval_url'
      )?.href;

      if (!approvalUrl) {
        throw new Error('No approval URL returned from PayPal');
      }

      console.log(`PayPal ${getPayPalEnvironment()} subscription created:`, subscriptionId);

      return NextResponse.json({
        subscriptionId,
        approvalUrl,
        environment: getPayPalEnvironment()
      });
    } catch (paypalError: any) {
      console.error('PayPal API error:', paypalError);

      // If PayPal API fails, fall back to demo mode
      return NextResponse.json({
        subscriptionId: `PAYPAL-DEMO-${tier.toUpperCase()}-${Date.now()}`,
        approvalUrl: `/settings?demo_paypal_checkout=${tier}`,
        message: "PayPal API error, using demo mode",
        environment: 'demo',
        error: paypalError.message
      });
    }
  } catch (error) {
    console.error("PayPal subscription error:", error);
    return NextResponse.json(
      { error: "Failed to create PayPal subscription" },
      { status: 500 }
    );
  }
}
