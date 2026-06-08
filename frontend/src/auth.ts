import NextAuth from "next-auth";
import Google from "next-auth/providers/google";

const BACKEND_URL =
  process.env.NEXT_PUBLIC_API_URL ??
  "https://reading-path-production.up.railway.app";

export const { handlers, auth, signIn, signOut } = NextAuth({
  providers: [
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  ],
  callbacks: {
    async jwt({ token, account, profile }) {
      if (account && profile) {
        try {
          const res = await fetch(`${BACKEND_URL}/api/v1/auth/google`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              provider_id: account.providerAccountId,
              email: (profile as { email: string }).email,
              name: profile.name ?? null,
              profile_image: (profile as { picture?: string }).picture ?? null,
            }),
          });
          if (res.ok) {
            const data = await res.json();
            token.accessToken = data.access_token;
            token.userId = data.user.id;
          } else {
            console.error("[auth] FastAPI auth failed:", res.status, await res.text());
          }
        } catch (err) {
          console.error("[auth] FastAPI fetch error:", err);
        }
        token.providerId = account.providerAccountId;
      }
      return token;
    },
    async session({ session, token }) {
      session.accessToken = token.accessToken as string | undefined;
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
});
