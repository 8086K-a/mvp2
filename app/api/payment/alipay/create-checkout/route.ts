import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { getGeoInfoFromRequest } from "@/lib/geo-utils";
import { alipaySdk } from "@/lib/alipay";

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

    // Create actual Alipay payment order
    const result = await alipaySdk.exec("alipay.trade.page.pay", {
      bizContent: {
        out_trade_no: `ALIPAY-${tier.toUpperCase()}-${Date.now()}`,
        product_code: "FAST_INSTANT_TRADE_PAY",
        total_amount: tier === "pro" ? "9.99" : "49.99",
        subject:
          tier === "pro" ? "RandomLife专业版订阅" : "RandomLife企业版订阅",
        body:
          tier === "pro"
            ? "RandomLife专业版订阅服务"
            : "RandomLife企业版订阅服务",
      },
      return_url: `${process.env.NEXT_PUBLIC_SITE_URL}/payment/success`,
      notify_url: `${process.env.NEXT_PUBLIC_SITE_URL}/api/payment/alipay/notify`,
    });

    return NextResponse.json({
      url: result,
      orderId: `ALIPAY-${tier.toUpperCase()}-${Date.now()}`,
    });
  } catch (error) {
    console.error("Alipay checkout error:", error);
    return NextResponse.json(
      { error: "Failed to create Alipay payment" },
      { status: 500 }
    );
  }
}
