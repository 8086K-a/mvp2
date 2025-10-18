"use client";

import { useState } from "react";
import { useSupabaseAuth } from "@/components/supabase-auth-provider";
import { useGeo } from "@/components/geo-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface LoginFormProps {
  defaultIsSignUp?: boolean;
}

export default function LoginForm({ defaultIsSignUp = false }: LoginFormProps) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isSignUp, setIsSignUp] = useState(defaultIsSignUp);
  const [awaitingVerification, setAwaitingVerification] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { signIn, signUp, signInWithGoogle, verifyOtp } = useSupabaseAuth();
  const { location } = useGeo();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (awaitingVerification) {
        // 验证邮箱验证码
        const { error } = await verifyOtp(email, verificationCode, "signup");
        if (error) {
          setError(error.message);
        } else {
          setError("邮箱验证成功！您现在可以登录了。");
          setAwaitingVerification(false);
          setVerificationCode("");
          setIsSignUp(false);
        }
      } else if (isSignUp) {
        // 发送注册邮件
        const { error } = await signUp(email, password);
        if (error) {
          setError(error.message);
        } else {
          setError("注册邮件已发送！请检查邮箱并输入验证码。");
          setAwaitingVerification(true);
        }
      } else {
        // 登录
        const { error } = await signIn(email, password);
        if (error) {
          setError(error.message);
        }
      }
    } catch (err) {
      setError("操作失败，请重试");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    const { error } = await signInWithGoogle();
    if (error) {
      setError(error.message);
    }
  };

  // 根据地理位置显示不同的登录选项
  const showGoogleLogin =
    location?.region === "usa" ||
    location?.region === "singapore" ||
    location?.region === "india" ||
    location?.region === "other";
  const showWeChatLogin = location?.region === "china";

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader>
        <CardTitle>
          {awaitingVerification
            ? "验证邮箱"
            : isSignUp
            ? "注册账户"
            : "登录账户"}
        </CardTitle>
        <CardDescription>
          {awaitingVerification
            ? "请输入发送到邮箱的6位验证码"
            : location?.region === "china"
            ? "中国地区用户"
            : "海外地区用户"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label htmlFor="email">邮箱</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={awaitingVerification}
            />
          </div>

          {!awaitingVerification && (
            <div>
              <Label htmlFor="password">密码</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          )}

          {awaitingVerification && (
            <div>
              <Label htmlFor="verificationCode">邮箱验证码</Label>
              <Input
                id="verificationCode"
                type="text"
                value={verificationCode}
                onChange={(e) => setVerificationCode(e.target.value)}
                placeholder="请输入6位验证码"
                required
                maxLength={6}
              />
              <p className="text-sm text-gray-600 mt-1">
                验证码已发送到 {email}
              </p>
            </div>
          )}

          {error && (
            <Alert>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button type="submit" className="w-full" disabled={loading}>
            {loading
              ? "处理中..."
              : awaitingVerification
              ? "验证邮箱"
              : isSignUp
              ? "发送注册邮件"
              : "登录"}
          </Button>
        </form>

        <div className="mt-4 space-y-2">
          {showGoogleLogin && (
            <Button
              onClick={handleGoogleSignIn}
              variant="outline"
              className="w-full"
            >
              使用 Google 登录
            </Button>
          )}

          {showWeChatLogin && (
            <Button variant="outline" className="w-full" disabled>
              微信登录 (即将上线)
            </Button>
          )}
        </div>

        <div className="mt-4 text-center">
          {!awaitingVerification && (
            <button
              type="button"
              onClick={() => {
                setIsSignUp(!isSignUp);
                setError(null);
                setVerificationCode("");
              }}
              className="text-sm text-blue-600 hover:underline"
            >
              {isSignUp ? "已有账户？点击登录" : "没有账户？点击注册"}
            </button>
          )}
          {awaitingVerification && (
            <button
              type="button"
              onClick={() => {
                setAwaitingVerification(false);
                setVerificationCode("");
                setError(null);
              }}
              className="text-sm text-blue-600 hover:underline"
            >
              重新发送验证码
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
