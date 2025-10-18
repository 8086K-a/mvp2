import { NextRequest, NextResponse } from "next/server";

/**
 * Next.js中间件：基于IP地理位置路由到不同系统
 * 中国用户重定向到腾讯云部署，海外用户使用当前Vercel部署
 */

// 简单的内存缓存，避免每次请求都调用外部API
const geoCache = new Map<string, { country: string; timestamp: number }>();
const CACHE_DURATION = 60 * 60 * 1000; // 1小时缓存

/**
 * Next.js中间件：基于IP地理位置路由到不同系统
 * 中国用户重定向到腾讯云部署，海外用户使用当前Vercel部署
 * 注意：如果未配置腾讯云，则中国用户也使用当前部署（不重定向）
 */
export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Skip geo routing for auth callbacks and other critical routes that must stay on Vercel
  const bypassPaths = [
    "/auth/callback",
    "/auth/reset-password",
    "/auth/verify",
    "/login",
    "/register",
  ];
  if (bypassPaths.some((path) => pathname.startsWith(path))) {
    return NextResponse.next();
  }

  // 获取真实IP
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const ip = forwarded ? forwarded.split(",")[0].trim() : realIp || "127.0.0.1";

  // 本地开发跳过重定向
  if (ip === "127.0.0.1" || ip === "::1") {
    return NextResponse.next();
  }

  // 检查是否配置了腾讯云域名
  const tencentDomain = process.env.TENCENT_CLOUD_DOMAIN;
  if (!tencentDomain) {
    // 未配置腾讯云，使用统一部署（中国和海外都使用当前Vercel）
    console.log("腾讯云未配置，中国用户将使用当前Vercel部署");
    return NextResponse.next();
  }

  try {
    // 优先使用Vercel内置地理位置（如果可用）
    const vercelGeo = request.geo;
    if (vercelGeo?.country) {
      if (vercelGeo.country === "CN") {
        const tencentUrl = new URL(request.url);
        tencentUrl.host = tencentDomain;
        return NextResponse.redirect(tencentUrl);
      }
      return NextResponse.next();
    }

    // 检查缓存
    const cached = geoCache.get(ip);
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      if (cached.country === "CN") {
        const tencentUrl = new URL(request.url);
        tencentUrl.host = tencentDomain;
        return NextResponse.redirect(tencentUrl);
      }
      return NextResponse.next();
    }

    // 缓存失效，调用外部API
    const countryCode = await getCountryFromIP(ip);

    // 缓存结果
    geoCache.set(ip, { country: countryCode, timestamp: Date.now() });

    if (countryCode === "CN") {
      const tencentUrl = new URL(request.url);
      tencentUrl.host = tencentDomain;
      return NextResponse.redirect(tencentUrl);
    }

    return NextResponse.next();
  } catch (error) {
    // 错误时默认使用当前部署
    console.error("地理路由错误:", error);
    return NextResponse.next();
  }
}

/**
 * 从IP获取国家代码（带重试和超时）
 */
async function getCountryFromIP(ip: string): Promise<string> {
  const maxRetries = 2;
  let lastError: Error | null = null;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 3000); // 3秒超时

      const response = await fetch(`https://ipapi.co/${ip}/json/`, {
        signal: controller.signal,
        headers: {
          "User-Agent": "MornHub/1.0",
          Accept: "application/json",
        },
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data.error) {
        throw new Error(data.reason || "API Error");
      }

      return data.country_code || "US";
    } catch (error) {
      lastError = error as Error;
      console.warn(`IP检测失败 (尝试 ${attempt}/${maxRetries}):`, error);

      if (attempt < maxRetries) {
        // 等待后重试
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }
  }

  // 所有重试都失败，返回默认值
  console.error("IP检测最终失败，使用默认值:", lastError);
  return "US";
}

// 配置中间件匹配路径
export const config = {
  matcher: [
    /*
     * 匹配所有请求路径，除了：
     * - API路由 (/api/*)
     * - 静态文件 (/_next/static/*)
     * - 图片等资源
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
