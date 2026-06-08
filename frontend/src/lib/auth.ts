import type { NextAuthOptions } from "next-auth";
import GoogleProvider from "next-auth/providers/google";

export const authOptions: NextAuthOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account && profile) {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/v1/auth/google`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              provider_id: account.providerAccountId,
              email: (profile as { email: string }).email,
              name: profile.name ?? null,
              profile_image: (profile as { picture?: string }).picture ?? null,
            }),
          }
        );

        if (res.ok) {
          const data = await res.json();
          token.accessToken = data.access_token;
          token.userId = data.user.id;
        }

        token.providerId = account.providerAccountId;
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string | undefined;
      if (session.user) {
        session.user.providerId = token.providerId as string | undefined;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  logger: {
    error(code, metadata) {
      console.error("[NextAuth Error]", code, metadata);
    },
    warn(code) {
      console.warn("[NextAuth Warn]", code);
    },
  },
};
