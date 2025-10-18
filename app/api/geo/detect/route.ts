export const dynamic = "force-dynamic";

import { NextRequest, NextResponse } from "next/server";
import {
  GeoLocation,
  getGeoLocationFromCountryCode,
  getRegionFromCountryCode,
  getDefaultLanguage,
} from "@/lib/ip-detection";

// 服务器端缓存
const apiGeoCache = new Map<string, { data: GeoLocation; timestamp: number }>();
const API_CACHE_DURATION = 30 * 60 * 1000; // 30分钟

/**
 * 获取用户地理位置信息API
 * 从请求头获取真实IP，调用ipapi.co获取详细地理信息
 * 支持服务器端缓存和错误回退
 */
export async function GET(request: NextRequest) {
  try {
    // 获取真实IP，支持x-forwarded-for和x-real-ip
    const forwarded = request.headers.get("x-forwarded-for");
    const realIp = request.headers.get("x-real-ip");
    const ip = forwarded
      ? forwarded.split(",")[0].trim()
      : realIp || "127.0.0.1";

    // 本地开发默认美国
    if (ip === "127.0.0.1" || ip === "::1") {
      const defaultGeo: GeoLocation = {
        ip: "127.0.0.1",
        countryCode: "US",
        countryName: "United States",
        region: "usa",
        language: "en",
        isEurope: false,
        city: "Local Development",
        currency: "USD",
        timezone: "America/New_York",
      };
      return NextResponse.json(defaultGeo);
    }

    // 检查API缓存
    const cached = apiGeoCache.get(ip);
    if (cached && Date.now() - cached.timestamp < API_CACHE_DURATION) {
      return NextResponse.json(cached.data);
    }

    // 调用ipapi.co获取地理信息
    const apiUrl = `https://ipapi.co/${ip}/json/`;
    console.log(`Fetching geo data for IP: ${ip} from ${apiUrl}`);

    const response = await fetch(apiUrl, {
      headers: {
        "User-Agent": "MornHub/1.0",
        Accept: "application/json",
      },
      // 设置合理的超时时间
      signal: AbortSignal.timeout(5000), // 5秒超时
    });

    if (!response.ok) {
      throw new Error(`IP API responded with status: ${response.status}`);
    }

    const data = await response.json();

    // 检查API响应是否有效
    if (data.error) {
      throw new Error(`IP API error: ${data.reason}`);
    }

    // 构建完整的地理位置信息
    const countryCode = data.country_code || "US";
    const region = getRegionFromCountryCode(countryCode);
    const language = getDefaultLanguage(region);
    const isEurope = region === "europe";

    const geoLocation: GeoLocation = {
      ip,
      countryCode,
      countryName: data.country_name || "Unknown",
      region,
      language,
      isEurope,
      city: data.city,
      currency: data.currency,
      timezone: data.timezone,
    };

    // 缓存结果
    apiGeoCache.set(ip, { data: geoLocation, timestamp: Date.now() });

    console.log(`Geo detection successful:`, {
      ip,
      country: `${countryCode} (${geoLocation.countryName})`,
      region,
      language,
      isEurope,
    });

    return NextResponse.json(geoLocation);
  } catch (error) {
    console.error("IP地理位置检测失败:", error);

    // 尝试使用缓存的回退数据
    const cached = apiGeoCache.get("fallback");
    if (cached) {
      return NextResponse.json(cached.data, {
        headers: {
          "X-Geo-Fallback": "true",
        },
      });
    }

    // 错误回退：返回默认美国地理信息
    const fallbackGeo: GeoLocation = {
      ip: "unknown",
      countryCode: "US",
      countryName: "United States",
      region: "usa",
      language: "en",
      isEurope: false,
      city: "Unknown",
      currency: "USD",
      timezone: "America/New_York",
    };

    // 缓存回退数据
    apiGeoCache.set("fallback", { data: fallbackGeo, timestamp: Date.now() });

    return NextResponse.json(fallbackGeo, {
      status: 200, // 返回200以避免客户端错误
      headers: {
        "X-Geo-Fallback": "true", // 标记这是回退数据
      },
    });
  }
}
