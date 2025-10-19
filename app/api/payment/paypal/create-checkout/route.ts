import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getGeoInfoFromRequest } from "@/lib/geo-utils";
import paypal from "@paypal/checkout-server-sdk";
import { paypalClient } from "@/lib/paypal";

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

    // Create actual PayPal order
    const paypalRequest = new paypal.orders.OrdersCreateRequest();
    paypalRequest.requestBody({
      intent: "CAPTURE",
      purchase_units: [
        {
          amount: {
            currency_code: "USD",
            value: tier === "pro" ? "9.99" : "49.99",
          },
          description:
            tier === "pro"
              ? "RandomLife Pro Subscription"
              : "RandomLife Enterprise Subscription",
        },
      ],
      application_context: {
        return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/payment/success`,
        cancel_url: `${process.env.NEXT_PUBLIC_SITE_URL}/payment/cancel`,
      },
    });

    const response = await paypalClient.execute(paypalRequest);
    const order = response.result;

    return NextResponse.json({
      approvalUrl: order.links?.find((link: any) => link.rel === "approve")
        ?.href,
      orderId: order.id,
    });
  } catch (error) {
    console.error("PayPal checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create PayPal order" },
      { status: 500 }
    );
  }
}
