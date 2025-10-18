import { detectGeoInfo } from "./ip-detection";

/**
 * 服务器端地理位置缓存
 */
const serverGeoCache = new Map<string, { data: any; timestamp: number }>();
const SERVER_CACHE_DURATION = 60 * 60 * 1000; // 1小时

/**
 * 从请求中获取地理信息（服务器端缓存版本）
 * @param request Request对象
 * @returns 地理信息对象
 */
export async function getGeoInfoFromRequest(request: Request) {
  // 获取IP
  const forwarded = request.headers.get("x-forwarded-for");
  const realIp = request.headers.get("x-real-ip");
  const ip = forwarded ? forwarded.split(",")[0].trim() : realIp || "127.0.0.1";

  // 本地开发直接返回默认值
  if (ip === "127.0.0.1" || ip === "::1") {
    return detectGeoInfo("US");
  }

  // 检查服务器缓存
  const cached = serverGeoCache.get(ip);
  if (cached && Date.now() - cached.timestamp < SERVER_CACHE_DURATION) {
    return cached.data;
  }

  // 缓存失效，获取地理信息
  let countryCode = "US";
  try {
    const data = await fetchGeoDataWithRetry(ip);
    countryCode = data.country_code || "US";

    // 缓存结果
    serverGeoCache.set(ip, {
      data: detectGeoInfo(countryCode),
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error("地理检测失败，使用默认值:", error);
    // 出错时也缓存，避免频繁失败
    serverGeoCache.set(ip, {
      data: detectGeoInfo("US"),
      timestamp: Date.now(),
    });
  }

  return detectGeoInfo(countryCode);
}

/**
 * 带重试机制的地理数据获取
 */
async function fetchGeoDataWithRetry(ip: string, maxRetries = 2) {
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

      return data;
    } catch (error) {
      lastError = error as Error;
      console.warn(`地理数据获取失败 (尝试 ${attempt}/${maxRetries}):`, error);

      if (attempt < maxRetries) {
        await new Promise((resolve) => setTimeout(resolve, 500));
      }
    }
  }

  throw lastError || new Error("所有重试都失败");
}
