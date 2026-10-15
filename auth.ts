import NextAuth from "next-auth";
import Credentials from "next-auth/providers/credentials";
import Google from "next-auth/providers/google";
import { verifyOtp } from "@/lib/otp-store";

export const { handlers, signIn, signOut, auth } = NextAuth({
  trustHost: true,        // 👈 کلید اصلی
  // AUTH_URL رو پاک کن تا داینامیک بشه
  secret: process.env.AUTH_SECRET,
  providers: [
    Google({
      clientId: process.env.AUTH_GOOGLE_ID,
      clientSecret: process.env.AUTH_GOOGLE_SECRET,
      // allowDangerousEmailAccountLinking رو لازم نداری اگه حساب‌ها جدا هستن
    }),
    Credentials({
      id: "phone-otp",
      name: "Phone OTP",
      credentials: {
        mobile: { label: "Mobile", type: "text" },
        code: { label: "Code", type: "text" },
      },
      async authorize(credentials) {
        const mobile = credentials?.mobile as string;
        const code = credentials?.code as string;
        if (!mobile || !code) return null;
        if (!verifyOtp(mobile, code)) return null;
        return {
          id: mobile,
          name: mobile,
          email: `${mobile}@phone.local`,
        };
      },
    }),
  ],
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.uid = user.id;
        token.phone = user.name;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as any).id = token.uid as string;
        (session.user as any).phone = token.phone as string;
      }
      return session;
    },
  },
});