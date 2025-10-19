"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useSupabaseAuth } from "@/components/supabase-auth-provider";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { CheckCircle, Loader2 } from "lucide-react";

function PaymentSuccessContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useSupabaseAuth();
  const [verifying, setVerifying] = useState(true);
  const [verified, setVerified] = useState(false);

  useEffect(() => {
    const verifyPayment = async () => {
      const sessionId = searchParams.get("session_id");
      const orderId = searchParams.get("order_id");
      const paypalToken = searchParams.get("token");
      const payerId = searchParams.get("PayerID");

      if (sessionId || orderId) {
        // Stripe 或其他支付方式
        setTimeout(() => {
          setVerifying(false);
          setVerified(true);
        }, 2000);
      } else if (paypalToken && payerId) {
        // PayPal 支付验证
        try {
          const response = await fetch("/api/payment/paypal/capture", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ token: paypalToken, payerId }),
          });

          if (response.ok) {
            setVerifying(false);
            setVerified(true);
          } else {
            throw new Error("PayPal payment capture failed");
          }
        } catch (error) {
          console.error("PayPal verification error:", error);
          setVerifying(false);
          setVerified(false);
        }
      } else {
        setVerifying(false);
        setVerified(true);
      }
    };

    verifyPayment();
  }, [searchParams]);

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center">
              <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
              <h2 className="text-xl font-semibold mb-2">验证支付中...</h2>
              <p className="text-gray-600">请稍候，我们正在确认您的支付</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
          <CardTitle className="text-2xl text-green-600">支付成功！</CardTitle>
          <CardDescription>感谢您的购买，您的订阅已激活</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-green-50 p-4 rounded-lg">
            <p className="text-sm text-green-800">
              您现在可以享受所有高级功能。您的账户信息已更新。
            </p>
          </div>

          <div className="space-y-2">
            <Button
              onClick={() => router.push("/dashboard")}
              className="w-full"
            >
              返回控制台
            </Button>
            <Button
              onClick={() => router.push("/settings")}
              variant="outline"
              className="w-full"
            >
              查看订阅详情
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default function PaymentSuccess() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <Card className="w-full max-w-md">
            <CardContent className="pt-6">
              <div className="text-center">
                <Loader2 className="h-12 w-12 animate-spin mx-auto mb-4 text-blue-600" />
                <h2 className="text-xl font-semibold mb-2">加载中...</h2>
              </div>
            </CardContent>
          </Card>
        </div>
      }
    >
      <PaymentSuccessContent />
    </Suspense>
  );
}
