import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getGeoInfoFromRequest } from "@/lib/geo-utils";
import { PAYPAL_PLANS } from "@/lib/paypal";

export async function POST(request: NextRequest) {
  try {
    // 获取地理信息和Supabase客户端
    const geoInfo = await getGeoInfoFromRequest(request);
    const supabase = createClient(
      geoInfo.regionCategory === "china"
        ? process.env.CLOUDBASE_SUPABASE_URL!
        : process.env.NEXT_PUBLIC_SUPABASE_URL!,
      geoInfo.regionCategory === "china"
        ? process.env.CLOUDBASE_SUPABASE_ANON_KEY!
        : process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );

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

    // For demo purposes, return mock subscription ID
    // In production, create actual PayPal subscription
    /*
    const request = new paypal.billingagreements.BillingAgreement()
    request.requestBody({
      plan_id: PAYPAL_PLANS[tier].planId,
      subscriber: {
        email_address: user.email,
      },
      application_context: {
        return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/settings?success=true`,
        cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/settings?canceled=true`,
      },
    })
    const response = await paypalClient.execute(request)
    */

    // Mock response for demo
    return NextResponse.json({
      subscriptionId: `PAYPAL-DEMO-${tier.toUpperCase()}-${Date.now()}`,
      approvalUrl: `/settings?demo_paypal_checkout=${tier}`,
      message: "Demo mode - PayPal subscription simulated",
    });
  } catch (error) {
    console.error("PayPal subscription error:", error);
    return NextResponse.json(
      { error: "Failed to create PayPal subscription" },
      { status: 500 }
    );
  }
}
