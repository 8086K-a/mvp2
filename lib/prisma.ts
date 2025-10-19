// 废弃：使用 lib/database.ts 中的 getPrismaClient 或 getPrismaClientByGeo
// 这个文件保留为了向后兼容，但建议迁移到新的数据库管理

import { getPrismaClient } from "./database";

// 默认导出海外数据库客户端（向后兼容）
export const prisma = getPrismaClient("overseas");
