import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { subscriptionTier, subscriptionId, paymentMethod } = await request.json();

    if (!subscriptionTier) {
      return NextResponse.json({ error: "Missing subscriptionTier" }, { status: 400 });
    }

    // Update user subscription status
    const updatedUser = await prisma.user.update({
      where: { email: session.user.email },
      data: {
        subscriptionTier,
        ...(subscriptionId && { subscriptionId }),
        ...(paymentMethod && { paymentMethod }),
      },
    });

    return NextResponse.json({
      success: true,
      subscriptionTier: updatedUser.subscriptionTier,
      subscriptionId: updatedUser.subscriptionId,
      paymentMethod: updatedUser.paymentMethod,
    });
  } catch (error: any) {
    console.error("Subscription update error:", error);
    return NextResponse.json(
      { error: `Failed to update subscription: ${error.message}` },
      { status: 500 }
    );
  }
}