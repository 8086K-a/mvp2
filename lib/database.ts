import { PrismaClient } from "@prisma/client";

/**
 * 数据库连接管理
 * 支持多租户：中国用户使用腾讯CloudBase，海外用户使用Supabase
 */

// 使用Map存储不同区域的Prisma客户端实例
const prismaClients = new Map<string, PrismaClient>();

// 默认数据库URL（海外Supabase）
const DEFAULT_DATABASE_URL = process.env.DATABASE_URL;

// 中国CloudBase数据库URL
const CHINA_DATABASE_URL = process.env.CLOUDBASE_DATABASE_URL;

/**
 * 获取数据库URL
 * @param regionCategory 区域分类：'china' 或 'overseas'
 * @returns 数据库连接URL
 */
function getDatabaseUrl(regionCategory: "china" | "overseas"): string {
  if (regionCategory === "china" && CHINA_DATABASE_URL) {
    return CHINA_DATABASE_URL;
  }
  return DEFAULT_DATABASE_URL || "postgresql://localhost:5432/defaultdb";
}

/**
 * 创建Prisma客户端
 * @param regionCategory 区域分类
 * @returns PrismaClient实例
 */
function createPrismaClient(regionCategory: "china" | "overseas" = "overseas") {
  const url = getDatabaseUrl(regionCategory);

  return new PrismaClient({
    datasourceUrl: url,
    log:
      process.env.NODE_ENV === "development"
        ? ["query", "error", "warn"]
        : ["error"],
  });
}

/**
 * 获取Prisma客户端（按区域缓存）
 * @param regionCategory 区域分类，默认为'overseas'
 * @returns PrismaClient实例
 */
export function getPrismaClient(
  regionCategory: "china" | "overseas" = "overseas"
) {
  // 服务器端检查
  if (typeof globalThis === "undefined") {
    throw new Error("Prisma客户端只能在服务器端使用");
  }

  const cacheKey = regionCategory;

  if (!prismaClients.has(cacheKey)) {
    prismaClients.set(cacheKey, createPrismaClient(regionCategory));
  }

  return prismaClients.get(cacheKey)!;
}

/**
 * 根据地理信息获取Prisma客户端
 * @param geoInfo 地理信息对象
 * @returns PrismaClient实例
 */
export function getPrismaClientByGeo(geoInfo: {
  regionCategory: "china" | "overseas";
}) {
  return getPrismaClient(geoInfo.regionCategory);
}

// 导出默认客户端（海外）
export const prisma = getPrismaClient("overseas");
