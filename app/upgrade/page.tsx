"use client";

import { useState } from "react";
import { useSupabaseAuth } from "@/components/supabase-auth-provider";
import { useGeo } from "@/components/geo-provider";
import PaymentOptions from "@/components/payment-options";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Check, Star, Zap } from "lucide-react";

const plans = {
  pro: {
    name: "专业版",
    price: "$9.99",
    cnyPrice: "¥69",
    period: "每月",
    features: ["无限AI推荐", "高级筛选器", "优先支持", "无广告体验"],
  },
  enterprise: {
    name: "企业版",
    price: "$49.99",
    cnyPrice: "¥349",
    period: "每月",
    features: [
      "所有专业版功能",
      "团队协作",
      "API访问",
      "专属客服",
      "自定义集成",
    ],
  },
};

export default function UpgradePage() {
  const [selectedPlan, setSelectedPlan] = useState<"pro" | "enterprise" | null>(
    null
  );
  const { user } = useSupabaseAuth();
  const { geoInfo } = useGeo();

  const handlePaymentSuccess = (method: string, id?: string) => {
    console.log("Payment successful:", method, id);
    // 这里可以添加支付成功后的逻辑
    // 例如更新用户订阅状态
    alert(`支付成功！支付方式: ${method}`);
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">请先登录</h1>
          <Button onClick={() => (window.location.href = "/login")}>
            前往登录
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            升级您的体验
          </h1>
          <p className="text-xl text-gray-600">
            选择适合您的订阅计划
            {geoInfo && (
              <Badge variant="secondary" className="ml-2">
                {geoInfo.regionCategory === "china" ? "中国地区" : "海外地区"}
              </Badge>
            )}
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 mb-12">
          {Object.entries(plans).map(([key, plan]) => (
            <Card
              key={key}
              className={`cursor-pointer transition-all ${
                selectedPlan === key ? "ring-2 ring-blue-500" : ""
              }`}
              onClick={() => setSelectedPlan(key as "pro" | "enterprise")}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    {key === "enterprise" && (
                      <Star className="h-5 w-5 text-yellow-500" />
                    )}
                    {plan.name}
                  </CardTitle>
                  {key === "enterprise" && (
                    <Badge variant="default">最受欢迎</Badge>
                  )}
                </div>
                <div className="text-3xl font-bold">
                  {geoInfo?.regionCategory === "china"
                    ? plan.cnyPrice
                    : plan.price}
                  <span className="text-lg font-normal text-gray-600">
                    /{plan.period}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-600" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>

        {selectedPlan && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5" />
                完成支付
              </CardTitle>
              <CardDescription>
                您选择了 {plans[selectedPlan].name} 计划
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PaymentOptions
                tier={selectedPlan}
                onSuccess={handlePaymentSuccess}
              />
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
