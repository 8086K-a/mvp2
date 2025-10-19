import { getPrismaClient } from "@/lib/database";
import { getGeoInfoFromRequest } from "@/lib/geo-utils";
import { z } from "zod";

const CheckEmailSchema = z.object({
  email: z.string().email(),
});

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email } = CheckEmailSchema.parse(body);

    // 获取地理信息和数据库客户端
    const geoInfo = await getGeoInfoFromRequest(request);
    const prisma = getPrismaClient(geoInfo.regionCategory);

    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) {
      return new Response(JSON.stringify({ exists: true }), { status: 200 });
    } else {
      return new Response(JSON.stringify({ exists: false }), { status: 200 });
    }
  } catch (err: any) {
    const message = err?.message ?? "Invalid request";
    return new Response(JSON.stringify({ error: message }), { status: 400 });
  }
}