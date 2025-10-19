"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
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
  const [confirmPassword, setConfirmPassword] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [isSignUp, setIsSignUp] = useState(defaultIsSignUp);
  const [awaitingVerification, setAwaitingVerification] = useState(false);
  const [forgotPassword, setForgotPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const { signIn, signUp, signInWithGoogle, verifyOtp, resetPassword } =
    useSupabaseAuth();
  const { location } = useGeo();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      if (forgotPassword) {
        // 找回密码
        const { error } = await resetPassword(email);
        if (error) {
          setError(error.message);
        } else {
          setError("密码重置邮件已发送！请检查邮箱。");
          setForgotPassword(false);
        }
      } else if (awaitingVerification) {
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
        // 检查密码匹配
        if (password !== confirmPassword) {
          setError("密码不匹配，请重新输入。");
          setLoading(false);
          return;
        }

        // 检查密码强度
        if (password.length < 6) {
          setError("密码至少需要6个字符。");
          setLoading(false);
          return;
        }

        // 先检查邮箱是否已存在
        try {
          const checkResponse = await fetch('/api/check-email', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ email }),
          });
          const checkData = await checkResponse.json();
          if (checkData.exists) {
            setError("该邮箱已被注册，请直接登录或使用其他邮箱注册。");
            setLoading(false);
            return;
          }
        } catch (err) {
          setError("检查邮箱失败，请重试。");
          setLoading(false);
          return;
        }

        // 邮箱不存在，尝试注册
        const { error } = await signUp(email, password);
        if (error) {
          setError(error.message);
        } else {
          setError("注册邮件已发送！请检查邮箱并输入验证码。");
          setAwaitingVerification(true);
        }
      } else {
        // 登录
        console.log("Attempting login with:", email);
        const { error } = await signIn(email, password);
        if (error) {
          console.error("Login error:", error);
          setError(error.message);
        } else {
          console.log("Login successful, redirecting to home");
          router.push("/");
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
      // 只处理配置相关的错误，其他OAuth错误通常不会发生
      if (
        error.message.includes("Invalid login credentials") ||
        error.message.includes("OAuth")
      ) {
        setError("谷歌登录配置错误，请稍后重试或使用邮箱注册。");
      } else {
        setError(`登录失败：${error.message}`);
      }
    }
    // 成功时会自动跳转，由auth state change处理
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
          {forgotPassword
            ? "找回密码"
            : awaitingVerification
            ? "验证邮箱"
            : isSignUp
            ? "注册账户"
            : "登录账户"}
        </CardTitle>
        <CardDescription>
          {forgotPassword
            ? "请输入您的邮箱地址，我们将发送密码重置邮件"
            : awaitingVerification
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

          {!awaitingVerification && !forgotPassword && (
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

          {!awaitingVerification && isSignUp && !forgotPassword && (
            <div>
              <Label htmlFor="confirmPassword">确认密码</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
              : forgotPassword
              ? "发送重置邮件"
              : awaitingVerification
              ? "验证邮箱"
              : isSignUp
              ? "发送注册邮件"
              : "登录"}
          </Button>
        </form>

        <div className="mt-4 space-y-2">
          {showGoogleLogin && (
            <div>
              <Button
                onClick={handleGoogleSignIn}
                variant="outline"
                className="w-full"
              >
                使用 Google 登录
              </Button>
              <p className="text-xs text-gray-500 mt-1 text-center">
                首次使用谷歌登录将自动创建账户，无需验证
              </p>
            </div>
          )}

          {showWeChatLogin && (
            <Button variant="outline" className="w-full" disabled>
              微信登录 (即将上线)
            </Button>
          )}
        </div>

        <div className="mt-4 text-center">
          {!awaitingVerification && !forgotPassword && (
            <>
              <button
                type="button"
                onClick={() => {
                  setIsSignUp(!isSignUp);
                  setError(null);
                  setVerificationCode("");
                  setConfirmPassword("");
                }}
                className="text-sm text-blue-600 hover:underline mr-4"
              >
                {isSignUp ? "已有账户？点击登录" : "没有账户？点击注册"}
              </button>
              {!isSignUp && (
                <button
                  type="button"
                  onClick={() => {
                    setForgotPassword(true);
                    setError(null);
                    setPassword("");
                    setConfirmPassword("");
                  }}
                  className="text-sm text-blue-600 hover:underline"
                >
                  忘记密码？
                </button>
              )}
            </>
          )}
          {forgotPassword && (
            <button
              type="button"
              onClick={() => {
                setForgotPassword(false);
                setError(null);
              }}
              className="text-sm text-blue-600 hover:underline"
            >
              返回登录
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
