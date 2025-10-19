/**
 * 数据迁移脚本：从Supabase迁移到腾讯CloudBase
 * 使用方法：
 * 1. 设置环境变量：DATABASE_URL（Supabase）和CLOUDBASE_DATABASE_URL（CloudBase）
 * 2. 运行：npx tsx scripts/migrate-to-cloudbase.ts
 */

import { PrismaClient } from "@prisma/client";
import { getPrismaClient } from "../lib/database";

async function migrateData() {
  console.log("开始数据迁移...");

  // 源数据库（Supabase）
  const sourcePrisma = new PrismaClient({
    datasourceUrl: process.env.DATABASE_URL,
  });

  // 目标数据库（CloudBase）
  const targetPrisma = getPrismaClient("china");

  try {
    // 迁移User表
    console.log("迁移用户数据...");
    const users = await sourcePrisma.user.findMany();
    console.log(`找到 ${users.length} 个用户`);

    for (const user of users) {
      try {
        await targetPrisma.user.create({
          data: {
            id: user.id,
            name: user.name,
            email: user.email,
            password: user.password,
            subscriptionTier: user.subscriptionTier,
            subscriptionId: user.subscriptionId,
            paymentMethod: user.paymentMethod,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
          },
        });
        console.log(`迁移用户: ${user.email}`);
      } catch (error) {
        console.error(`迁移用户失败 ${user.email}:`, error);
      }
    }

    console.log("数据迁移完成！");

    // 验证迁移结果
    const migratedCount = await targetPrisma.user.count();
    console.log(`CloudBase中的用户数量: ${migratedCount}`);
  } catch (error) {
    console.error("迁移失败:", error);
  } finally {
    await sourcePrisma.$disconnect();
    await targetPrisma.$disconnect();
  }
}

// 运行迁移
if (require.main === module) {
  migrateData()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { migrateData };
