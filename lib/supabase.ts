import { createClient } from "@supabase/supabase-js";

// 海外Supabase配置
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

// 中国CloudBase配置
const cloudbaseUrl = process.env.CLOUDBASE_SUPABASE_URL;
const cloudbaseAnonKey = process.env.CLOUDBASE_SUPABASE_ANON_KEY;

// 验证环境变量
if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    "Missing required Supabase environment variables for overseas"
  );
}

// 创建客户端实例
export const supabaseOverseas = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// 中国客户端（如果配置了CloudBase）
export const supabaseChina =
  cloudbaseUrl && cloudbaseAnonKey
    ? createClient(cloudbaseUrl, cloudbaseAnonKey, {
        auth: {
          autoRefreshToken: true,
          persistSession: true,
          detectSessionInUrl: true,
        },
      })
    : supabaseOverseas; // 回退到海外客户端

// 默认导出海外客户端
export const supabase = supabaseOverseas;

/**
 * 根据区域获取Supabase客户端
 * @param regionCategory 区域分类：'china' 或 'overseas'
 * @returns Supabase客户端实例
 */
export function getSupabaseClient(
  regionCategory: "china" | "overseas" = "overseas"
) {
  return regionCategory === "china" ? supabaseChina : supabaseOverseas;
}
