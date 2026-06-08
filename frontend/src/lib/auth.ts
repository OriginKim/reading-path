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
        token.providerId = account.providerAccountId;
        token.profileImage = (profile as { picture?: string }).picture;
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        (session.user as { providerId?: string }).providerId = token.providerId as string;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
};
