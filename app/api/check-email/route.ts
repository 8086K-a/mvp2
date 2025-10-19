import { getSupabaseClient } from "@/lib/supabase";
import { getGeoInfoFromRequest } from "@/lib/geo-utils";
import { z } from "zod";

const CheckEmailSchema = z.object({
  email: z.string().email(),
});

// 禁用预渲染
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = CheckEmailSchema.parse(body);

    // 检查环境变量是否正确配置
    if (
      !process.env.NEXT_PUBLIC_SUPABASE_URL ||
      process.env.NEXT_PUBLIC_SUPABASE_URL.includes("your_") ||
      !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY.includes("your_")
    ) {
      // 环境变量未配置，返回默认响应
      return new Response(
        JSON.stringify({
          exists: false,
          message: "Email check disabled - environment not configured",
        }),
        { status: 200 }
      );
    }

    // 获取地理信息
    const geoInfo = await getGeoInfoFromRequest(request);
    const supabase = getSupabaseClient(geoInfo.regionCategory);

    // 使用 resetPasswordForEmail 来检测用户是否存在
    // 如果用户不存在，Supabase 会返回错误
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: "http://localhost:3000", // 不会实际使用
    });

    if (error) {
      // 如果是 "User not found" 或类似错误，说明用户不存在
      if (
        error.message.includes("User not found") ||
        error.message.includes("user_not_found") ||
        error.message.includes("Email not confirmed") === false
      ) {
        return new Response(JSON.stringify({ exists: false }), { status: 200 });
      }
      // 其他错误可能是用户存在但有问题，我们假设存在
      return new Response(JSON.stringify({ exists: true }), { status: 200 });
    } else {
      // 没有错误，说明用户存在
      return new Response(JSON.stringify({ exists: true }), { status: 200 });
    }
  } catch (err: any) {
    const message = err?.message ?? "Invalid request";
    return new Response(JSON.stringify({ error: message }), { status: 400 });
  }
}
