"use client";

import { useState } from "react";
import { useSupabaseAuth } from "@/components/supabase-auth-provider";
import { useGeo } from "@/components/geo-provider";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Smartphone, DollarSign } from "lucide-react";

interface PaymentOptionsProps {
  tier: "pro" | "enterprise";
  onSuccess?: (paymentMethod: string, subscriptionId?: string) => void;
}

export default function PaymentOptions({
  tier,
  onSuccess,
}: PaymentOptionsProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const { user } = useSupabaseAuth();
  const { location } = useGeo();

  const handlePayment = async (paymentMethod: string) => {
    if (!user) {
      setError("请先登录");
      return;
    }

    setLoading(paymentMethod);
    setError(null);

    try {
      // 获取Supabase session token
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error("认证失败，请重新登录");
      }

      const response = await fetch(
        `/api/payment/${paymentMethod}/create-checkout`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({ tier }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "支付创建失败");
      }

      if (data.url) {
        // Stripe和Alipay的情况
        window.location.href = data.url;
      } else if (data.approvalUrl) {
        // PayPal的情况
        window.location.href = data.approvalUrl;
      } else {
        // 处理成功回调
        onSuccess?.(
          paymentMethod,
          data.subscriptionId || data.orderId || data.sessionId
        );
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "支付失败");
    } finally {
      setLoading(null);
    }
  };

  const isChina = location?.region === "china";
  const isOverseas =
    location?.region === "usa" ||
    location?.region === "singapore" ||
    location?.region === "india" ||
    location?.region === "other";

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="h-5 w-5" />
          选择支付方式
        </CardTitle>
        <CardDescription>
          {tier === "pro" ? "专业版" : "企业版"} 订阅
          <Badge variant="secondary" className="ml-2">
            {isChina ? "中国地区" : "海外地区"}
          </Badge>
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* BETA VERSION WARNING */}
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-orange-600" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
            </div>
            <div>
              <h4 className="text-sm font-medium text-orange-800">
                🚫 Payment Disabled - BETA Version
              </h4>
              <p className="text-sm text-orange-700 mt-1">
                Payment features are currently disabled for testing purposes.
                This is a demonstration version only.
              </p>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        {/* 中国支付选项 */}
        {isChina && (
          <div className="space-y-3">
            <Button
              disabled={true}
              className="w-full justify-start opacity-50 cursor-not-allowed"
              variant="outline"
            >
              <Smartphone className="h-4 w-4 mr-2" />
              支付宝支付
              <Badge variant="secondary" className="ml-2">
                BETA - 禁用
              </Badge>
            </Button>

            <Button
              disabled={true}
              className="w-full justify-start opacity-50 cursor-not-allowed"
              variant="outline"
            >
              <Smartphone className="h-4 w-4 mr-2" />
              微信支付
              <Badge variant="secondary" className="ml-2">
                BETA - 禁用
              </Badge>
            </Button>
          </div>
        )}

        {/* 海外支付选项 */}
        {isOverseas && (
          <div className="space-y-3">
            <Button
              disabled={true}
              className="w-full justify-start opacity-50 cursor-not-allowed"
              variant="outline"
            >
              <CreditCard className="h-4 w-4 mr-2" />
              信用卡支付 (Stripe)
              <Badge variant="secondary" className="ml-2">
                BETA - 禁用
              </Badge>
            </Button>

            <Button
              disabled={true}
              className="w-full justify-start opacity-50 cursor-not-allowed"
              variant="outline"
            >
              <DollarSign className="h-4 w-4 mr-2" />
              PayPal支付
              <Badge variant="secondary" className="ml-2">
                BETA - 禁用
              </Badge>
            </Button>
          </div>
        )}

        {/* 默认显示所有选项（如果地理信息未加载） */}
        {!location && (
          <div className="space-y-3">
            <p className="text-sm text-gray-600">正在检测您的地区...</p>
            <Button disabled className="w-full opacity-50 cursor-not-allowed">
              加载中... (BETA - 禁用)
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
