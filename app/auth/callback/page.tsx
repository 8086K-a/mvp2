"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      // 处理URL中的OAuth回调参数
      const { data, error } = await supabase.auth.getSession();

      if (error) {
        console.error("Auth callback error:", error);
        router.push("/login?error=auth_callback_error");
        return;
      }

      if (data.session) {
        // 清除URL中的tokens
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname
        );
        router.push("/"); // 重定向到主页
      } else {
        router.push("/login");
      }
    };

    handleAuthCallback();
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-4 text-gray-600">正在处理登录...</p>
      </div>
    </div>
  );
}
