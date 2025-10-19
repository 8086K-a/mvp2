import { createClient } from "@supabase/supabase-js";

// 海外Supabase配置
const supabaseUrl =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  (process.env.NODE_ENV === "development"
    ? "https://placeholder.supabase.co"
    : undefined);
const supabaseAnonKey =
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
  (process.env.NODE_ENV === "development" ? "placeholder-key" : undefined);

// 中国CloudBase配置
const cloudbaseUrl = process.env.CLOUDBASE_SUPABASE_URL || supabaseUrl;
const cloudbaseAnonKey =
  process.env.CLOUDBASE_SUPABASE_ANON_KEY || supabaseAnonKey;

// 验证环境变量
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "Missing Supabase environment variables, using placeholder client"
  );
}

// 创建客户端实例 - 在构建时使用占位符避免错误
const createSupabaseClient = (url: string, key: string) => {
  try {
    return createClient(url, key, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true,
      },
    });
  } catch (error) {
    console.warn("Failed to create Supabase client:", error);
    // 返回一个不会抛出错误的占位符客户端
    return createClient("https://placeholder.supabase.co", "placeholder-key", {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
        detectSessionInUrl: false,
      },
    });
  }
};

export const supabaseOverseas = createSupabaseClient(
  supabaseUrl || "https://placeholder.supabase.co",
  supabaseAnonKey || "placeholder-key"
);

// 中国客户端（如果配置了CloudBase）
export const supabaseChina =
  cloudbaseUrl &&
  cloudbaseAnonKey &&
  !cloudbaseUrl.includes("your_") &&
  !cloudbaseAnonKey.includes("your_")
    ? createSupabaseClient(cloudbaseUrl, cloudbaseAnonKey)
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
