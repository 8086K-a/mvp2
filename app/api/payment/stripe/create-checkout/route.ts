import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getGeoInfoFromRequest } from "@/lib/geo-utils";
import { stripe, STRIPE_PLANS } from "@/lib/stripe";

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

    // Create actual Stripe Checkout Session
    const checkoutSession = await stripe.checkout.sessions.create({
      customer_email: user.email,
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: tier === "pro" ? "RandomLife Pro" : "RandomLife Enterprise",
              description:
                tier === "pro"
                  ? "Professional subscription"
                  : "Enterprise subscription",
            },
            unit_amount: tier === "pro" ? 999 : 4999, // $9.99 or $49.99
          },
          quantity: 1,
        },
      ],
      mode: "payment", // One-time payment for demo, use 'subscription' for recurring
      success_url: `${process.env.NEXT_PUBLIC_SITE_URL}/payment/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/payment/cancel`,
      metadata: {
        userId: user.id,
        tier: tier,
        paymentMethod: "stripe",
      },
    });

    return NextResponse.json({
      url: checkoutSession.url,
      sessionId: checkoutSession.id,
    }); // Mock response for demo
    return NextResponse.json({
      url: `/settings?demo_stripe_checkout=${tier}`,
      message: "Demo mode - Stripe checkout simulated",
    });
  } catch (error) {
    console.error("Stripe checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create checkout session" },
      { status: 500 }
    );
  }
}
