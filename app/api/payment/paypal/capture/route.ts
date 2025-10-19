import { NextRequest, NextResponse } from "next/server";
import { paypalClient } from "@/lib/paypal";
import paypal from "@paypal/checkout-server-sdk";

export async function POST(request: NextRequest) {
  try {
    const { token, payerId } = await request.json();

    if (!token) {
      return NextResponse.json({ error: "Missing token" }, { status: 400 });
    }

    // For PayPal Orders API, the token is the order ID
    // We need to capture the order to complete the payment
    const captureRequest = new (paypal as any).orders.OrdersCaptureRequest(
      token
    );
    captureRequest.requestBody({});

    const response = await paypalClient.execute(captureRequest);
    const order = response.result;

    // Check if capture was successful
    if (order.status === "COMPLETED") {
      return NextResponse.json({
        success: true,
        orderId: order.id,
        status: order.status,
      });
    } else {
      return NextResponse.json(
        { error: "Payment not completed", status: order.status },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error("PayPal capture error:", error);
    return NextResponse.json(
      { error: `PayPal capture failed: ${error.message}` },
      { status: 500 }
    );
  }
}
