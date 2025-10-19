import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { stripe } from "@/lib/stripe";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { sessionId, tier } = await request.json();

    if (!sessionId) {
      return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
    }

    if (!tier || (tier !== "pro" && tier !== "enterprise")) {
      return NextResponse.json({ error: "Invalid tier" }, { status: 400 });
    }

    // Retrieve the checkout session from Stripe
    const checkoutSession = await stripe.checkout.sessions.retrieve(sessionId);

    if (checkoutSession.payment_status === "paid") {
      // Update user subscription status in database
      await prisma.user.update({
        where: { email: session.user.email },
        data: {
          subscriptionTier: tier,
          subscriptionId: checkoutSession.subscription as string,
          paymentMethod: "stripe",
        },
      });

      return NextResponse.json({
        success: true,
        subscriptionId: checkoutSession.subscription,
        paymentStatus: checkoutSession.payment_status,
        subscriptionTier: tier,
      });
    } else {
      return NextResponse.json(
        { error: "Payment not completed", paymentStatus: checkoutSession.payment_status },
        { status: 400 }
      );
    }
  } catch (error: any) {
    console.error("Stripe subscription update error:", error);
    return NextResponse.json(
      { error: `Failed to update subscription: ${error.message}` },
      { status: 500 }
    );
  }
}