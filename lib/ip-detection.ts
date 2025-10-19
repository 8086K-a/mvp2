// lib/ip-detection.ts

// 欧洲国家代码列表（EU + EEA + UK + 瑞士）
export const EUROPEAN_COUNTRIES = [
  // EU 成员国 (27个)
  "AT",
  "BE",
  "BG",
  "HR",
  "CY",
  "CZ",
  "DK",
  "EE",
  "FI",
  "FR",
  "DE",
  "GR",
  "HU",
  "IE",
  "IT",
  "LV",
  "LT",
  "LU",
  "MT",
  "NL",
  "PL",
  "PT",
  "RO",
  "SK",
  "SI",
  "ES",
  "SE",
  // EEA 非 EU 成员
  "IS",
  "LI",
  "NO",
  // 英国（脱欧后仍需遵守部分GDPR）
  "GB",
  // 瑞士（虽非EU但数据保护法类似）
  "CH",
];

// 主流市场国家
export const TARGET_MARKETS = {
  CHINA: "CN",
  USA: "US",
  INDIA: "IN",
  SINGAPORE: "SG",
};

// 区域分类
export type Region =
  | "china"
  | "usa"
  | "india"
  | "singapore"
  | "europe"
  | "other";

// 语言类型
export type Language = "zh" | "en";

// IP地理位置信息接口
export interface GeoLocation {
  ip: string;
  countryCode: string;
  countryName: string;
  region: Region;
  language: Language;
  isEurope: boolean;
  city?: string;
  currency?: string;
  timezone?: string;
}

// 从国家代码获取区域
export function getRegionFromCountryCode(countryCode: string): Region {
  if (countryCode === TARGET_MARKETS.CHINA) return "china";
  if (countryCode === TARGET_MARKETS.USA) return "usa";
  if (countryCode === TARGET_MARKETS.INDIA) return "india";
  if (countryCode === TARGET_MARKETS.SINGAPORE) return "singapore";
  if (EUROPEAN_COUNTRIES.includes(countryCode)) return "europe";
  return "other";
}

// 从区域获取默认语言
export function getDefaultLanguage(region: Region): Language {
  if (region === "china") return "zh";
  return "en";
}

// 从国家代码获取完整地理位置信息
export function getGeoLocationFromCountryCode(
  countryCode: string
): GeoLocation {
  const region = getRegionFromCountryCode(countryCode);
  const language = getDefaultLanguage(region);
  const isEurope = region === "europe";

  return {
    ip: "", // 将由API填充
    countryCode,
    countryName: "", // 将由API填充
    region,
    language,
    isEurope,
    city: "",
    currency: "",
    timezone: "",
  };
}

// 缓存键
const GEO_CACHE_KEY = "sitehub_geo_cache";
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24小时

// 从本地缓存获取地理位置信息
export function getCachedGeoLocation(): GeoLocation | null {
  try {
    const cached = localStorage.getItem(GEO_CACHE_KEY);
    if (!cached) return null;

    const { data, timestamp } = JSON.parse(cached);
    const now = Date.now();

    // 检查缓存是否过期
    if (now - timestamp > CACHE_DURATION) {
      localStorage.removeItem(GEO_CACHE_KEY);
      return null;
    }

    return data;
  } catch (error) {
    console.warn("Failed to get cached geo location:", error);
    return null;
  }
}

// 将地理位置信息存储到本地缓存
export function setCachedGeoLocation(geo: GeoLocation): void {
  try {
    const cacheData = {
      data: geo,
      timestamp: Date.now(),
    };
    localStorage.setItem(GEO_CACHE_KEY, JSON.stringify(cacheData));
  } catch (error) {
    console.warn("Failed to cache geo location:", error);
  }
}

// 清除地理位置缓存
export function clearGeoCache(): void {
  try {
    localStorage.removeItem(GEO_CACHE_KEY);
  } catch (error) {
    console.warn("Failed to clear geo cache:", error);
  }
}

// 兼容旧接口的函数
export interface GeoInfo {
  country: string;
  regionCategory: "china" | "overseas";
  languageCode: string;
  paymentMethods: string[];
  isEurope: boolean;
  currency: string;
}

export function detectGeoInfo(countryCode: string): GeoInfo {
  const code = countryCode.toUpperCase();
  const region = getRegionFromCountryCode(code);
  const isEurope = region === "europe";

  // 中国
  if (code === "CN") {
    return {
      country: code,
      regionCategory: "china",
      languageCode: "zh-CN",
      paymentMethods: ["alipay", "wechatpay"],
      isEurope: false,
      currency: "CNY",
    };
  }

  // 欧洲国家
  if (isEurope) {
    return {
      country: code,
      regionCategory: "overseas",
      languageCode: "en-EU",
      paymentMethods: ["stripe", "paypal"],
      isEurope: true,
      currency: "EUR",
    };
  }

  // 其他海外国家
  return {
    country: code,
    regionCategory: "overseas",
    languageCode: "en-US",
    paymentMethods: ["stripe", "paypal"],
    isEurope: false,
    currency: "USD",
  };
}
