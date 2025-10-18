"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { XCircle, ArrowLeft } from "lucide-react";

export default function PaymentCancel() {
  const router = useRouter();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <XCircle className="h-16 w-16 text-orange-600 mx-auto mb-4" />
          <CardTitle className="text-2xl text-orange-600">支付已取消</CardTitle>
          <CardDescription>您的支付已被取消，没有任何费用产生</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-orange-50 p-4 rounded-lg">
            <p className="text-sm text-orange-800">
              如果您遇到任何问题或改变主意，可以随时重新开始支付流程。
            </p>
          </div>

          <div className="space-y-2">
            <Button onClick={() => router.push("/upgrade")} className="w-full">
              <ArrowLeft className="h-4 w-4 mr-2" />
              返回升级页面
            </Button>
            <Button
              onClick={() => router.push("/dashboard")}
              variant="outline"
              className="w-full"
            >
              返回控制台
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
