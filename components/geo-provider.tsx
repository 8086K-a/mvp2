"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import {
  GeoLocation,
  getCachedGeoLocation,
  setCachedGeoLocation,
  clearGeoCache,
} from "@/lib/ip-detection";

/**
 * 地理位置上下文接口
 */
interface GeoContextType {
  location: GeoLocation | null;
  isLoading: boolean;
  error: string | null;
  refreshLocation: () => Promise<void>;
  clearCache: () => void;
}

/**
 * 地理位置上下文
 */
const GeoContext = createContext<GeoContextType | undefined>(undefined);

/**
 * 地理位置Provider组件
 * 在应用挂载时请求一次地理位置信息并缓存
 */
export function GeoProvider({ children }: { children: ReactNode }) {
  const [location, setLocation] = useState<GeoLocation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * 获取地理位置信息
   * 优先使用缓存，缓存失效则请求API
   */
  const fetchGeoLocation = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // 首先检查缓存
      const cachedLocation = getCachedGeoLocation();
      if (cachedLocation) {
        console.log("Using cached geo location:", cachedLocation);
        setLocation(cachedLocation);
        setIsLoading(false);
        return;
      }

      // 缓存不存在或已过期，请求API
      console.log("Fetching fresh geo location from API...");
      const response = await fetch("/api/geo/detect");

      if (!response.ok) {
        throw new Error(`地理位置检测失败: ${response.status}`);
      }

      const data: GeoLocation = await response.json();

      // 检查是否是回退数据
      const isFallback = response.headers.get("X-Geo-Fallback") === "true";
      if (isFallback) {
        console.warn("Using fallback geo location data");
      }

      // 缓存地理位置信息
      setCachedGeoLocation(data);
      setLocation(data);

      console.log("Geo location fetched and cached:", data);
    } catch (err) {
      console.error("获取地理位置失败:", err);
      const errorMessage = err instanceof Error ? err.message : "未知错误";
      setError(errorMessage);

      // 如果有缓存数据，即使API失败也使用缓存
      const cachedLocation = getCachedGeoLocation();
      if (cachedLocation) {
        console.log("Falling back to cached geo location due to API error");
        setLocation(cachedLocation);
      }
    } finally {
      setIsLoading(false);
    }
  };

  /**
   * 刷新地理位置信息（强制重新获取）
   */
  const refreshLocation = async () => {
    console.log("Manually refreshing geo location...");
    clearGeoCache(); // 清除缓存
    await fetchGeoLocation();
  };

  /**
   * 清除地理位置缓存
   */
  const clearCache = () => {
    console.log("Clearing geo location cache...");
    clearGeoCache();
    setLocation(null);
  };

  // 组件挂载时获取地理位置
  useEffect(() => {
    fetchGeoLocation();
  }, []);

  const value: GeoContextType = {
    location,
    isLoading,
    error,
    refreshLocation,
    clearCache,
  };

  return <GeoContext.Provider value={value}>{children}</GeoContext.Provider>;
}

/**
 * 使用地理位置信息的Hook
 * @returns 地理位置上下文
 */
export function useGeo(): GeoContextType {
  const context = useContext(GeoContext);
  if (context === undefined) {
    throw new Error("useGeo必须在GeoProvider内部使用");
  }
  return context;
}
