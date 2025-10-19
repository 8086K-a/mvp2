import NextAuth, { AuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { getPrismaClient } from "@/lib/database";
import { getGeoInfoFromRequest } from "@/lib/geo-utils";
import bcrypt from "bcryptjs";

/**
 * 获取当前请求的地理信息和对应数据库客户端
 */
async function getGeoAndPrisma(request: Request) {
  const geoInfo = await getGeoInfoFromRequest(request);
  const prisma = getPrismaClient(geoInfo.regionCategory);
  return { geoInfo, prisma };
}

export const authOptions: AuthOptions = {
  session: { strategy: "jwt" },
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" },
      },
      authorize: async (credentials, request) => {
        if (!credentials?.email || !credentials?.password) return null;

        // 获取地理信息和数据库客户端
        const { geoInfo, prisma } = await getGeoAndPrisma(request as any);

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        });
        if (!user) return null;
        const valid = await bcrypt.compare(credentials.password, user.password);
        if (!valid) return null;
        return {
          id: user.id,
          name: user.name ?? null,
          email: user.email,
          regionCategory: geoInfo.regionCategory, // 添加区域信息到用户对象
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile, user, session, trigger }) {
      if (token?.email) {
        // 从user对象获取区域信息，如果没有则默认为海外
        const regionCategory = (user as any)?.regionCategory || "overseas";
        const prisma = getPrismaClient(regionCategory);

        const dbUser = await prisma.user.findUnique({
          where: { email: token.email },
        });
        if (dbUser) {
          token.userId = dbUser.id;
          (token as any).subscriptionTier = dbUser.subscriptionTier;
          (token as any).paymentMethod = dbUser.paymentMethod;
          (token as any).regionCategory = regionCategory; // 存储区域信息到token
        }
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = (token as any).userId;
        (session.user as any).subscriptionTier = (
          token as any
        ).subscriptionTier;
        (session.user as any).paymentMethod = (token as any).paymentMethod;
        (session.user as any).regionCategory = (token as any).regionCategory;
      }
      return session;
    },
  },
};

const handler = NextAuth(authOptions);
export { handler as GET, handler as POST };
